import 'dotenv/config';
import { portalRouter } from './server/portal.js';
import { flushPushSafely } from './server/push.js';
import { schedulingRouter, requireAdminAuth } from './server/scheduling.js';
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
const TIPS_FILE = path.join(DATA_DIR, 'tips.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    // If running in Vercel /tmp, seed with initial files from repo
    if (IS_VERCEL && fs.existsSync(INITIAL_DATA_DIR)) {
      ['photos_config.json', 'tips.json'].forEach(file => {
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

// Scheduling is persisted in Supabase; no JSON or temporary-file fallback.
app.use(portalRouter());
app.use(schedulingRouter(broadcastEvent, flushPushSafely));

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
