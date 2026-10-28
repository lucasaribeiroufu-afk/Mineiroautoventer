/** Poster and interactive view belong to the exact same licensed model. */
export const REALISTIC_WHEEL = {
  uid: '02c9dc10a6b04b41a562848f95c232eb',
  title: 'Tuner car wheel FREE',
  author: 'NLM',
  authorUrl: 'https://sketchfab.com/NLM-Group',
  sourceUrl: 'https://sketchfab.com/3d-models/tuner-car-wheel-free-02c9dc10a6b04b41a562848f95c232eb',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  poster: '/assets/images/roda-realista-nlm.webp',
} as const;

interface ViewerApi { start: () => void; addEventListener: (event: string, handler: () => void) => void; }
interface ViewerOptions { success: (api: ViewerApi) => void; error: () => void; [key: string]: unknown; }
interface ViewerClient { init: (uid: string, options: ViewerOptions) => void; }
type ViewerConstructor = new (version: string, iframe: HTMLIFrameElement) => ViewerClient;
let sdkPromise: Promise<ViewerConstructor> | null = null;

export function loadSketchfabViewer(): Promise<ViewerConstructor> {
  const getConstructor = () => (window as Window & { Sketchfab?: ViewerConstructor }).Sketchfab;
  const existing = getConstructor();
  if (existing) return Promise.resolve(existing);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
    script.async = true;
    script.onload = () => { const ctor = getConstructor(); if (ctor) resolve(ctor); else { sdkPromise = null; script.remove(); reject(new Error('Viewer SDK unavailable')); } };
    script.onerror = () => { sdkPromise = null; script.remove(); reject(new Error('Viewer SDK failed to load')); };
    document.head.appendChild(script);
  });
  return sdkPromise;
}
