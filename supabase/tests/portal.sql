
begin;
-- Only within this rolled-back test: exercise the reminder delivery gate.
update workshop_private.push_config set scheduler_enabled=true;
set local role service_role;
do $test$
declare first jsonb; second jsonb; state jsonb; item jsonb; jobs jsonb; failed boolean; owner_sub uuid; client_sub uuid; message_key uuid=gen_random_uuid();
begin
 first=public.workshop_portal('create','{"clientName":"TESTE TRANSACIONAL PORTAL","whatsapp":"00000000000","vehicleModel":"TESTE","vehicleYear":"2020","serviceName":"Alinhamento","preferredDate":"2030-01-07","preferredTime":"08:00"}',repeat('a',64));
 second=public.workshop_portal('create','{"clientName":"TESTE ISOLAMENTO","whatsapp":"00000000000","vehicleModel":"TESTE","vehicleYear":"2020","serviceName":"Alinhamento","preferredDate":"2030-01-07","preferredTime":"09:00"}',repeat('b',64));
 item=public.workshop_portal('create','{}',repeat('a',64));
 if first->>'id'<>item->>'id' then raise exception 'Idempotency failed'; end if;
 failed=false;
 begin perform public.workshop_portal('get','{}',repeat('c',64));
 exception when sqlstate 'P0002' then failed=true; end;
 if not failed then raise exception 'Invalid token accepted'; end if;
 state=public.workshop_portal('get','{}',repeat('b',64),first->>'id');
 if state->'appointment'->>'id'<>second->>'id' then raise exception 'Cross-client access'; end if;
 perform public.workshop_schedule('update','{"internalNotes":"PRIVATE"}',first->>'id');
 item=public.workshop_portal('create','{}',repeat('a',64));
 if item ? 'internalNotes' then raise exception 'Private notes leak via create retry'; end if;
 state=public.workshop_portal('get','{}',repeat('a',64));
 if state->'appointment' ? 'internalNotes' then raise exception 'Private notes leak via get'; end if;
 perform public.workshop_portal('presence');
 state=public.workshop_portal('message',jsonb_build_object('body','Teste de conversa','requestId',message_key),repeat('a',64));
 perform public.workshop_portal('message',jsonb_build_object('body','Teste de conversa','requestId',message_key),repeat('a',64));
 if (select count(*) from public.workshop_messages where appointment_id=first->>'id')<>1 then raise exception 'Message retry duplicated'; end if;
 if not exists(select from jsonb_array_elements(public.workshop_portal('admin_list')) v where v->>'id'=first->>'id' and (v->>'awaitingReply')::boolean) then raise exception 'Inbox missing pending client reply'; end if;
 if not (state->>'staffOnline')::boolean then raise exception 'Presence failed'; end if;
 state=public.workshop_portal('admin_message','{"body":"Resposta de teste"}',null,first->>'id');
 if exists(select from jsonb_array_elements(public.workshop_portal('admin_list')) v where v->>'id'=first->>'id' and (v->>'awaitingReply')::boolean) then raise exception 'Inbox still waiting after owner reply'; end if;
 if jsonb_array_length(state->'messages')<>2 then raise exception 'Reply missing'; end if;
 insert into public.workshop_push_subscriptions(recipient_role,endpoint_hash,subscription)
  values('owner','test-owner','{"endpoint":"https://fcm.googleapis.com/test","keys":{}}') returning id into owner_sub;
 insert into public.workshop_push_subscriptions(appointment_id,recipient_role,endpoint_hash,subscription)
  values(first->>'id','client','test-client','{"endpoint":"https://fcm.googleapis.com/test","keys":{}}') returning id into client_sub;
 item=public.workshop_schedule('update','{"status":"confirmado"}',first->>'id');
 if (select count(*) from public.workshop_push_queue where appointment_id=first->>'id' and kind='status')<>2 then raise exception 'Status notification pair missing'; end if;
 update public.workshop_notification_jobs set due_at=now()-interval '1 second' where appointment_id=first->>'id' and status='blocked';
 jobs=public.workshop_push_worker('claim');
 if (select count(*) from public.workshop_push_queue where appointment_id=first->>'id' and kind='reminder')<>2 then raise exception 'Reminder pair missing'; end if;
 state=public.workshop_portal('get','{}',repeat('a',64));
 perform public.workshop_portal('change',jsonb_build_object('action','reschedule','revision',state->'revision','date','2030-01-08','time','10:00'),repeat('a',64));
 state=public.workshop_portal('get','{}',repeat('a',64));
 if state->'appointment'->>'status'<>'novo' or state->'appointment'->>'preferredDate'<>'2030-01-08' then raise exception 'Reschedule must request reconfirmation'; end if;
 if exists(select from public.workshop_push_queue where appointment_id=first->>'id' and kind='reminder' and status<>'cancelled') then raise exception 'Stale reminders survived'; end if;
 failed=false;
 begin perform public.workshop_portal('change','{"action":"cancel","revision":1}',repeat('a',64));
 exception when sqlstate 'P0003' then failed=true; end;
 if not failed then raise exception 'Stale client change accepted'; end if;
 perform public.workshop_portal('change',jsonb_build_object('action','cancel','revision',state->'revision'),repeat('a',64));
 failed=false;
 begin perform public.workshop_schedule('update',jsonb_build_object('status','confirmado','revision',state->'revision'),first->>'id');
 exception when sqlstate 'P0003' then failed=true; end;
 if not failed then raise exception 'Stale admin overwrite accepted'; end if;
 failed=false;
 begin perform public.workshop_portal('message','{"body":"should fail"}',repeat('a',64));
 exception when sqlstate 'P0001' then failed=true; end;
 if not failed then raise exception 'Closed conversation accepted messages'; end if;
end $test$;
rollback;
select 'PASS: access isolation, idempotency, private notes, chat, presence, revisions, notifications, reschedule and cancellation' as result;

