-- Owner alerts only for customer requests, changes and messages; reminders are separate.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('public.workshop_portal(text,jsonb,text,text)'::regprocedure) into definition;
 if position('if p_action=''change'' then' in definition)=0 then raise exception 'Client change branch missing'; end if;
 definition=replace(definition,'if p_action=''change'' then',E'if p_action=''change'' then\n  perform set_config(''workshop.client_change'',''true'',true);');
 execute definition;
end $migration$;
create or replace function public.workshop_push_appointment_event() returns trigger
language plpgsql security invoker set search_path='' as $function$
begin
 if tg_op='INSERT' then
  insert into public.workshop_push_queue(subscription_id,appointment_id,revision,kind,event_key)
  select id,new.id,new.revision,'request','request:'||new.id from public.workshop_push_subscriptions where active and recipient_role='owner';
 elsif (new.data->>'status',new.data->>'preferredDate',new.data->>'preferredTime') is distinct from
       (old.data->>'status',old.data->>'preferredDate',old.data->>'preferredTime') then
  update public.workshop_push_queue set status='cancelled' where appointment_id=new.id and kind='reminder' and status in ('queued','processing');
  insert into public.workshop_push_queue(subscription_id,appointment_id,revision,kind,event_key)
  select id,new.id,new.revision,'status','status:'||new.id||':'||new.revision from public.workshop_push_subscriptions
   where active and (appointment_id=new.id or (recipient_role='owner' and current_setting('workshop.client_change',true)='true'));
 end if;
 return new;
end $function$;
