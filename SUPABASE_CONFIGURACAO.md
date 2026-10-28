# Integração da agenda com Supabase

Projeto existente: Auto center mineiro (`ehqxcwppzrjssbjkqflu`), organização Sites de projetos, região us-west-2.

## Estado

A agenda já usa o Supabase. O portal privado, as conversas e o Web Push usam as mesmas credenciais do servidor na Vercel. Consulte NOTIFICACOES_GUIA.md para ativação nos aparelhos e operação da fila. WhatsApp e SMS continuam sem envio automático.

As tabelas `workshop_schedule_config`, `workshop_appointments` e `workshop_notification_jobs` têm RLS e não permitem acesso por anon/authenticated. A função `workshop_schedule` é SECURITY INVOKER, executável somente pelo service_role. O aviso informativo “RLS Enabled No Policy” é esperado: clientes não acessam essas tabelas diretamente.

## Ativação na Vercel

No projeto que publica autocentermineiro.vercel.app, abra Settings → Environment Variables. Cadastre no ambiente Production e, se quiser testar previews, também Preview:

| Nome | Valor |
| --- | --- |
| SUPABASE_URL | https://ehqxcwppzrjssbjkqflu.supabase.co |
| SUPABASE_SECRET_KEY | Chave secreta sb_secret_… obtida no Supabase → Settings → API Keys |
| ADMIN_PASSWORD | Nova senha exclusiva com pelo menos 12 caracteres |

Mantenha as credenciais apenas no servidor. Não use VITE_ e não envie os valores por chat, commits ou capturas de tela. Chaves publishable não autorizam esta integração. Não é necessário instalar @supabase/ssr: o projeto usa React/Vite e Express; o servidor chama a API REST com fetch do Node.

Depois de cadastrar as variáveis, publique esta alteração e faça Redeploy. A agenda retorna 503 se não conseguir persistir os dados; não há fallback para JSON ou vagas fictícias. As antigas senhas fixas deixam de funcionar. A troca de senha passa a ser pela variável ADMIN_PASSWORD.

## Comportamento

- Solicitações entram como novo e dependem de confirmação da oficina.
- Confirmado/remarcado ocupam vagas. Confirmações e reagendamentos são serializados no banco, inclusive entre instâncias distintas.
- Datas e horários usam America/Sao_Paulo e não aceitam novos atendimentos no passado.
- Cada confirmação futura com antecedência superior a 30 minutos gera dois registros de lembrete, cliente e dono, com horário de execução 30 minutos antes. O worker de Web Push materializa entregas por aparelho inscrito; sem inscrição ativa, não há destinatário para enviar o aviso.
- Reagendamento/cancelamento invalida os lembretes anteriores. Revisões impedem confundir o horário antigo com o atual.
- Não há envio imediato para agendamentos feitos com menos de 30 minutos de antecedência. Essa regra deve ser definida ao integrar o provedor.
- A notificação SSE é apenas uma atualização da tela aberta; não substitui lembrete no celular.
- Fotos e dicas do painel ainda usam arquivos; a migração desta alteração abrange a agenda.

## Canais de notificação

Para Web Push, o worker está implementado; a rotina de lembretes a cada minuto aguarda autorização específica e não está ativa. Cada pessoa deve ativar os avisos de eventos no próprio aparelho. Para adicionar WhatsApp ou SMS futuramente, ainda será necessário contratar/configurar um provedor oficial. Não alterar manualmente os estados da fila para simular entrega.

## Dados antigos e validação

Nenhum agendamento existente no site foi importado automaticamente: o armazenamento anterior usa arquivos temporários e pode variar entre instâncias. Antes da troca, confira/exporte os registros pelo painel administrativo e concilie os atendimentos pendentes. Não considere `data/appointments.json` um backup da produção.

Testes locais: `npm run lint`, `npm run build`, `node --import tsx scripts/check-booking.ts` e `node --import tsx scripts/check-supabase-schedule.ts`.

O teste SQL em `supabase/tests/schedule.sql` foi executado com role service_role em transação revertida: capacidade, reagendamento, cancelamento, revisões dos lembretes e rejeição de datas passadas. Para repetir, execute o arquivo pelo SQL Editor. Ele não deixa agendamentos de teste no banco.
