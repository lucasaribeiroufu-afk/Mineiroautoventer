# Mineiro Auto Center e Mecânica — Aplicação Web Oficial

Aplicação web profissional e moderna para a oficina mecânica **Mineiro Auto Center e Mecânica**, localizada no bairro Brasil em Uberlândia–MG. Construída com React 19, TypeScript, Vite, Tailwind CSS, Framer Motion e backend Node/Express com persistência local e suporte nativo para deploy no **Vercel** e **GitHub**.

---

## 🛠️ Tecnologias Principais

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Animações**: Framer Motion (`ScrollReveal` com fade-in suave e controle de acessibilidade)
- **3D**: Three.js para renderização interativa de peças automotivas 3D (Roda, Suspensão, Freios)
- **Backend / API**: Express integrado ao Vite dev server (`server.ts`) com Server-Sent Events (SSE) para atualização em tempo real
- **SEO & Marca**: Dados estruturados Schema.org (`AutoRepair`, `FAQPage`), OpenGraph e meta tags completas
- **Persistência**: Arquivos JSON em `./data` (com fallback automático para `/tmp/data` no ambiente serverless da Vercel)

---

## 📍 Dados Institucionais e Links Reais

- **Razão / Nome**: Mineiro Auto Center e Mecânica
- **WhatsApp Direto**: `(34) 99634-2522` → [wa.me/5534996342522](https://wa.me/5534996342522)
- **Instagram Oficial**: [@autocentermineiro](https://www.instagram.com/autocentermineiro/)
- **Endereço**: Rua Ricardo Siquierolli Tucci, nº 2749, Bairro Brasil, Uberlândia–MG, CEP 38400-722
- **Google Maps**: Rota direta com coordenadas exatas da oficina

---

## 🚗 Catálogo de Serviços e Recursos

1. **Alinhamento Computadorizado 3D e Balanceamento**: Geometria veicular e regulagem de convergência.
2. **Suspensão e Amortecedores**: Diagnóstico de ruídos, folgas, amortecedores e molas.
3. **Freios e Segurança**: Discos ventilados, pastilhas, fluido de freio e inspeção técnica.
4. **Troca de Óleo e Filtros**: Lubrificantes nas normas das montadoras e filtros novos.
5. **Diagnóstico de Injeção Eletrônica**: Leitura via scanner automotivo e testes de sensores.
6. **Mecânica Geral e Revisão Preventiva**: Check-up de viagens e revisões periódicas.

---

## 📸 Fotografias Reais e Ativos Preservados

Todas as fotos reais estão salvas em `/public/assets/images/` e são exportáveis diretamente para o repositório GitHub:

| Ativo | Arquivo | Descrição |
|-------|---------|-----------|
| **Fachada Oficial** | `fachada_mineiro_autocenter_2749.jpg` | Fachada principal com letreiro, telefone e profissional |
| **Galpão Interno** | `oficina_galpao_interno.jpg` | Estrutura interna com múltiplos elevadores e iluminação |
| **Alinhamento 3D** | `alinhamento_balanceamento_computadorizado.jpg` | Profissional operando sensor a laser na roda |
| **Rampa de Geometria** | `oficina_rampa_alinhamento.jpg` | Rampa técnica e baias de atendimento |
| **Mecânica / Motor** | `mecanica_revisao_motor.jpg` | Profissional no compartimento de motor |
| **Manutenção no Elevador** | `oficina_mecanica_capo_aberto.jpg` | Profissional com veículo elevado e suspensão/freio |
| **Card Instagram Oficial** | `equipe-instagram.webp` | Profissional com camisa preta ao lado do carro com capô aberto |
| **Ilustrações 3D** | `roda_3d_ilustracao.jpg`, `suspensao_3d_ilustracao.jpg`, `freios_3d_ilustracao.jpg` | Visualização de peças dos serviços |

---

## 🔐 Painel Administrativo da Oficina

- **Acesso**: Ícone no cabeçalho ou rodapé ("Área da Oficina")
Configure as credenciais administrativas de forma privada no ambiente do servidor.
- **Funcionalidades do Painel**:
  - Visualização e alteração de status de agendamentos (`pendente`, `confirmado`, `concluido`, `cancelado`)
  - Remarcação de data e horário
  - Registro manual de agendamentos combinados via WhatsApp
  - Configuração de capacidade por horário e bloqueio de datas/feriados
  - Gerenciador de fotos em tempo real com upload direto
  - Gerenciador completo de **Dicas de Manutenção** (criar, editar, pausar e excluir artigos para SEO)

---

## 🚀 Como Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Executar em modo de desenvolvimento
npm run dev

# 3. Compilar para produção
npm run build

# 4. Iniciar servidor de produção
npm start
```

---

## 🌐 Deploy no GitHub e Vercel

O projeto possui `vercel.json` pré-configurado com rotas estáticas e serverless functions para a API.

1. Faça commit e push para o seu repositório no GitHub:
   ```bash
   git add .
   git commit -m "feat: site oficial Mineiro Auto Center"
   git push origin main
   ```
2. Importe o repositório na [Vercel](https://vercel.com).
3. A Vercel detectará automaticamente o framework Vite e o arquivo `vercel.json`.
4. Clique em **Deploy**. O site estará no ar com todas as fotos, agendamento e SEO ativo!


## Apresentação, fotografias e visualizador 3D

A seção Equipamentos reúne quatro fotografias reais do alinhador Corghi, em WebP e sem corte no enquadramento, com ampliação.

A roda usa o modelo **Tuner car wheel FREE**, de **NLM**, no visualizador oficial do Sketchfab. A prévia local é uma renderização desse mesmo modelo, para evitar trocar uma imagem realista por outra geometria ao abrir o 3D. O modelo tem 80.886 triângulos e materiais/texturas do autor. A incorporação preserva os controles nativos e os créditos do Sketchfab.

Fonte: https://sketchfab.com/3d-models/tuner-car-wheel-free-02c9dc10a6b04b41a562848f95c232eb
Autor: https://sketchfab.com/NLM-Group
Licença do modelo e prévia: Creative Commons Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/
Alterações no ativo: somente conversão da prévia JPEG para WebP; geometria e materiais são apresentados pelo visualizador oficial, sem alteração. O uso não indica vínculo com as marcas representadas.

O SDK e o visualizador só carregam após clicar em “Explorar em 3D”. A imagem local permanece visível até o evento `viewerready`. Em caso de falha ou demora superior a 45 segundos, a imagem permanece disponível, com opção de nova tentativa e link ao modelo original. O parâmetro `dnt=1` é usado. A operação depende da disponibilidade do Sketchfab e de WebGL no dispositivo. Não há mais substituição pelo modelo procedural local.

Validação: `npm run build` e `npx tsc --noEmit`. O navegador remoto de QA não oferece WebGL; a inspeção da renderização em movimento deve ser feita em um navegador com WebGL.
