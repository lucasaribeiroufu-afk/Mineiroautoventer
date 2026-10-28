alter table workshop_private.push_config enable row level security;
alter table public.workshop_messages add column request_id uuid not null default gen_random_uuid();
alter table public.workshop_messages add constraint workshop_message_request_unique unique(appointment_id,sender_role,request_id);
create or replace function public.workshop_schedule(p_action text,p_payload jsonb default '{}'::jsonb,p_id text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
#variable_conflict use_variable
declare
 cfg jsonb; item jsonb; previous jsonb; result jsonb; slot jsonb; slots jsonb='[]'::jsonb;
 d date; t text; n integer; cap integer; is_open boolean; blocked boolean; available boolean;
 status_value text; appointment_id text; rev integer; start_at timestamptz;
begin
 if p_action in ('create','update','delete','config_update') then
  select settings into cfg from public.workshop_schedule_config where id=true for update;
 else
  select settings into cfg from public.workshop_schedule_config where id=true;
 end if;
 if cfg is null then raise exception using errcode='P0001',message='Configuração da agenda ausente.'; end if;
 if p_action='config' then return cfg; end if;
 if p_action='config_update' then
  if p_payload ? 'newPassword' then raise exception using errcode='P0001',message='Altere a senha pela variável ADMIN_PASSWORD no servidor.'; end if;
  cfg=cfg || (select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) from jsonb_each(p_payload) where key in ('defaultCapacityPerSlot','timeSlots','workDays','blockedPeriods'));
  if jsonb_typeof(cfg->'defaultCapacityPerSlot')<>'number' or (cfg->>'defaultCapacityPerSlot')::numeric not between 1 and 100
    or (cfg->>'defaultCapacityPerSlot')::numeric<>trunc((cfg->>'defaultCapacityPerSlot')::numeric)
    or jsonb_typeof(cfg->'timeSlots')<>'array' or jsonb_array_length(cfg->'timeSlots')=0
    or jsonb_typeof(cfg->'workDays')<>'array' or jsonb_typeof(cfg->'blockedPeriods')<>'array'
  then raise exception using errcode='P0001',message='Configuração inválida.'; end if;
  if exists(select from jsonb_array_elements_text(cfg->'timeSlots') v where v !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
    or exists(select from jsonb_array_elements_text(cfg->'workDays') v where v !~ '^[0-6]$')
    or exists(select from jsonb_array_elements(cfg->'blockedPeriods') b where jsonb_typeof(b)<>'object' or coalesce(b->>'date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
  then raise exception using errcode='P0001',message='Horários, dias ou bloqueios inválidos.'; end if;
  update public.workshop_schedule_config set settings=cfg,updated_at=now() where id=true;
  return cfg;
 end if;
 if p_action='list' then
  select coalesce(jsonb_agg(data || jsonb_build_object('id',id,'revision',revision,'createdAt',created_at,'updatedAt',updated_at) order by created_at desc),'[]'::jsonb) into result from public.workshop_appointments;
  return result;
 end if;
 if p_action in ('update','delete') then
  select data,revision into previous,rev from public.workshop_appointments where id=p_id;
  if previous is null then raise exception using errcode='P0002',message='Agendamento não encontrado.'; end if;
 end if;
 if p_action='update' and p_payload ? 'revision' and coalesce((p_payload->>'revision')::integer,-1)<>rev then raise exception using errcode='P0003',message='O atendimento foi alterado. Atualize a agenda antes de continuar.'; end if;
 if p_action='delete' then
  delete from public.workshop_appointments where id=p_id;
  return '{"success":true}'::jsonb;
 end if;
 if p_action='availability' then
  if coalesce(p_payload->>'date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception using errcode='P0001',message='Data inválida.'; end if;
  d=(p_payload->>'date')::date;
  cap=(cfg->>'defaultCapacityPerSlot')::integer;
  is_open=(cfg->'workDays') @> to_jsonb(array[extract(dow from d)::integer]) and not exists(
   select from jsonb_array_elements(cfg->'blockedPeriods') b where b->>'date'=d::text and coalesce(b->>'timeSlot','') in ('','all'));
  for t in select jsonb_array_elements_text(cfg->'timeSlots') loop
   select count(*) into n from public.workshop_appointments where data->>'preferredDate'=d::text and data->>'preferredTime'=t and data->>'status' in ('confirmado','remarcado');
   blocked=exists(select from jsonb_array_elements(cfg->'blockedPeriods') b where b->>'date'=d::text and coalesce(b->>'timeSlot','') in ('','all',t));
   available=is_open and not blocked and n<cap and ((d::text||' '||t)::timestamp at time zone 'America/Sao_Paulo')>now();
   slots=slots||jsonb_build_array(jsonb_build_object('time',t,'available',available,'capacity',cap,'bookedCount',n,'blocked',blocked));
  end loop;
  return jsonb_build_object('date',d::text,'isOpen',is_open,'defaultCapacityPerSlot',cap,'slots',slots);
 end if;
 if p_action not in ('create','update') then raise exception using errcode='P0001',message='Operação inválida.'; end if;
 if p_action='create' then
  item=jsonb_build_object('clientName',p_payload->>'clientName','whatsapp',p_payload->>'whatsapp','vehicleModel',p_payload->>'vehicleModel','vehicleYear',p_payload->>'vehicleYear','serviceName',p_payload->>'serviceName','preferredDate',p_payload->>'preferredDate','preferredTime',p_payload->>'preferredTime','notes',coalesce(p_payload->>'notes',''),'status','novo','source',case when p_payload->>'source'='whatsapp_manual' then 'whatsapp_manual' else 'site' end);
  appointment_id='AGD-'||gen_random_uuid()::text;
 else
  item=previous||(select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) from jsonb_each(p_payload) where key in ('status','preferredDate','preferredTime','internalNotes'));
  appointment_id=p_id;
  if (item->>'preferredDate',item->>'preferredTime') is distinct from (previous->>'preferredDate',previous->>'preferredTime')
   and item->>'status' in ('confirmado','remarcado') then item=item||'{"status":"remarcado"}'::jsonb; end if;
 end if;
 if exists(select from jsonb_each_text(item) e where e.key in ('clientName','whatsapp','vehicleModel','vehicleYear','serviceName','preferredDate','preferredTime') and (e.value is null or length(trim(e.value))=0 or length(e.value)>200))
  or length(coalesce(item->>'notes',''))>2000 or length(coalesce(item->>'internalNotes',''))>4000
  or coalesce(item->>'preferredDate','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  or coalesce(item->>'preferredTime','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  or length(regexp_replace(item->>'whatsapp','[^0-9]','','g')) not between 10 and 15
  or coalesce(item->>'status','') not in ('novo','confirmado','remarcado','cancelado','concluido')
 then raise exception using errcode='P0001',message='Dados do agendamento inválidos.'; end if;
 d=(item->>'preferredDate')::date; t=item->>'preferredTime'; status_value=item->>'status';
 start_at=(d::text||' '||t)::timestamp at time zone 'America/Sao_Paulo';
 -- Status-only cancellations/completions remain possible after the appointment time.
 if p_action='create' or (status_value in ('novo','confirmado','remarcado') and
  (p_action='update' and ((item->>'preferredDate',t,status_value) is distinct from (previous->>'preferredDate',previous->>'preferredTime',previous->>'status')))) then
  if start_at<=now() or not ((cfg->'workDays') @> to_jsonb(array[extract(dow from d)::integer]))
    or not ((cfg->'timeSlots') ? t)
    or exists(select from jsonb_array_elements(cfg->'blockedPeriods') b where b->>'date'=d::text and coalesce(b->>'timeSlot','') in ('','all',t))
  then raise exception using errcode='P0001',message='Data ou horário indisponível.'; end if;
  select count(*) into n from public.workshop_appointments where id<>appointment_id and data->>'preferredDate'=d::text and data->>'preferredTime'=t and data->>'status' in ('confirmado','remarcado');
  if n >= (cfg->>'defaultCapacityPerSlot')::integer then raise exception using errcode='P0003',message='Capacidade máxima atingida. Escolha outro horário.'; end if;
 end if;
 if p_action='create' then
  insert into public.workshop_appointments(id,data) values(appointment_id,item) returning revision into rev;
 else
  update public.workshop_appointments set data=item,updated_at=now(),revision=revision+1 where id=appointment_id returning revision into rev;
 end if;
 -- Cancel unsent reminders on every change; replacements have a unique revision.
 update public.workshop_notification_jobs set status='cancelled' where workshop_notification_jobs.appointment_id=appointment_id and status in ('blocked','queued','processing','failed');
 if status_value in ('confirmado','remarcado') and start_at-interval '30 minutes'>now() then
  insert into public.workshop_notification_jobs(appointment_id,appointment_revision,recipient_role,due_at)
   select appointment_id,rev,r,start_at-interval '30 minutes' from unnest(array['client','owner']) r;
 end if;
 select data||jsonb_build_object('id',id,'revision',revision,'createdAt',created_at,'updatedAt',updated_at) into result from public.workshop_appointments where id=appointment_id;
 return result;
end;
$$;
revoke execute on function public.workshop_schedule(text,jsonb,text) from public,anon,authenticated;
grant execute on function public.workshop_schedule(text,jsonb,text) to service_role;


create or replace function public.workshop_portal(p_action text,p_payload jsonb default '{}'::jsonb,p_hash text default null,p_id text default null)
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
   select (data-'internalNotes')||jsonb_build_object('id',id,'createdAt',created_at,'updatedAt',updated_at) into item from public.workshop_appointments where id=target_id;
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
  if c>=6 and not exists(select from public.workshop_messages where appointment_id=a.id and sender_role=role_name and request_id=(p_payload->>'requestId')::uuid) then raise exception using errcode='P0004',message='Aguarde um minuto antes de enviar mais mensagens.'; end if;
  insert into public.workshop_messages(appointment_id,sender_role,body,request_id) values(a.id,role_name,trim(p_payload->>'body'),coalesce((p_payload->>'requestId')::uuid,gen_random_uuid())) on conflict(appointment_id,sender_role,request_id) do nothing returning id into message_id;
  if message_id is not null then
  insert into public.workshop_push_queue(subscription_id,appointment_id,revision,kind,event_key)
   select id,a.id,a.revision,'message','message:'||message_id from public.workshop_push_subscriptions
    where active and ((role_name='client' and recipient_role='owner') or (role_name='owner' and appointment_id=a.id));
  end if;
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
  if (select count(*) from public.workshop_push_queue where subscription_id=sub_id and kind='test' and due_at>now()-interval '1 minute')>=3 then raise exception using errcode='P0004',message='Aguarde um minuto antes de testar os avisos novamente.'; end if;
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


