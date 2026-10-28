import { useEffect, useRef, useState } from 'react';
import { portalRequest, savedBookings, rememberBooking, createRequestId } from '../services/customerPortal';
import { fetchVerifiedAvailability, workshopDate } from '../services/bookingAvailability';
import { PushSettings } from './PushSettings';
import './CustomerPortal.css';

const labels: Record<string,string> = { novo: 'Aguardando confirmação', confirmado: 'Confirmado pela oficina', remarcado: 'Novo horário confirmado', cancelado: 'Cancelado', concluido: 'Atendimento concluído' };
export function Conversation({ ownerId, ownerPassword, appointmentStatus, token, onData }: { ownerId?: string; ownerPassword?: string; appointmentStatus?: string; token?: string; onData?: (data: any) => void }) {
  const [data, setData] = useState<any>(null), [body, setBody] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const inflight = useRef(false), bottom = useRef<HTMLDivElement>(null), requestId = useRef(createRequestId());
  const endpoint = ownerId ? '/api/admin/appointments/' + encodeURIComponent(ownerId) + '/conversation' : '/api/client/appointment';
  const messages = ownerId ? '/api/admin/appointments/' + encodeURIComponent(ownerId) + '/messages' : '/api/client/messages';
  const auth = ownerPassword;
  useEffect(() => {
    let active = true;
    async function refresh() {
      if (inflight.current || document.hidden || (ownerId && !auth)) return;
      inflight.current = true;
      try {
        const result = await portalRequest(endpoint, token, undefined, 'GET', auth);
        if (active) { setData(result); onData?.(result); setError(''); }
      } catch (failure: any) { if (active) setError(failure.message || 'Conexão interrompida. Os dados podem estar desatualizados.'); }
      finally { inflight.current = false; }
    }
    refresh(); const timer = window.setInterval(refresh, 8000);
    const wake = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', wake);
    return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange',wake); };
  }, [endpoint, token, auth]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [data?.messages?.length]);
  async function send(event: React.FormEvent) {
    event.preventDefault(); if (!body.trim() || busy) return; setBusy(true); setError('');
    try { const result = await portalRequest(messages, token, { body: body.trim(), requestId: requestId.current }, 'POST', auth); setData(result); onData?.(result); setBody(''); requestId.current = createRequestId(); }
    catch (failure: any) { setError(failure.message); } finally { setBusy(false); }
  }
  const closed = ['cancelado','concluido'].includes(appointmentStatus || data?.appointment?.status);
  return <section className="portal-conversation"><div className="portal-section-heading"><h3>Conversa com {ownerId ? 'o cliente' : 'a oficina'}</h3>{!ownerId && <span className={data?.staffOnline ? 'portal-online' : ''}>{data?.staffOnline ? 'Equipe conectada' : 'Resposta conforme disponibilidade'}</span>}</div>
    <p className="portal-muted">As mensagens são atualizadas enquanto esta tela estiver aberta. O envio não significa que a outra pessoa já leu.</p>
    <div className="portal-messages" aria-live="polite">{data?.messages?.length ? data.messages.map((m: any) => <div key={m.id} className={'portal-message ' + (m.sender_role === (ownerId ? 'owner' : 'client') ? 'mine' : '')}><small>{m.sender_role === 'owner' ? 'Oficina' : 'Cliente'} · {new Date(m.created_at).toLocaleString('pt-BR', {timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</small><p>{m.body}</p></div>) : <p className="portal-muted">Descreva sua dúvida. A oficina responderá por aqui.</p>}<div ref={bottom}/></div>
    {error && <p role="alert" className="portal-error">{error}</p>}
    <form onSubmit={send} className="portal-message-form"><label className="sr-only" htmlFor={'message-' + (ownerId || 'client')}>Mensagem para {ownerId ? 'o cliente' : 'a oficina'}</label><textarea id={'message-' + (ownerId || 'client')} maxLength={2000} value={body} onChange={e => { setBody(e.target.value); requestId.current = createRequestId(); }} placeholder={closed ? 'Conversa encerrada' : 'Escreva uma mensagem…'} disabled={closed || busy}/><button className="portal-primary" disabled={closed || busy || !body.trim()}>{busy ? 'Enviando…' : 'Enviar'}</button></form>
  </section>;
}

export function CustomerPortal({ token, onClose }: { token?: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'none'|'cancel'|'reschedule'>('none');
  const [date, setDate] = useState(''), [time, setTime] = useState(''), [slots, setSlots] = useState<any[]>([]), [loading, setLoading] = useState(false);
  const saved = savedBookings();
  const appointment = data?.appointment;
  useEffect(() => { if (appointment && token) rememberBooking({ ...appointment, clientToken: token }); }, [appointment?.id,token]);
  useEffect(() => {
    if (!date || mode !== 'reschedule') return;
    let active = true; setLoading(true); setSlots([]); setTime(''); setError('');
    fetchVerifiedAvailability(date).then(a => { if(active) setSlots(a.slots); }).catch(e => { if(active) setError(e.message); }).finally(() => { if(active) setLoading(false); });
    return () => { active=false; };
  }, [date,mode]);
  async function change(action: string) {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await portalRequest('/api/client/appointment',token,{ action,revision:data.revision,date,time },'PATCH');
      setData(result); setMode('none'); setNotice(action === 'cancel' ? 'Cancelamento registrado. A oficina foi informada pelo site.' : 'Novo horário solicitado. Aguarde a confirmação da oficina.');
    } catch(e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(window.location.origin + '/#agendamento=' + token); setNotice('Link copiado. Guarde em local seguro: ele permite consultar e alterar este agendamento.'); }
    catch { setNotice('Copie o endereço desta página para guardar seu link privado.'); }
  }
  const canChange = appointment && !['cancelado','concluido'].includes(appointment.status) && new Date(appointment.preferredDate+'T'+appointment.preferredTime+':00-03:00') > new Date();
  return <div className="portal-overlay"><section className="portal-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-portal-title"><header className="portal-header"><div><span>MINEIRO · SEU ATENDIMENTO</span><h2 id="customer-portal-title">{token ? 'Tudo combinado por aqui.' : 'Meus agendamentos'}</h2></div><button onClick={onClose} className="portal-close" aria-label="Fechar acompanhamento">×</button></header>
    {!token ? <div className="portal-content"><p>Abra um atendimento salvo neste aparelho ou use o link privado recebido após agendar.</p>{saved.length ? saved.map(b => <a className="portal-booking-link" key={b.id} href={'#agendamento='+b.token}>{b.label}<span>Acompanhar →</span></a>) : <p className="portal-muted">Nenhum atendimento salvo neste aparelho. Ao concluir um novo pedido, guarde o link de acompanhamento.</p>}<a className="portal-booking-link" href="#admin">Equipe da oficina<span>Acessar painel →</span></a></div> :
    <div className="portal-content">{appointment ? <><div className="portal-status"><span>{labels[appointment.status] || appointment.status}</span><small>{appointment.id}</small></div><h3 className="portal-appointment-title">{appointment.serviceName}</h3><div className="portal-appointment-summary"><strong>{new Date(appointment.preferredDate+'T12:00:00-03:00').toLocaleDateString('pt-BR')} às {appointment.preferredTime}</strong><span>{appointment.vehicleModel} · {appointment.vehicleYear}</span></div><p className="portal-muted">O pedido só está confirmado quando a oficina confirmar. Um reagendamento volta para análise da equipe.</p><button className="portal-link-button" onClick={copy}>Guardar link privado</button>
    {canChange && <div className="portal-actions"><button onClick={() => {setMode('reschedule');setDate(appointment.preferredDate);setError('');}}>Solicitar outro horário</button><button className="danger" onClick={() => {setMode('cancel');setError('');}}>Cancelar agendamento</button></div>}
    {mode === 'cancel' && <div className="portal-confirm"><h3>Cancelar este atendimento?</h3><p>A oficina receberá a alteração. Para voltar a agendar, será necessário fazer outro pedido.</p><div className="portal-actions"><button disabled={busy} onClick={() => change('cancel')}>Confirmar cancelamento</button><button disabled={busy} onClick={() => setMode('none')}>Manter atendimento</button></div></div>}
    {mode === 'reschedule' && <div className="portal-confirm"><h3>Qual horário funciona melhor?</h3><div className="portal-reschedule-fields"><label>Nova data<input type="date" min={workshopDate()} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Horário<select value={time} onChange={e=>setTime(e.target.value)} disabled={loading}><option value="">{loading ? 'Consultando…' : 'Selecione'}</option>{slots.map(s=><option value={s.time} key={s.time} disabled={!s.available}>{s.time}{s.available?'':' — indisponível'}</option>)}</select></label></div><div className="portal-actions"><button disabled={busy || loading || !slots.some(s=>s.time===time && s.available)} onClick={()=>change('reschedule')}>Solicitar novo horário</button><button onClick={()=>setMode('none')}>Voltar</button></div></div>}
    <PushSettings token={token}/></> : <p className="portal-muted">Consultando seu atendimento…</p>}
    {error && <p role="alert" className="portal-error">{error}</p>}{notice && <p role="status" className="portal-notice">{notice}</p>}
    <Conversation token={token} appointmentStatus={appointment?.status} onData={setData}/><p className="portal-private-notice">Este link é privado. Quem tiver acesso a ele poderá acompanhar e alterar este atendimento. Não publique nem compartilhe com terceiros.</p></div>}
  </section></div>;
}
