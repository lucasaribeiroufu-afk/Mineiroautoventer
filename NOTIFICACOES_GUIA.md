# Guia de Configuração de Notificações para o Proprietário

Este guia descreve como configurar alertas em tempo real para que o responsável pelo **Mineiro Auto Center e Mecânica** receba notificações imediatas a cada novo agendamento de serviço ou solicitação de orçamento.

---

## 1. Fluxo Atual de Notificações (Em Funcionamento)

1. **WhatsApp Direto (1-Clique)**:
   - Ao preencher o agendamento ou orçamento no site, o cliente é automaticamente direcionado para o WhatsApp oficial `(34) 99634-2522` com uma mensagem formatada contendo:
     - Nome do cliente
     - Telefone WhatsApp
     - Veículo e Ano
     - Serviço Solicitado
     - Data e Horário Escolhidos
     - Observações do Veículo
   - O proprietário recebe a notificação push nativa do aplicativo WhatsApp no smartphone.

2. **Sincronização em Tempo Real no Painel Administrativo**:
   - O painel administrativo interno (`/` -> Área Restrita -> Senha: `melhoroficina26`) utiliza **Server-Sent Events (SSE)**. Quando um novo agendamento é registrado, qualquer navegador com o painel aberto toca um alerta sonoro e atualiza a lista instantaneamente, sem necessidade de recarregar a página.

---

## 2. Como Integrar Webhooks para Notificação Automática (WhatsApp / Telegram / E-mail)

O backend possui suporte nativo para disparo de webhook ao criar um agendamento (`POST /api/schedule/appointments`).

### Opção A: WhatsApp Automático via Evolution API / Z-API / Twilio
Para enviar uma mensagem automática para o celular do Mineiro no momento em que a reserva é feita:
1. Adicione a variável de ambiente no seu painel da Vercel ou arquivo `.env`:
   ```bash
   WHATSAPP_NOTIFY_WEBHOOK="https://sua-instancia-api.com/message/sendText/mineiro"
   WHATSAPP_NOTIFY_TOKEN="seu_token_secreto_aqui"
   MINEIRO_PHONE="5534996342522"
   ```

### Opção B: Bot do Telegram (Gratuito e Imediato)
1. Crie um bot no Telegram com o `@BotFather` e obtenha o `BOT_TOKEN`.
2. Pegue o seu `CHAT_ID` com o `@userinfobot`.
3. Adicione nas variáveis da Vercel:
   ```bash
   TELEGRAM_BOT_TOKEN="123456789:ABCdefGHI..."
   TELEGRAM_CHAT_ID="987654321"
   ```

### Opção C: Notificação por E-mail (Resend / SendGrid)
1. Cadastre-se gratuitamente no [Resend.com](https://resend.com) e crie uma API Key.
2. Adicione nas variáveis da Vercel:
   ```bash
   RESEND_API_KEY="re_123456789"
   NOTIFICATION_EMAIL="contato@autocentermineiro.com.br"
   ```

---

## 3. Variáveis de Ambiente Recomendadas na Vercel

| Variável | Valor Padrão | Descrição |
|---|---|---|
| `ADMIN_PASSWORD` | `melhoroficina26` | Senha de acesso ao painel de controle da oficina |
| `PORT` | `3000` | Porta do servidor local |
| `NODE_ENV` | `production` | Ambiente de execução |
| `WHATSAPP_NUMBER` | `5534996342522` | Número do WhatsApp oficial da oficina |
