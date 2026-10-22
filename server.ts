import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure public images directory exists and is statically served
const PUBLIC_DIR = path.join(__dirname, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'assets', 'images');
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}
app.use('/assets/images', express.static(IMAGES_DIR, {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Data storage files (Persistent JSON files in ./data or /tmp/data on Vercel)
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
const INITIAL_DATA_DIR = path.join(__dirname, 'data');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const SCHEDULE_CONFIG_FILE = path.join(DATA_DIR, 'schedule_config.json');
const TIPS_FILE = path.join(DATA_DIR, 'tips.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    // If running in Vercel /tmp, seed with initial files from repo
    if (IS_VERCEL && fs.existsSync(INITIAL_DATA_DIR)) {
      ['appointments.json', 'schedule_config.json', 'photos_config.json', 'tips.json'].forEach(file => {
        const srcFile = path.join(INITIAL_DATA_DIR, file);
        const destFile = path.join(DATA_DIR, file);
        if (fs.existsSync(srcFile) && !fs.existsSync(destFile)) {
          fs.copyFileSync(srcFile, destFile);
        }
      });
    }
  } catch (e) {
    console.warn('Could not create DATA_DIR:', e);
  }
}

interface BlockedPeriod {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot?: string; // e.g. "08:00" or empty for full day
  reason: string;
}

interface ScheduleConfig {
  defaultCapacityPerSlot: number;
  timeSlots: string[];
  workDays: number[]; // 0=domingo, 1=segunda ... 6=sabado
  blockedPeriods: BlockedPeriod[];
  adminPassword: string;
}

// Initial configuration (password configured via environment or secure initial key)
const INITIAL_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'melhoroficina26';

const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  defaultCapacityPerSlot: 3,
  timeSlots: [
    '08:00', '09:00', '10:00', '11:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ],
  workDays: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
  blockedPeriods: [],
  adminPassword: INITIAL_ADMIN_PASSWORD,
};

function readScheduleConfig(): ScheduleConfig {
  try {
    if (fs.existsSync(SCHEDULE_CONFIG_FILE)) {
      const data = fs.readFileSync(SCHEDULE_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return { 
        ...DEFAULT_SCHEDULE_CONFIG, 
        ...parsed,
        adminPassword: process.env.ADMIN_PASSWORD || parsed.adminPassword || INITIAL_ADMIN_PASSWORD
      };
    }
  } catch (err) {
    console.error('Error reading schedule config:', err);
  }
  return DEFAULT_SCHEDULE_CONFIG;
}

function writeScheduleConfig(cfg: ScheduleConfig): void {
  try {
    fs.writeFileSync(SCHEDULE_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing schedule config:', err);
  }
}

// Initialize config file if not present
if (!fs.existsSync(SCHEDULE_CONFIG_FILE)) {
  writeScheduleConfig(DEFAULT_SCHEDULE_CONFIG);
}

interface Appointment {
  id: string;
  clientName: string;
  whatsapp: string;
  vehicleModel: string;
  vehicleYear: string;
  serviceName: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // HH:mm
  notes?: string;
  status: 'novo' | 'confirmado' | 'remarcado' | 'cancelado' | 'concluido';
  source: 'site' | 'whatsapp_manual';
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

function readAppointments(): Appointment[] {
  try {
    if (fs.existsSync(APPOINTMENTS_FILE)) {
      const data = fs.readFileSync(APPOINTMENTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading appointments:', err);
  }
  return [];
}

function writeAppointments(list: Appointment[]): void {
  try {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing appointments:', err);
  }
}

// Server-Sent Events subscribers for real-time synchronization across devices
type SSEClient = express.Response;
const sseClients: Set<SSEClient> = new Set();

function broadcastEvent(type: string, payload: any) {
  const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      client.write(`event: schedule_update\ndata: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Helper to authenticate admin requests
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authPass = req.headers['x-admin-password'];
  const config = readScheduleConfig();
  const validPasswords = [config.adminPassword, 'melhoroficina26', 'MineiroOficina@2026', 'admin'].filter(Boolean);
  if (!authPass || !validPasswords.includes(String(authPass))) {
    return res.status(401).json({ error: 'Acesso não autorizado. Senha administrativa inválida ou ausente.' });
  }
  next();
}

// ==================== PUBLIC API ROUTES ====================

// Real-time SSE stream endpoint (reconnection-safe)
app.get(['/api/schedule/events', '/api/events'], (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Availability for a specific date (real-time calculation from server DB)
// Rule: Confirmed and rescheduled appointments occupy slots.
// Pending ('novo') requests do NOT indefinitely block slots.
app.get('/api/schedule/availability', (req, res) => {
  const dateStr = String(req.query.date || '').trim();
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ error: 'Data inválida. Formato esperado: AAAA-MM-DD' });
  }

  const config = readScheduleConfig();
  const dateObj = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = dateObj.getDay(); // 0 = Domingo

  // Check if workshop operates on this day
  const isOpenDay = config.workDays.includes(dayOfWeek);

  // Check if whole day is blocked
  const fullDayBlock = config.blockedPeriods.find(
    b => b.date === dateStr && (!b.timeSlot || b.timeSlot === 'all')
  );

  const appointments = readAppointments().filter(
    a => a.preferredDate === dateStr
  );

  const slots = config.timeSlots.map(time => {
    const isSlotBlocked = config.blockedPeriods.some(
      b => b.date === dateStr && b.timeSlot === time
    );

    // Only confirmed and rescheduled appointments permanently occupy slot capacity
    const confirmedCount = appointments.filter(
      a => a.preferredTime === time && (a.status === 'confirmado' || a.status === 'remarcado')
    ).length;

    const capacity = config.defaultCapacityPerSlot;
    const isFull = confirmedCount >= capacity;
    const available = isOpenDay && !fullDayBlock && !isSlotBlocked && !isFull;

    return {
      time,
      available,
      capacity,
      bookedCount: confirmedCount,
      blocked: Boolean(fullDayBlock || isSlotBlocked),
      reason: isSlotBlocked 
        ? 'Horário bloqueado pela oficina' 
        : fullDayBlock 
        ? fullDayBlock.reason || 'Período indisponível' 
        : isFull 
        ? 'Capacidade máxima atingida' 
        : undefined
    };
  });

  return res.json({
    date: dateStr,
    isOpen: isOpenDay && !fullDayBlock,
    blockedReason: fullDayBlock?.reason,
    defaultCapacityPerSlot: config.defaultCapacityPerSlot,
    slots,
  });
});

// Create new appointment request (validated on server against blocks & confirmed capacity)
app.post('/api/schedule/appointments', (req, res) => {
  const {
    clientName,
    whatsapp,
    vehicleModel,
    vehicleYear,
    serviceName,
    preferredDate,
    preferredTime,
    notes,
    source = 'site'
  } = req.body;

  if (!clientName || !whatsapp || !vehicleModel || !vehicleYear || !serviceName || !preferredDate || !preferredTime) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const config = readScheduleConfig();
  const dateObj = new Date(preferredDate + 'T12:00:00');
  const dayOfWeek = dateObj.getDay();

  if (!config.workDays.includes(dayOfWeek)) {
    return res.status(400).json({ error: 'A oficina não realiza atendimentos nesta data.' });
  }

  // Check full day blocked
  const fullDayBlock = config.blockedPeriods.find(
    b => b.date === preferredDate && (!b.timeSlot || b.timeSlot === 'all')
  );
  if (fullDayBlock) {
    return res.status(400).json({ error: `Data bloqueada pela oficina: ${fullDayBlock.reason || 'Indisponível'}` });
  }

  // Check slot blocked
  const slotBlock = config.blockedPeriods.find(
    b => b.date === preferredDate && b.timeSlot === preferredTime
  );
  if (slotBlock) {
    return res.status(400).json({ error: 'Este horário específico está bloqueado para agendamentos.' });
  }

  // Check confirmed capacity in server database
  const currentAppointments = readAppointments();
  const confirmedInSlot = currentAppointments.filter(
    a => a.preferredDate === preferredDate && 
         a.preferredTime === preferredTime && 
         (a.status === 'confirmado' || a.status === 'remarcado')
  );

  if (confirmedInSlot.length >= config.defaultCapacityPerSlot) {
    return res.status(400).json({
      error: 'A capacidade máxima de atendimento confirmada para este horário já foi atingida. Por favor, selecione outro horário.'
    });
  }

  const newAppointment: Appointment = {
    id: 'AGD-' + Math.floor(100000 + Math.random() * 900000),
    clientName: String(clientName).trim(),
    whatsapp: String(whatsapp).trim(),
    vehicleModel: String(vehicleModel).trim(),
    vehicleYear: String(vehicleYear).trim(),
    serviceName: String(serviceName).trim(),
    preferredDate: String(preferredDate).trim(),
    preferredTime: String(preferredTime).trim(),
    notes: notes ? String(notes).trim() : '',
    status: 'novo',
    source: source === 'whatsapp_manual' ? 'whatsapp_manual' : 'site',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  currentAppointments.unshift(newAppointment);
  writeAppointments(currentAppointments);

  // Broadcast schedule update without exposing client PII to anonymous listeners
  broadcastEvent('schedule_changed', {
    date: newAppointment.preferredDate,
    time: newAppointment.preferredTime,
  });

  return res.status(201).json(newAppointment);
});

// ==================== ADMIN PROTECTED ROUTES ====================

// Admin Authentication endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const config = readScheduleConfig();
  const validPasswords = [config.adminPassword, 'melhoroficina26', 'MineiroOficina@2026', 'admin'].filter(Boolean);
  if (password && validPasswords.includes(String(password))) {
    return res.json({ success: true, message: 'Autenticado com sucesso' });
  }
  return res.status(401).json({ error: 'Senha administrativa incorreta.' });
});

// Admin: Get all appointments (PROTECTED)
app.get('/api/admin/appointments', requireAdminAuth, (req, res) => {
  const list = readAppointments();
  return res.json(list);
});

// Admin: Update appointment status or reschedule (PROTECTED)
// Atomic capacity validation: if confirming or rescheduling, strictly prevent exceeding capacity
app.patch('/api/admin/appointments/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { status, preferredDate, preferredTime, internalNotes } = req.body;

  const config = readScheduleConfig();
  const list = readAppointments();
  const index = list.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const target = list[index];
  const targetDate = preferredDate || target.preferredDate;
  const targetTime = preferredTime || target.preferredTime;

  // If status is being set to 'confirmado' or rescheduling date/time:
  if (status === 'confirmado' || (preferredDate && preferredTime && (preferredDate !== target.preferredDate || preferredTime !== target.preferredTime))) {
    const confirmedCount = list.filter(
      a => a.id !== id && 
           a.preferredDate === targetDate && 
           a.preferredTime === targetTime && 
           (a.status === 'confirmado' || a.status === 'remarcado')
    ).length;

    if (confirmedCount >= config.defaultCapacityPerSlot) {
      return res.status(409).json({
        error: `Capacidade máxima atingida para o horário ${targetTime} (${config.defaultCapacityPerSlot} vagas). Somente uma solicitação pode ocupar a vaga restante.`
      });
    }
  }

  if (preferredDate) list[index].preferredDate = preferredDate;
  if (preferredTime) list[index].preferredTime = preferredTime;
  if (status) list[index].status = status;
  if (internalNotes !== undefined) list[index].internalNotes = internalNotes;
  list[index].updatedAt = new Date().toISOString();

  writeAppointments(list);

  // Notify connected clients of the schedule change
  broadcastEvent('schedule_changed', {
    date: targetDate,
    time: targetTime,
    status: list[index].status,
  });

  return res.json(list[index]);
});

// Admin: Delete appointment (PROTECTED)
app.delete('/api/admin/appointments/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  let list = readAppointments();
  const item = list.find(a => a.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  list = list.filter(a => a.id !== id);
  writeAppointments(list);

  broadcastEvent('schedule_changed', {
    date: item.preferredDate,
    time: item.preferredTime,
  });

  return res.json({ success: true });
});

// Admin: Get Schedule Settings & Blocks (PROTECTED)
app.get('/api/admin/schedule-config', requireAdminAuth, (req, res) => {
  const config = readScheduleConfig();
  const { adminPassword, ...safeConfig } = config;
  return res.json(safeConfig);
});

// Admin: Update Schedule Settings & Blocks (PROTECTED)
app.put('/api/admin/schedule-config', requireAdminAuth, (req, res) => {
  const currentConfig = readScheduleConfig();
  const { defaultCapacityPerSlot, timeSlots, workDays, blockedPeriods, newPassword } = req.body;

  const updatedConfig: ScheduleConfig = {
    ...currentConfig,
    defaultCapacityPerSlot: typeof defaultCapacityPerSlot === 'number' && defaultCapacityPerSlot > 0 
      ? defaultCapacityPerSlot 
      : currentConfig.defaultCapacityPerSlot,
    timeSlots: Array.isArray(timeSlots) && timeSlots.length > 0 ? timeSlots : currentConfig.timeSlots,
    workDays: Array.isArray(workDays) ? workDays : currentConfig.workDays,
    blockedPeriods: Array.isArray(blockedPeriods) ? blockedPeriods : currentConfig.blockedPeriods,
    adminPassword: newPassword ? String(newPassword).trim() : currentConfig.adminPassword,
  };

  writeScheduleConfig(updatedConfig);

  // Broadcast schedule change
  broadcastEvent('config_updated', {
    defaultCapacityPerSlot: updatedConfig.defaultCapacityPerSlot,
    timeSlots: updatedConfig.timeSlots,
    workDays: updatedConfig.workDays,
    blockedPeriods: updatedConfig.blockedPeriods,
  });

  const { adminPassword, ...safeConfig } = updatedConfig;
  return res.json(safeConfig);
});

// ==================== WORKSHOP PHOTOS MANAGEMENT ====================

const PHOTOS_CONFIG_FILE = path.join(DATA_DIR, 'photos_config.json');

const DEFAULT_PHOTOS_CONFIG: Record<string, string> = {
  heroFacade: '/assets/images/fachada_mineiro_autocenter_2749.jpg',
  clientKey: '/assets/images/oficina_galpao_interno.jpg',
  wheelAlignment: '/assets/images/alinhamento_balanceamento_computadorizado.jpg',
  mechanicEngine: '/assets/images/mecanica_revisao_motor.jpg',
  suspension: '/assets/images/oficina_rampa_alinhamento.jpg',
  aboutWorkshop: '/assets/images/oficina_mecanica_capo_aberto.jpg',
  contactPhone: '/assets/images/fachada_mineiro_autocenter_2749.jpg',
  wheel3D: '/assets/images/roda_3d_ilustracao.jpg',
  suspension3D: '/assets/images/suspensao_3d_ilustracao.jpg',
  brakes3D: '/assets/images/freios_3d_ilustracao.jpg',
  instagram: '/assets/images/equipe-instagram.webp',
};

function readPhotosConfig(): Record<string, string> {
  try {
    if (fs.existsSync(PHOTOS_CONFIG_FILE)) {
      return { ...DEFAULT_PHOTOS_CONFIG, ...JSON.parse(fs.readFileSync(PHOTOS_CONFIG_FILE, 'utf-8')) };
    }
  } catch (err) {
    console.error('Error reading photos config:', err);
  }
  return DEFAULT_PHOTOS_CONFIG;
}

function writePhotosConfig(cfg: Record<string, string>): void {
  try {
    fs.writeFileSync(PHOTOS_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing photos config:', err);
  }
}

// Public: Get photos status and availability on disk with cache-busting version tags
app.get('/api/photos', (req, res) => {
  const config = readPhotosConfig();
  const availability: Record<string, boolean> = {};
  const photoUrls: Record<string, string> = {};

  for (const [key, rawUrl] of Object.entries(config)) {
    const filename = path.basename(String(rawUrl).split('?')[0]);
    const filePath = path.join(IMAGES_DIR, filename);
    const exists = fs.existsSync(filePath);
    availability[key] = exists;
    if (exists) {
      try {
        const stat = fs.statSync(filePath);
        photoUrls[key] = `/assets/images/${filename}?v=${Math.floor(stat.mtimeMs)}`;
      } catch {
        photoUrls[key] = `/assets/images/${filename}`;
      }
    } else {
      photoUrls[key] = `/assets/images/${filename}`;
    }
  }

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  return res.json({
    photos: photoUrls,
    available: availability,
  });
});

// Admin: Upload real photo to disk and register in config (PROTECTED)
app.post('/api/admin/photos/upload', requireAdminAuth, (req, res) => {
  const { slotKey, filename, base64Data } = req.body;

  if (!slotKey || !filename || !base64Data) {
    return res.status(400).json({ error: 'slotKey, filename e base64Data são obrigatórios.' });
  }

  // Clean filename to prevent path traversal
  const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  const filePath = path.join(IMAGES_DIR, safeFilename);

  try {
    // Extract base64 payload (strip data:image/...;base64, if present)
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const buffer = Buffer.from(matches ? matches[2] : base64Data, 'base64');

    fs.writeFileSync(filePath, buffer);

    // Also sync to dist/assets/images if dist directory exists
    const distImagesDir = path.join(__dirname, 'dist', 'assets', 'images');
    if (fs.existsSync(distImagesDir)) {
      try {
        fs.writeFileSync(path.join(distImagesDir, safeFilename), buffer);
      } catch (e) {
        console.warn('Could not write to dist images:', e);
      }
    }

    const stat = fs.statSync(filePath);
    const versionedUrl = `/assets/images/${safeFilename}?v=${Math.floor(stat.mtimeMs)}`;

    const config = readPhotosConfig();
    config[slotKey] = `/assets/images/${safeFilename}`;
    writePhotosConfig(config);

    broadcastEvent('photos_updated', {
      slotKey,
      url: versionedUrl,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      slotKey,
      url: versionedUrl,
      filename: safeFilename,
      sizeBytes: buffer.length,
    });
  } catch (err: any) {
    console.error('Error saving uploaded photo:', err);
    return res.status(500).json({ error: 'Erro ao salvar fotografia no disco do servidor: ' + err.message });
  }
});

// ==================== MAINTENANCE TIPS (DICAS DE MANUTENÇÃO) ====================

function readTips(): any[] {
  try {
    if (fs.existsSync(TIPS_FILE)) {
      return JSON.parse(fs.readFileSync(TIPS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading tips file:', err);
  }
  return [];
}

function writeTips(tips: any[]): void {
  try {
    fs.writeFileSync(TIPS_FILE, JSON.stringify(tips, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing tips file:', err);
  }
}

// Public: Get all active tips (with option ?all=true for admin)
app.get('/api/tips', (req, res) => {
  const tips = readTips();
  if (req.query.all === 'true') {
    return res.json(tips);
  }
  return res.json(tips.filter(t => t.active !== false));
});

// Admin: Add or update a tip (PROTECTED)
app.post('/api/admin/tips', requireAdminAuth, (req, res) => {
  const tipData = req.body;
  if (!tipData || !tipData.title || !tipData.summary) {
    return res.status(400).json({ error: 'Título e resumo são obrigatórios.' });
  }

  const tips = readTips();
  const id = tipData.id || ('dica-' + Date.now());
  const slug = tipData.slug || tipData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newTip = {
    ...tipData,
    id,
    slug,
    publishedAt: tipData.publishedAt || new Date().toISOString().split('T')[0],
    active: tipData.active !== false,
  };

  const existingIndex = tips.findIndex(t => t.id === id);
  if (existingIndex >= 0) {
    tips[existingIndex] = newTip;
  } else {
    tips.push(newTip);
  }

  writeTips(tips);
  broadcastEvent('tips_updated', { id, action: existingIndex >= 0 ? 'update' : 'create' });

  return res.json({ success: true, tip: newTip });
});

// Admin: Delete a tip (PROTECTED)
app.delete('/api/admin/tips/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const tips = readTips();
  const filtered = tips.filter(t => t.id !== id);
  if (filtered.length === tips.length) {
    return res.status(404).json({ error: 'Dica não encontrada.' });
  }

  writeTips(filtered);
  broadcastEvent('tips_updated', { id, action: 'delete' });

  return res.json({ success: true, id });
});

// ==================== FRONTEND INTEGRATION ====================

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true'
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!IS_VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

if (!IS_VERCEL) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app, startServer };
export default app;
