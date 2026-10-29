do $migration$
declare definition text; source_filter text := $old$((j.recipient_role='owner' and s.recipient_role='owner') or (j.recipient_role='client' and s.appointment_id=j.appointment_id))$old$;
begin
 select pg_get_functiondef('public.workshop_push_worker(text,jsonb)'::regprocedure) into definition;
 if position(source_filter in definition)=0 then raise exception 'Expected reminder audience missing'; end if;
 definition=replace(definition,source_filter,$new$(j.recipient_role='owner' and s.recipient_role='owner')$new$);
 definition=replace(definition,$old$and s.active and$old$,$new$and s.active and (q.kind<>'reminder' or s.recipient_role='owner') and$new$);
 execute definition;
end $migration$;
update public.workshop_push_queue q set status='cancelled'
from public.workshop_push_subscriptions s
where q.subscription_id=s.id and q.kind='reminder' and s.recipient_role='client' and q.status in ('queued','processing');
