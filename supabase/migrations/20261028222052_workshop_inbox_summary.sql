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
 if p_action='admin_list' then
  select coalesce(jsonb_agg(ap.data||jsonb_build_object('id',ap.id,'revision',ap.revision,'createdAt',ap.created_at,'updatedAt',ap.updated_at,
   'awaitingReply',coalesce(last_message.sender_role='client',false),'lastMessageAt',last_message.created_at) order by ap.created_at desc),'[]'::jsonb)
  into item from public.workshop_appointments ap left join lateral
   (select sender_role,created_at from public.workshop_messages msg where msg.appointment_id=ap.id order by created_at desc limit 1) last_message on true;
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



