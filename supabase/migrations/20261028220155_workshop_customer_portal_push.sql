
create schema if not exists workshop_private;
revoke all on schema workshop_private from public,anon,authenticated;
grant usage on schema workshop_private to service_role;
create table workshop_private.push_config(
 id boolean primary key default true check(id),
 public_key text not null, private_key text not null, worker_hash text not null,
 subject text not null default 'https://autocentermineiro.vercel.app'
);
grant select on workshop_private.push_config to service_role;
create table public.workshop_client_access(
 appointment_id text primary key references public.workshop_appointments(id) on delete cascade,
 token_hash text unique not null check(length(token_hash)=64),
 expires_at timestamptz not null default now()+interval '180 days'
);
create table public.workshop_messages(
 id uuid primary key default gen_random_uuid(),
 appointment_id text not null references public.workshop_appointments(id) on delete cascade,
 sender_role text not null check(sender_role in ('client','owner')),
 body text not null check(length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index workshop_messages_appointment_idx on public.workshop_messages(appointment_id,created_at);
create table public.workshop_presence(
 id boolean primary key default true check(id), last_seen timestamptz not null default now()
);
create table public.workshop_push_subscriptions(
 id uuid primary key default gen_random_uuid(),
 appointment_id text references public.workshop_appointments(id) on delete cascade,
 recipient_role text not null check(recipient_role in ('client','owner')),
 endpoint_hash text not null, subscription jsonb not null,
 active boolean not null default true, created_at timestamptz not null default now(),
 check((recipient_role='owner' and appointment_id is null) or (recipient_role='client' and appointment_id is not null)),
 unique(appointment_id,endpoint_hash)
);
create unique index workshop_push_owner_endpoint_idx on public.workshop_push_subscriptions(endpoint_hash) where recipient_role='owner';
create index workshop_push_subscription_appointment_idx on public.workshop_push_subscriptions(appointment_id) where active;
create table public.workshop_push_queue(
 id uuid primary key default gen_random_uuid(),
 subscription_id uuid not null references public.workshop_push_subscriptions(id) on delete cascade,
 appointment_id text references public.workshop_appointments(id) on delete cascade,
 revision integer, kind text not null check(kind in ('request','status','message','reminder','test')),
 event_key text not null, due_at timestamptz not null default now(),
 status text not null default 'queued' check(status in ('queued','processing','sent','failed','cancelled')),
 attempts integer not null default 0, claimed_at timestamptz, accepted_at timestamptz, last_error text,
 unique(subscription_id,event_key)
);
create index workshop_push_queue_due_idx on public.workshop_push_queue(due_at) where status='queued';
create index workshop_push_queue_subscription_idx on public.workshop_push_queue(subscription_id);
create index workshop_push_queue_appointment_idx on public.workshop_push_queue(appointment_id);
alter table public.workshop_client_access enable row level security;
alter table public.workshop_messages enable row level security;
alter table public.workshop_presence enable row level security;
alter table public.workshop_push_subscriptions enable row level security;
alter table public.workshop_push_queue enable row level security;
revoke all on public.workshop_client_access,public.workshop_messages,public.workshop_presence,public.workshop_push_subscriptions,public.workshop_push_queue from anon,authenticated;
grant select,insert,update,delete on public.workshop_client_access,public.workshop_messages,public.workshop_presence,public.workshop_push_subscriptions,public.workshop_push_queue to service_role;

create function public.workshop_push_appointment_event() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then
  insert into public.workshop_push_queue(subscription_id,appointment_id,revision,kind,event_key)
  select id,new.id,new.revision,'request','request:'||new.id from public.workshop_push_subscriptions where active and recipient_role='owner';
 elsif (new.data->>'status',new.data->>'preferredDate',new.data->>'preferredTime') is distinct from
       (old.data->>'status',old.data->>'preferredDate',old.data->>'preferredTime') then
  update public.workshop_push_queue set status='cancelled' where appointment_id=new.id and kind='reminder' and status in ('queued','processing');
  insert into public.workshop_push_queue(subscription_id,appointment_id,revision,kind,event_key)
  select id,new.id,new.revision,'status','status:'||new.id||':'||new.revision from public.workshop_push_subscriptions
   where active and (recipient_role='owner' or appointment_id=new.id);
 end if;
 return new;
end $$;
revoke execute on function public.workshop_push_appointment_event() from public,anon,authenticated;
grant execute on function public.workshop_push_appointment_event() to service_role;
create trigger workshop_push_appointment after insert or update on public.workshop_appointments
 for each row execute function public.workshop_push_appointment_event();

create function public.workshop_portal(p_action text,p_payload jsonb default '{}'::jsonb,p_hash text default null,p_id text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.workshop_appointments; item jsonb; message_id uuid; sub_id uuid; role_name text; target_id text; c integer; m jsonb;
begin
 if p_action='public_config' then
  return coalesce((select jsonb_build_object('enabled',true,'publicKey',public_key) from workshop_private.push_config where id),'{"enabled":false}'::jsonb);
 end if;
 if p_action='create' then
  if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception using errcode='P0001',message='Credencial inválida.'; end if;
  -- Same capability is an idempotency key. Serialize repeated requests before checking it.
  perform pg_advisory_xact_lock(hashtextextended(p_hash,0));
  select appointment_id into target_id from public.workshop_client_access where token_hash=p_hash;
  if target_id is not null then
   select data||jsonb_build_object('id',id,'createdAt',created_at,'updatedAt',updated_at) into item from public.workshop_appointments where id=target_id;
   return item;
  end if;
  item=public.workshop_schedule('create',p_payload);
  insert into public.workshop_client_access(appointment_id,token_hash) values(item->>'id',p_hash);
  return item;
 end if;
 if p_action='presence' then
  insert into public.workshop_presence(id,last_seen) values(true,now()) on conflict(id) do update set last_seen=now();
  return '{"success":true}'::jsonb;
 end if;
 role_name=case when p_action like 'admin_%' then 'owner' else 'client' end;
 target_id=p_id;
 if role_name='client' then
  select appointment_id into target_id from public.workshop_client_access where token_hash=p_hash and expires_at>now();
  if target_id is null then raise exception using errcode='P0002',message='Link inválido ou expirado.'; end if;
 end if;
 if p_action in ('change','message','admin_message') then
  -- Same lock order as the original scheduling function, avoiding update races/deadlocks.
  perform 1 from public.workshop_schedule_config where id for update;
 end if;
 if target_id is not null then select * into a from public.workshop_appointments where id=target_id; end if;
 if p_action in ('get','change','message','admin_get','admin_message') and a.id is null then
  raise exception using errcode='P0002',message='Agendamento não encontrado.';
 end if;
 if p_action='change' then
  if coalesce((p_payload->>'revision')::integer,0)<>a.revision then
   raise exception using errcode='P0003',message='O agendamento mudou. Atualize antes de continuar.';
  end if;
  if a.data->>'status' in ('cancelado','concluido') or
   ((a.data->>'preferredDate'||' '||(a.data->>'preferredTime'))::timestamp at time zone 'America/Sao_Paulo')<=now()
  then raise exception using errcode='P0001',message='Este atendimento não pode mais ser alterado pelo link. Fale com a oficina.'; end if;
  if p_payload->>'action'='cancel' then
   perform public.workshop_schedule('update','{"status":"cancelado"}'::jsonb,a.id);
  elsif p_payload->>'action'='reschedule' then
   perform public.workshop_schedule('update',jsonb_build_object('preferredDate',p_payload->>'date','preferredTime',p_payload->>'time','status','novo'),a.id);
  else raise exception using errcode='P0001',message='Alteração inválida.'; end if;
 end if;
 if p_action in ('message','admin_message') then
  if a.data->>'status' in ('cancelado','concluido') then raise exception using errcode='P0001',message='Conversa encerrada para este atendimento.'; end if;
  if length(trim(coalesce(p_payload->>'body',''))) not between 1 and 2000 then
   raise exception using errcode='P0001',message='Escreva uma mensagem com até 2000 caracteres.'; end if;
  select count(*) into c from public.workshop_messages where appointment_id=a.id and sender_role=role_name and created_at>now()-interval '1 minute';
  if c>=6 then raise exception using errcode='P0004',message='Aguarde um minuto antes de enviar mais mensagens.'; end if;
  insert into public.workshop_messages(appointment_id,sender_role,body) values(a.id,role_name,trim(p_payload->>'body')) returning id into message_id;
  insert into public.workshop_push_queue(subscription_id,appointment_id,revision,kind,event_key)
   select id,a.id,a.revision,'message','message:'||message_id from public.workshop_push_subscriptions
    where active and ((role_name='client' and recipient_role='owner') or (role_name='owner' and appointment_id=a.id));
 end if;
 if p_action in ('subscribe','admin_subscribe') then
  if p_payload->>'endpointHash' !~ '^[a-f0-9]{64}$' or jsonb_typeof(p_payload->'subscription')<>'object' then
   raise exception using errcode='P0001',message='Inscrição inválida.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(coalesce(target_id,'owner'),1));
  select id into sub_id from public.workshop_push_subscriptions where recipient_role=role_name
   and appointment_id is not distinct from target_id and endpoint_hash=p_payload->>'endpointHash';
  if sub_id is null then
   select count(*) into c from public.workshop_push_subscriptions where recipient_role=role_name and appointment_id is not distinct from target_id and active;
   if c>=10 then raise exception using errcode='P0001',message='Limite de aparelhos atingido. Desative um aparelho antes de adicionar outro.'; end if;
   insert into public.workshop_push_subscriptions(appointment_id,recipient_role,endpoint_hash,subscription)
    values(target_id,role_name,p_payload->>'endpointHash',p_payload->'subscription') returning id into sub_id;
  else update public.workshop_push_subscriptions set active=true,subscription=p_payload->'subscription' where id=sub_id; end if;
  insert into public.workshop_push_queue(subscription_id,appointment_id,kind,event_key)
   values(sub_id,target_id,'test','test:'||gen_random_uuid());
  return '{"subscribed":true}'::jsonb;
 end if;
 if p_action in ('unsubscribe','admin_unsubscribe','subscription','admin_subscription') then
  if p_action in ('unsubscribe','admin_unsubscribe') then
   update public.workshop_push_subscriptions set active=false where recipient_role=role_name and appointment_id is not distinct from target_id and endpoint_hash=p_payload->>'endpointHash';
  end if;
  return jsonb_build_object('subscribed',exists(select from public.workshop_push_subscriptions where recipient_role=role_name
   and appointment_id is not distinct from target_id and endpoint_hash=p_payload->>'endpointHash' and active));
 end if;
 if p_action not in ('get','change','message','admin_get','admin_message') then raise exception using errcode='P0001',message='Operação inválida.'; end if;
 select * into a from public.workshop_appointments where id=target_id;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at),'[]'::jsonb) into m from
  (select id,sender_role,body,created_at from public.workshop_messages where appointment_id=target_id order by created_at desc limit 100) q;
 return jsonb_build_object('appointment',a.data-'internalNotes'||jsonb_build_object('id',a.id),'revision',a.revision,'messages',m,
  'staffOnline',exists(select from public.workshop_presence where id and last_seen>now()-interval '45 seconds'));
end $$;
revoke execute on function public.workshop_portal(text,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.workshop_portal(text,jsonb,text,text) to service_role;

create function public.workshop_push_worker(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare rows jsonb; target uuid;
begin
 if p_action='config' then return (select to_jsonb(c)-'id' from workshop_private.push_config c where id); end if;
 if p_action='claim' then
  -- Materialize the legacy per-recipient reminders into per-device, idempotent deliveries.
  insert into public.workshop_push_queue(subscription_id,appointment_id,revision,kind,event_key,due_at)
  select s.id,j.appointment_id,j.appointment_revision,'reminder','reminder:'||j.id,j.due_at
   from public.workshop_notification_jobs j
   join public.workshop_appointments a on a.id=j.appointment_id and a.revision=j.appointment_revision
   join public.workshop_push_subscriptions s on s.active and
    ((j.recipient_role='owner' and s.recipient_role='owner') or (j.recipient_role='client' and s.appointment_id=j.appointment_id))
   where j.status in ('blocked','queued','processing') and j.due_at<=now() and j.due_at>now()-interval '10 minutes'
    and a.data->>'status' in ('confirmado','remarcado')
   on conflict(subscription_id,event_key) do nothing;
  update public.workshop_push_queue set status=case when attempts<3 then 'queued' else 'failed' end,
   last_error='Execução interrompida' where status='processing' and claimed_at<now()-interval '3 minutes';
  update public.workshop_push_queue q set status='cancelled' where status='queued' and
   (not exists(select from public.workshop_push_subscriptions s where s.id=q.subscription_id and active)
    or (kind='reminder' and (due_at<now()-interval '10 minutes' or not exists(
      select from public.workshop_appointments a where a.id=q.appointment_id and a.revision=q.revision and a.data->>'status' in ('confirmado','remarcado')))));
  with candidates as (
   select id from public.workshop_push_queue where status='queued' and due_at<=now() order by due_at for update skip locked limit 10
  ), claimed as (
   update public.workshop_push_queue q set status='processing',claimed_at=now(),attempts=attempts+1 from candidates c where q.id=c.id returning q.*
  )
  select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('subscription',s.subscription,'recipientRole',s.recipient_role)),'[]'::jsonb)
   into rows from claimed c join public.workshop_push_subscriptions s on s.id=c.subscription_id;
  return rows;
 end if;
 if p_action='check' then
  return jsonb_build_object('valid',exists(select from public.workshop_push_queue q join public.workshop_push_subscriptions s on s.id=q.subscription_id
   where q.id=(p_payload->>'id')::uuid and q.status='processing' and q.attempts=(p_payload->>'attempt')::integer and s.active and
    (q.kind<>'reminder' or exists(select from public.workshop_appointments a where a.id=q.appointment_id and a.revision=q.revision and a.data->>'status' in ('confirmado','remarcado')))));
 end if;
 if p_action='complete' then
  update public.workshop_push_queue set
   status=case when p_payload->>'result'='sent' then 'sent' when p_payload->>'result'='cancelled' then 'cancelled'
    when p_payload->>'result'='gone' or attempts>=3 then 'failed' else 'queued' end,
   accepted_at=case when p_payload->>'result'='sent' then now() else null end,
   due_at=case when p_payload->>'result'='retry' then now()+interval '1 minute' else due_at end,
   last_error=left(p_payload->>'error',160)
  where id=(p_payload->>'id')::uuid and status='processing' and attempts=(p_payload->>'attempt')::integer
  returning subscription_id into target;
  if target is not null and p_payload->>'result'='gone' then
   update public.workshop_push_subscriptions set active=false where id=target;
  end if;
  return '{"success":true}'::jsonb;
 end if;
 raise exception using errcode='P0001',message='Operação inválida.';
end $$;
revoke execute on function public.workshop_push_worker(text,jsonb) from public,anon,authenticated;
grant execute on function public.workshop_push_worker(text,jsonb) to service_role;

