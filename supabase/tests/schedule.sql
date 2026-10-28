
begin;
set local role service_role;
do $test$
declare d text; a jsonb; b jsonb; c jsonb; ids text[]='{}'; x text; failed boolean=false; cfg jsonb; otherdate text;
begin
 d=(current_date+((8-extract(isodow from current_date)::int)%7)+7)::text;
 cfg=public.workshop_schedule('config');
 perform public.workshop_schedule('config_update','{"defaultCapacityPerSlot":1}'::jsonb);
 a=public.workshop_schedule('create',jsonb_build_object('clientName','Teste transacional','whatsapp','34999999999','vehicleModel','Teste','vehicleYear','2020','serviceName','Alinhamento','preferredDate',d,'preferredTime','08:00'));
 b=public.workshop_schedule('create',jsonb_build_object('clientName','Teste concorrente','whatsapp','34999999998','vehicleModel','Teste','vehicleYear','2020','serviceName','Alinhamento','preferredDate',d,'preferredTime','08:00'));
 a=public.workshop_schedule('update','{"status":"confirmado"}'::jsonb,a->>'id');
 begin
  perform public.workshop_schedule('update','{"status":"confirmado"}'::jsonb,b->>'id');
 exception when sqlstate 'P0003' then failed=true;
 end;
 if not failed then raise exception 'Capacity test failed'; end if;
 if (select count(*) from public.workshop_notification_jobs where appointment_id=a->>'id' and status='blocked')<>2 then raise exception 'Reminder pair missing'; end if;
 a=public.workshop_schedule('update','{"status":"remarcado","preferredTime":"09:00"}'::jsonb,a->>'id');
 if (select count(*) from public.workshop_notification_jobs where appointment_id=a->>'id' and status='cancelled')<>2 then raise exception 'Old reminders not cancelled'; end if;
 if (select count(*) from public.workshop_notification_jobs where appointment_id=a->>'id' and status='blocked')<>2 then raise exception 'New reminders missing'; end if;
 a=public.workshop_schedule('update','{"status":"cancelado"}'::jsonb,a->>'id');
 if exists(select from public.workshop_notification_jobs where appointment_id=a->>'id' and status<>'cancelled') then raise exception 'Cancellation failed'; end if;
 failed=false;
 begin
  perform public.workshop_schedule('create',jsonb_build_object('clientName','Teste passado','whatsapp','34999999999','vehicleModel','Teste','vehicleYear','2020','serviceName','Alinhamento','preferredDate','2020-01-06','preferredTime','08:00'));
 exception when sqlstate 'P0001' then failed=true;
 end;
 if not failed then raise exception 'Past booking accepted'; end if;
end;
$test$;
rollback;
select 'capacity, revision, reschedule, cancellation, past dates: passed' as result;

