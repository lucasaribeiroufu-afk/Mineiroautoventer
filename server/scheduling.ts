import express from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';

// These credentials belong only to the server. Never use a VITE_ prefix.
const DEFAULT_URL = 'https://ehqxcwppzrjssbjkqflu.supabase.co';

export function validAdminPassword(input: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (expected.length < 12 || typeof input !== 'string') return false;
  return timingSafeEqual(createHash('sha256').update(input).digest(), createHash('sha256').update(expected).digest());
}

export const requireAdminAuth: express.RequestHandler = (req, res, next) => {
  if ((process.env.ADMIN_PASSWORD || '').length < 12) {
    res.status(503).json({ error: 'Acesso administrativo ainda não configurado.' });
    return;
  }
  if (!validAdminPassword(req.headers['x-admin-password'])) {
    res.status(401).json({ error: 'Acesso não autorizado.' });
    return;
  }
  next();
};

class ScheduleError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function scheduleOperation(action: string, payload: unknown = {}, id: string | null = null) {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new ScheduleError(503, 'Agenda temporariamente indisponível. Entre em contato pelo WhatsApp.');
  const url = new URL('/rest/v1/rpc/workshop_schedule', process.env.SUPABASE_URL || DEFAULT_URL);
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_action: action, p_payload: payload, p_id: id }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    // Never repeat a mutation automatically: a timeout may follow a successful commit.
    throw new ScheduleError(503, 'Não foi possível verificar a agenda. Confira com a oficina antes de repetir a solicitação.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const status = data?.code === 'P0002' ? 404 : data?.code === 'P0003' ? 409 : data?.code === 'P0001' || String(data?.code).startsWith('22') ? 400 : 503;
    throw new ScheduleError(status, status === 400 || status === 404 || status === 409 ? data.message : 'Agenda temporariamente indisponível.');
  }
  if (data === null) throw new ScheduleError(503, 'Resposta inválida da agenda.');
  return data;
}

type Broadcast = (type: string, payload: unknown) => void;
export function schedulingRouter(broadcast: Broadcast) {
  const router = express.Router();
  const route = (fn: (req: express.Request, res: express.Response) => Promise<unknown>): express.RequestHandler => async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try { await fn(req, res); }
    catch (error) {
      const known = error instanceof ScheduleError;
      res.status(known ? error.status : 503).json({ error: known ? error.message : 'Agenda temporariamente indisponível.' });
    }
  };
  router.get('/api/schedule/availability', route(async (req, res) => {
    res.json(await scheduleOperation('availability', { date: String(req.query.date || '') }));
  }));
  router.post('/api/schedule/appointments', route(async (req, res) => {
    const item = await scheduleOperation('create', req.body);
    broadcast('schedule_changed', { date: item.preferredDate, time: item.preferredTime });
    res.status(201).json(item);
  }));
  router.post('/api/admin/login', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if ((process.env.ADMIN_PASSWORD || '').length < 12) return res.status(503).json({ error: 'Acesso administrativo ainda não configurado.' });
    if (!validAdminPassword(req.body?.password)) return res.status(401).json({ error: 'Senha administrativa incorreta.' });
    return res.json({ success: true });
  });
  router.get('/api/admin/appointments', requireAdminAuth, route(async (_req, res) => {
    res.json(await scheduleOperation('list'));
  }));
  router.patch('/api/admin/appointments/:id', requireAdminAuth, route(async (req, res) => {
    const item = await scheduleOperation('update', req.body, String(req.params.id));
    // Both the original and replacement slot may have changed.
    broadcast('schedule_changed', {});
    res.json(item);
  }));
  router.delete('/api/admin/appointments/:id', requireAdminAuth, route(async (req, res) => {
    const result = await scheduleOperation('delete', {}, String(req.params.id));
    broadcast('schedule_changed', {});
    res.json(result);
  }));
  router.get('/api/admin/schedule-config', requireAdminAuth, route(async (_req, res) => {
    res.json(await scheduleOperation('config'));
  }));
  router.put('/api/admin/schedule-config', requireAdminAuth, route(async (req, res) => {
    const config = await scheduleOperation('config_update', req.body);
    broadcast('config_updated', config);
    res.json(config);
  }));
  return router;
}
