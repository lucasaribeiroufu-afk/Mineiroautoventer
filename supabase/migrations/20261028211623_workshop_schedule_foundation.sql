
create table public.workshop_schedule_config (
 id boolean primary key default true check (id),
 settings jsonb not null,
 updated_at timestamptz not null default now()
);
insert into public.workshop_schedule_config(id,settings) values (true,
 '{"defaultCapacityPerSlot":3,"timeSlots":["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"],"workDays":[1,2,3,4,5,6],"blockedPeriods":[]}'::jsonb);

create table public.workshop_appointments (
 id text primary key,
 data jsonb not null check(jsonb_typeof(data)='object'),
 revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(data->>'status' in ('novo','confirmado','remarcado','cancelado','concluido')),
 check(data ?& array['clientName','whatsapp','vehicleModel','vehicleYear','serviceName','preferredDate','preferredTime','status'])
);
create index workshop_appointments_slot_idx on public.workshop_appointments
 ((data->>'preferredDate'), (data->>'preferredTime')) where data->>'status' in ('confirmado','remarcado');

create table public.workshop_notification_jobs (
 id uuid primary key default gen_random_uuid(),
 appointment_id text not null references public.workshop_appointments(id) on delete cascade,
 appointment_revision integer not null,
 recipient_role text not null check(recipient_role in ('client','owner')),
 kind text not null default 'reminder_30m' check(kind='reminder_30m'),
 due_at timestamptz not null,
 status text not null default 'blocked' check(status in ('blocked','queued','processing','sent','failed','cancelled')),
 provider_message_id text,
 last_error text,
 created_at timestamptz not null default now(),
 unique(appointment_id,appointment_revision,recipient_role,kind)
);
create index workshop_notification_jobs_due_idx on public.workshop_notification_jobs(due_at) where status='queued';
create index workshop_notification_jobs_appointment_idx on public.workshop_notification_jobs(appointment_id);
comment on table public.workshop_notification_jobs is 'Jobs blocked until an authenticated sender, owner destination, opt-in and templates are configured. No automatic sending is enabled.';

alter table public.workshop_schedule_config enable row level security;
alter table public.workshop_appointments enable row level security;
alter table public.workshop_notification_jobs enable row level security;
revoke all on public.workshop_schedule_config,public.workshop_appointments,public.workshop_notification_jobs from anon,authenticated;
grant select,insert,update,delete on public.workshop_schedule_config,public.workshop_appointments,public.workshop_notification_jobs to service_role;

-- All mutations serialize on the singleton config row. Called only by the trusted backend.
create function public.workshop_schedule(p_action text,p_payload jsonb default '{}'::jsonb,p_id text default null)
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
  select coalesce(jsonb_agg(data || jsonb_build_object('id',id,'createdAt',created_at,'updatedAt',updated_at) order by created_at desc),'[]'::jsonb) into result from public.workshop_appointments;
  return result;
 end if;
 if p_action in ('update','delete') then
  select data into previous from public.workshop_appointments where id=p_id;
  if previous is null then raise exception using errcode='P0002',message='Agendamento não encontrado.'; end if;
 end if;
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
 select data||jsonb_build_object('id',id,'createdAt',created_at,'updatedAt',updated_at) into result from public.workshop_appointments where id=appointment_id;
 return result;
end;
$$;
revoke execute on function public.workshop_schedule(text,jsonb,text) from public,anon,authenticated;
grant execute on function public.workshop_schedule(text,jsonb,text) to service_role;

