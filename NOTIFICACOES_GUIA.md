# Avisos do site e atendimento

Esta versão usa Web Push, sem depender do WhatsApp para notificar. O WhatsApp continua disponível como contato manual.

**Estado da rotina:** o envio após eventos está implementado. A ativação da rotina a cada minuto foi bloqueada pela revisão automática e aguarda autorização específica para enviar seu token técnico do Vault ao endpoint do próprio site na Vercel. Enquanto isso, o lembrete com o site fechado não está ativo; a interface informa essa condição.

## No celular do dono

1. Abra https://autocentermineiro.vercel.app/#admin e entre com a senha administrativa.
2. Na agenda, toque em **Ativar notificações** e permita os avisos.
3. Confirme se o aviso de teste apareceu no aparelho.
4. Mantenha o painel aberto quando estiver atendendo. Clientes verão a equipe conectada enquanto o painel ativo renovar sua presença; isso não promete resposta imediata.

O dono recebe novos pedidos, mudanças, mensagens de clientes dos atendimentos confirmados; os lembretes ainda aguardam ativação da rotina. O botão **Conversar pelo site** abre a conversa de cada pedido; **Cliente aguarda resposta** indica que a última mensagem é do cliente.

## No celular do cliente

Após agendar, toque em **Acompanhar, conversar ou cancelar**. Guarde o link privado e ative os avisos neste aparelho. O cliente recebe atualizações e mensagens da oficina. Os lembretes de horários confirmados aguardam ativação da rotina.

O link fica salvo em **Meus agendamentos** no mesmo navegador. Em outro aparelho, abra a cópia do link. Quem possui o link pode consultar e alterar aquele atendimento: não publique nem compartilhe com terceiros. O servidor guarda somente o hash da credencial; não há busca pública por telefone ou identificador.

## iPhone e iPad

Em aparelhos compatíveis (iOS/iPadOS 16.4 ou posterior), abra no Safari, use **Compartilhar → Adicionar à Tela de Início** e abra pelo ícone criado antes de ativar as notificações. No Android, use um navegador atualizado e permita notificações. A permissão é individual por aparelho; não pode ser concedida remotamente pela oficina.

## Agendamento, alteração e cancelamento

Pedidos novos e pedidos de reagendamento ficam aguardando confirmação. O cliente escolhe outro horário consultando a disponibilidade; a oficina precisa confirmar o novo horário. Cancelamento de atendimento futuro pede confirmação na tela e invalida os lembretes pendentes. Atendimentos cancelados/concluídos não aceitam novas mensagens. Para atendimentos passados, o cliente deve falar com a oficina.

Vagas são verificadas de forma transacional no Supabase. Revisões evitam que uma tela antiga sobrescreva uma alteração recente. Solicitações e mensagens têm identificação idempotente para não duplicar em uma repetição do mesmo envio.

## Entrega dos avisos

O lembrete é preparado para 30 minutos antes do horário confirmado, para dono e cliente inscritos. Após autorização específica, a rotina executará a cada minuto no Supabase e chamará o servidor autenticado na Vercel. Enquanto a configuração scheduler_enabled estiver falsa, o worker não materializa lembretes para envio. A entrega e a exibição dependem da conexão, permissões, suporte do navegador, foco/economia de bateria e serviços de push do aparelho. Não se promete exibição no segundo exato nem confirmação de leitura. Atendimentos confirmados com menos de 30 minutos de antecedência não geram lembrete retroativo.

A fila registra aceite do serviço de push, falhas, tentativas e cancelamentos. Aceite pelo provedor não comprova que a pessoa viu a notificação. Tentativas são limitadas; endpoints expirados são desativados. Revisões são conferidas antes de enviar lembretes. Um aviso já em trânsito pode chegar após uma alteração: por isso seu conteúdo orienta consultar o horário atual no site.

As notificações não incluem nome, telefone, veículo, link privado ou conteúdo das mensagens. Somente o navegador destinatário recebe o conteúdo criptografado. A lista de aparelhos e as chaves privadas não são acessíveis por usuários públicos.

## Operação

- Cron: `mineiro-push-every-minute`.
- Endpoint: `POST /api/push/dispatch`, autenticado por token interno guardado no Vault.
- Chaves VAPID: configuração privada no banco, com acesso apenas pelo servidor. Não são armazenadas no GitHub ou no navegador, exceto a chave pública.
- Não rotacione VAPID sem planejar reinscrição dos aparelhos.
- Conversa e painel consultam atualizações a cada 8 segundos enquanto visíveis; não dependem do SSE em memória de uma instância da Vercel.
- A caixa de mensagens não é um atendimento automatizado por IA nem uma promessa de funcionamento 24 horas.

## Verificação

Testes SQL: `supabase/tests/portal.sql` (transação com rollback). Testes do servidor: `node --import tsx scripts/check-portal-push.ts`. Os testes de envio usam mock e não enviam avisos a pessoas. A entrega final precisa ser confirmada no celular após a ativação.
