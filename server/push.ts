import webpush from 'web-push';
import { createHash } from 'node:crypto';
import { databaseRpc, ScheduleError } from './scheduling.js';

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export function validatePushSubscription(value: any) {
  if (!value || typeof value.endpoint !== 'string' || value.endpoint.length > 2048) throw new ScheduleError(400, 'Inscrição de notificações inválida.');
  let url: URL;
  try { url = new URL(value.endpoint); } catch { throw new ScheduleError(400, 'Endereço de notificação inválido.'); }
  const host = url.hostname;
  const allowed = host === 'fcm.googleapis.com' || host === 'web.push.apple.com' ||
    host.endsWith('.push.apple.com') || host === 'updates.push.services.mozilla.com' ||
    host.endsWith('.push.services.mozilla.com') || host.endsWith('.notify.windows.com');
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !allowed ||
    !/^[A-Za-z0-9_-]{86,90}={0,2}$/.test(value.keys?.p256dh || '') ||
    !/^[A-Za-z0-9_-]{22,24}={0,2}$/.test(value.keys?.auth || '')) {
    throw new ScheduleError(400, 'Este navegador não forneceu uma inscrição válida.');
  }
  return { endpoint: url.href, expirationTime: null, keys: { p256dh: value.keys.p256dh, auth: value.keys.auth } };
}

export const pushWorker = (action: string, payload: Record<string, unknown> = {}) =>
  databaseRpc('workshop_push_worker', { p_action: action, p_payload: payload });

export async function dispatchReadyPush(config?: any) {
  const settings = config || await pushWorker('config');
  if (!settings) return { enabled: false, accepted: 0 };
  const jobs = await pushWorker('claim');
  let accepted = 0;
  await Promise.all(jobs.map(async (job: any) => {
    let result = 'retry', error: string | undefined;
    try {
      const check = await pushWorker('check', { id: job.id, attempt: job.attempts });
      if (!check.valid) result = 'cancelled';
      else {
        const title = job.kind === 'reminder' ? 'Seu atendimento se aproxima' :
          job.kind === 'message' ? 'Nova mensagem no atendimento' :
          job.kind === 'request' ? 'Novo pedido de agendamento' :
          job.kind === 'test' ? 'Notificações ativadas' : 'Agendamento atualizado';
        const body = job.kind === 'reminder' ? 'Seu horário está próximo. Consulte os detalhes no site.' :
          job.kind === 'test' ? 'Este aparelho está pronto para receber os avisos da oficina.' :
          'Abra o site para acompanhar os detalhes com segurança.';
        const subscription = validatePushSubscription(job.subscription);
        await webpush.sendNotification(subscription, JSON.stringify({
          title, body, tag: 'mineiro-' + job.id,
          url: job.recipientRole === 'owner' ? '/#admin' : '/#meus-agendamentos',
        }), {
          TTL: job.kind === 'reminder' ? 600 : 3600, urgency: 'high', timeout: 2500,
          vapidDetails: { subject: settings.subject, publicKey: settings.public_key, privateKey: settings.private_key },
        });
        result = 'sent'; accepted++;
      }
    } catch (failure: any) {
      result = failure?.statusCode === 404 || failure?.statusCode === 410 ? 'gone' : 'retry';
      error = 'Falha no provedor de push' + (failure?.statusCode ? ' (HTTP ' + Number(failure.statusCode) + ')' : '');
    }
    await pushWorker('complete', { id: job.id, attempt: job.attempts, result, error });
  }));
  return { enabled: true, accepted };
}

export async function flushPushSafely() {
  try { await dispatchReadyPush(); } catch { /* Booking is already committed; the scheduled worker retries delivery. */ }
}
