import express from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { databaseRpc, requireAdminAuth, ScheduleError } from './scheduling.js';
import { dispatchReadyPush, flushPushSafely, pushWorker, sha256, validatePushSubscription } from './push.js';

export const portalOperation = (action: string, payload: unknown = {}, hash: string | null = null, id: string | null = null) =>
  databaseRpc('workshop_portal', { p_action: action, p_payload: payload, p_hash: hash, p_id: id });

function clientHash(req: express.Request) {
  const value = String(req.headers.authorization || '').replace(/^Bearer /, '');
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) throw new ScheduleError(401, 'Abra o link privado do seu agendamento.');
  return sha256(value);
}

export function portalRouter() {
  const router = express.Router();
  const route = (fn: (req: express.Request, res: express.Response) => Promise<unknown>): express.RequestHandler => async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    try { await fn(req, res); }
    catch (failure) {
      const known = failure instanceof ScheduleError;
      res.status(known ? failure.status : 503).json({ error: known ? failure.message : 'Não foi possível atualizar o atendimento. Tente novamente.' });
    }
  };
  // Overrides the legacy creation route. A repeated access token cannot create duplicates.
  router.post('/api/schedule/appointments', route(async (req, res) => {
    const token = req.body?.clientToken || randomBytes(32).toString('base64url');
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new ScheduleError(400, 'Credencial de acompanhamento inválida.');
    const { clientToken: _privateCapability, ...payload } = req.body || {};
    const item = await portalOperation('create', payload, sha256(token));
    await flushPushSafely();
    res.status(201).json({ ...item, clientToken: token });
  }));
  router.get('/api/push/config', route(async (_req, res) => res.json(await portalOperation('public_config'))));
  router.post('/api/push/dispatch', route(async (req, res) => {
    const config = await pushWorker('config');
    const provided = sha256(String(req.headers['x-workshop-worker'] || ''));
    if (!config || !timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(config.worker_hash, 'hex'))) {
      return res.status(401).json({ error: 'Acesso não autorizado.' });
    }
    res.json(await dispatchReadyPush(config));
  }));
  router.get('/api/client/appointment', route(async (req, res) => res.json(await portalOperation('get', {}, clientHash(req)))));
  router.patch('/api/client/appointment', route(async (req, res) => {
    const data = await portalOperation('change', req.body, clientHash(req));
    await flushPushSafely();
    res.json(data);
  }));
  router.post('/api/client/messages', route(async (req, res) => {
    const data = await portalOperation('message', { body: req.body?.body, requestId: req.body?.requestId }, clientHash(req));
    await flushPushSafely();
    res.json(data);
  }));
  router.post('/api/admin/presence', requireAdminAuth, route(async (_req, res) => res.json(await portalOperation('presence'))));
  router.get('/api/admin/appointments', requireAdminAuth, route(async (_req, res) => res.json(await portalOperation('admin_list'))));
  router.get('/api/admin/appointments/:id/conversation', requireAdminAuth, route(async (req, res) =>
    res.json(await portalOperation('admin_get', {}, null, String(req.params.id)))));
  router.post('/api/admin/appointments/:id/messages', requireAdminAuth, route(async (req, res) => {
    const data = await portalOperation('admin_message', { body: req.body?.body, requestId: req.body?.requestId }, null, String(req.params.id));
    await flushPushSafely();
    res.json(data);
  }));
  for (const owner of [false, true]) {
    const path = owner ? '/api/admin/push/:action' : '/api/client/push/:action';
    router.post(path, ...(owner ? [requireAdminAuth] : []), route(async (req, res) => {
      const action = String(req.params.action);
      if (!['subscribe','unsubscribe','subscription'].includes(action)) throw new ScheduleError(404, 'Operação desconhecida.');
      const hash = owner ? null : clientHash(req);
      let payload: any;
      if (action === 'subscribe') {
        const subscription = validatePushSubscription(req.body?.subscription);
        payload = { subscription, endpointHash: sha256(subscription.endpoint) };
      } else {
        if (!/^[a-f0-9]{64}$/.test(req.body?.endpointHash || '')) throw new ScheduleError(400, 'Inscrição inválida.');
        payload = { endpointHash: req.body.endpointHash };
      }
      const result = await portalOperation((owner ? 'admin_' : '') + action, payload, hash);
      if (action === 'subscribe') await flushPushSafely();
      res.json(result);
    }));
  }
  return router;
}
