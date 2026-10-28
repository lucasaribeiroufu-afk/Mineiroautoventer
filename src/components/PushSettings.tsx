import { useEffect, useState } from 'react';
import { endpointHash, portalRequest } from '../services/customerPortal';
import './CustomerPortal.css';

export function PushSettings({ token, password }: { token?: string; password?: string }) {
  const [subscribed, setSubscribed] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  useEffect(() => { portalRequest('/api/push/config').then(c => setRemindersEnabled(!!c.remindersEnabled)).catch(() => {}); }, []);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const owner = !!password;
  const base = owner ? '/api/admin/push/' : '/api/client/push/';
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
  useEffect(() => {
    let active = true;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.getRegistration('/').then(async registration => {
      const sub = await registration?.pushManager.getSubscription();
      if (!sub) return;
      const state = await portalRequest(base + 'subscription', token, { endpointHash: await endpointHash(sub.endpoint) }, 'POST', password);
      if (active) setSubscribed(state.subscribed);
    }).catch(() => {});
    return () => { active = false; };
  }, [base, token, password]);

  async function toggle() {
    setBusy(true); setNotice('');
    try {
      if (ios && !standalone) throw new Error('No iPhone: abra este link no Safari, toque em Compartilhar → Adicionar à Tela de Início. Depois abra pelo ícone criado e ative os avisos.');
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) throw new Error('Este navegador não oferece notificações do site. Tente um navegador atualizado no celular.');
      // Ask inside the button gesture, before waiting for a network request (required on iOS).
      if (!subscribed) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') throw new Error(permission === 'denied' ? 'As notificações estão bloqueadas. Libere este site nas configurações do navegador.' : 'A permissão não foi concedida. Continue acompanhando pelo site.');
      }
      const config = await portalRequest('/api/push/config');
      if (!config.enabled) throw new Error('As notificações ainda não estão disponíveis.');
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (subscribed && subscription) {
        await portalRequest(base + 'unsubscribe', token, { endpointHash: await endpointHash(subscription.endpoint) }, 'POST', password);
        setSubscribed(false); setNotice(owner ? 'Avisos da oficina desativados neste aparelho.' : 'Avisos deste atendimento desativados neste aparelho.'); return;
      }
      if (!subscription) {
        const raw = atob(config.publicKey.replace(/-/g,'+').replace(/_/g,'/'));
        subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, (c: string) => c.charCodeAt(0)) });
      }
      await portalRequest(base + 'subscribe', token, { subscription: subscription.toJSON() }, 'POST', password);
      setSubscribed(true); setNotice('Aparelho cadastrado. Um aviso de teste foi solicitado; confirme se apareceu no celular.');
    } catch (error: any) { setNotice(error.message || 'Não foi possível ativar os avisos.'); }
    finally { setBusy(false); }
  }
  return <section className="push-card">
    <div><strong>Avisos neste aparelho</strong><p>{subscribed ? 'Ativados para mensagens e mudanças do atendimento.' : owner ? 'Receba novos pedidos e mensagens dos clientes.' : 'Receba novidades e mensagens sobre seu atendimento.'}</p></div>
    <button type="button" className="portal-primary" disabled={busy} onClick={toggle}>{busy ? 'Aguarde…' : subscribed ? 'Desativar avisos' : 'Ativar notificações'}</button>
    {ios && !standalone && <p className="push-help">iPhone: Safari → Compartilhar → Adicionar à Tela de Início. Abra pelo ícone para ativar.</p>}
    {notice && <p role="status" className="push-help">{notice}</p>}
    <p className="push-help">{remindersEnabled ? 'Lembrete programado para 30 minutos antes do horário confirmado.' : 'Os lembretes de horário ainda não estão ativos. Confira a agenda no site.'}</p>
    <small>A entrega depende da conexão, das permissões e dos ajustes do celular. Confira o horário no site.</small>
  </section>;
}
