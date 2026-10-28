# Agenda e notificações — auditoria de 28/10/2026

## Situação real

O sistema atual registra pedidos de atendimento e consulta disponibilidade no servidor. A situação inicial é `novo`; a confirmação e a remarcação dependem da oficina. O botão WhatsApp abre uma mensagem preenchida: o cliente precisa enviá-la manualmente. Não existe envio automático, webhook de entrada de mensagens, confirmação por WhatsApp nem lembrete de 30 minutos implementado. O guia anterior descrevia integrações que não existem no código e foi substituído por esta auditoria.

A disponibilidade do formulário agora falha de forma segura: uma API indisponível não vira uma lista de horários livres. Horários passados são bloqueados no fuso America/Sao_Paulo. Antes de enviar o pedido, o formulário consulta novamente a disponibilidade. Essa checagem não substitui uma transação atômica no banco.

## Bloqueios para uso como agenda definitiva

- O servidor atual grava JSON em /tmp na Vercel. Não há persistência compartilhada garantida entre instâncias ou novas publicações.
- A validação de capacidade precisa migrar para uma transação no banco para impedir confirmações concorrentes acima da capacidade.
- O projeto Supabase acessível durante a auditoria está INACTIVE e não foi identificado como pertencente ao Mineiro. Não foi reativado ou modificado.
- A autenticação administrativa legada contém senhas padrão no código. Antes de centralizar dados reais, remover essas alternativas e usar credenciais privadas ou autenticação com permissões por usuário. Trocar credenciais anteriormente expostas.
- O número público de contato não comprova que ele esteja cadastrado como remetente de uma API oficial. É necessário confirmar remetente, destinatário do dono e provedor.

## Fluxo proposto para ativação

1. Disponibilidade: banco persistente com capacidade por horário, expediente, bloqueios e horário de São Paulo.
2. Pedido: gerar referência única e registrar a autorização do cliente para contatos relacionados ao atendimento.
3. Oficina: API oficial envia ao número autorizado os dados mínimos do pedido e ações de confirmar ou propor nova data.
4. Entrada: webhook assinado valida o provedor e a identidade do remetente. Somente o número autorizado da oficina pode aprovar atendimento. O cliente pode aceitar nova proposta, pedir mudança ou cancelar o próprio atendimento.
5. Confirmação: transação verifica novamente a capacidade e muda o estado. Se não houver vaga, oferecer alternativas disponíveis sem confirmar automaticamente uma vaga inexistente.
6. Lembretes: criar duas tarefas para o início confirmado menos 30 minutos — uma para o dono, outra para o cliente. Não enviar para pedidos ainda pendentes ou cancelados.
7. Remarcação: cancelar tarefas antigas e criar novas vinculadas à revisão do agendamento. Verificar novamente a revisão antes de cada envio.
8. Entrega: guardar identificador do provedor e estados enviado/entregue/falhou. Usar chaves únicas por agendamento, revisão, destinatário e tipo. Não repetir cegamente um envio cujo resultado ficou desconhecido.

## Infraestrutura necessária

Banco Supabase/Postgres ativo e confirmado para a oficina; acesso à configuração do projeto Vercel; conta WhatsApp Business Platform (direta ou via provedor oficial, como Twilio); modelos de mensagem aprovados; números autorizados; processamento agendado com frequência de um minuto. SMS é um canal adicional e exige número/provedor compatível e configuração própria; um celular não recebe SMS automaticamente só porque possui WhatsApp.

No plano Hobby da Vercel, o cron roda no máximo uma vez por dia e não atende ao lembrete de 30 minutos. Usar um agendador externo compatível ou um plano com execução por minuto. Não foi contratado serviço pago nem ativado envio nesta atualização. A entrega no telefone depende também do provedor, conectividade e permissões do aparelho; não prometer precisão absoluta.

## Validação de ponta a ponta antes de anunciar o recurso

Com números de teste autorizados: pedido → alerta do dono → confirmação → retorno ao cliente; pedido sem vaga → alternativa; remarcação → cancelamento dos lembretes antigos; cancelamento → nenhum lembrete; dois pedidos concorrentes para a última vaga; webhook sem assinatura → rejeição; webhook repetido → uma mudança; lembretes para dono e cliente no horário esperado; falha do provedor → registro e tratamento explícito. Nunca usar dados de clientes reais nesses testes sem autorização.

## Referências oficiais

- https://vercel.com/docs/functions/runtimes
- https://vercel.com/docs/cron-jobs/usage-and-pricing
- https://www.twilio.com/docs/whatsapp/key-concepts
- https://www.twilio.com/docs/usage/webhooks/webhooks-security
- https://www.twilio.com/docs/messaging/features/message-scheduling
