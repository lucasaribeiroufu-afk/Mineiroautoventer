
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule(
 'mineiro-push-every-minute','* * * * *',
 $cron$select net.http_post(
 url:='https://autocentermineiro.vercel.app/api/push/dispatch',
 headers:=jsonb_build_object('Content-Type','application/json','x-workshop-worker',
  (select decrypted_secret from vault.decrypted_secrets where name='mineiro_push_worker_token')),
 body:='{}'::jsonb,timeout_milliseconds:=15000
 );$cron$
);

