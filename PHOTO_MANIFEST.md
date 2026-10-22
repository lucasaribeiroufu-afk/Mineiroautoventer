# Manifesto de Fotografias Reais — Mineiro Auto Center e Mecânica

Este documento oficializa a inspeção técnica, decodificação e implementação das **7 fotografias reais** fornecidas pelo cliente via Google Drive (`14k1VAgCLM861XaHKs2dFdAe7Q66KLpIU`).

---

## 1. Mapeamento Verificado das 7 Fotografias Originais

| Arquivo no Google Drive | Dimensões Reais | Tamanho | Conteúdo Real Verificado | Arquivo Servido no Projeto | Seção no Site |
|---|---|---|---|---|---|
| **IMG_3590 (1).PNG** | 921 × 1600 px | 123.5 KB | **Fachada oficial da oficina**: letreiro "MINEIRO AUTO CENTER E MECÂNICA", logotipo oficial, Instagram @autocentermineiro, WhatsApp (34) 99634-2522, número 2749 na parede e baia com elevador e veículo. | `/assets/images/fachada_mineiro_autocenter_2749.jpg` | **Hero (1ª Seção)** e **Localização** (foto da fachada oficial) |
| **IMG_3592 (1).PNG** | 922 × 1600 px | 173.3 KB | **Profissional em atendimento no elevador**: mecânico com camisa oficial da oficina trabalhando no veículo elevado, com conjunto de suspensão, amortecedor e pinça/disco de freio visíveis. | `/assets/images/oficina_mecanica_capo_aberto.jpg` | **Sobre a Oficina (Destaque Principal)** e **Serviços** |
| **IMG_9968.PNG** | 917 × 1600 px | 155.0 KB | **Geometria computadorizada**: profissional instalando o alvo/cabeçote de alinhamento 3D a laser na roda do veículo sobre a rampa. | `/assets/images/alinhamento_balanceamento_computadorizado.jpg` | **Galeria Técnica — Alinhamento e Balanceamento** |
| **IMG_9969.PNG** | 926 × 1600 px | 155.8 KB | **Mecânica e motor**: profissional trabalhando com ferramentas no compartimento do motor do veículo com capô aberto. | `/assets/images/mecanica_revisao_motor.jpg` | **Galeria Técnica — Mecânica e Revisão** |
| **IMG_9970.PNG** | 930 × 1600 px | 122.7 KB | **Fachada em ângulo aberto**: fachada externa e céu aberto destacando a amplitude e iluminação da oficina. | `/assets/images/fachada_angulo_ceu_azul.jpg` | **Galeria Técnica e Hero** |
| **IMG_9971.PNG** | 937 × 1600 px | 191.6 KB | **Galpão interno amplo**: vista interna do galpão da oficina com múltiplos elevadores automotivos, veículos em manutenção, piso limpo e iluminação industrial. *(Nota de integridade: a pasta não contém foto de "entrega de chave"; esta foto real retrata a capacidade das instalações).* | `/assets/images/oficina_galpao_interno.jpg` | **Sobre a Oficina (Galpão e Elevadores)** |
| **IMG_9972.PNG** | 930 × 1600 px | 143.3 KB | **Rampa de alinhamento 3D**: rampa técnica especializada para geometria e alinhamento de suspensão com equipamento de medição ao fundo. | `/assets/images/oficina_rampa_alinhamento.jpg` | **Galeria Técnica — Estrutura e Equipamentos** |

---

## 2. Eliminação de Gráficos e Substitutos Provisórios

* Os cartões azuis com inscrições provisórias (*“FACHADA OFICIAL”*, *“ESTRUTURA DA OFICINA”*, *“ENTREGA DA CHAVE AO CLIENTE”* e *“ATENDIMENTO TELEFONE”*) foram **definitivamente substituídos** pelas fotografias reais decodificadas da pasta do cliente.
* Os arquivos foram gravados tanto em `public/assets/images/` quanto em `dist/assets/images/` e contam com sufixos de versão de cache (`?v=timestamp`) gerados pelo backend na rota `/api/photos`.
* O visualizador interativo 3D em Three.js (`Automotive3DViewer.tsx`) permanece ativo e integrado na seção de serviços para rotação orbital 360° da roda e freio a disco ventilado com pinça azul esportiva.

---

## 3. Substituição pelo Painel Administrativo

Caso o cliente queira atualizar qualquer foto no futuro:
1. Abra a **Área Restrita** no rodapé (ou clique no ícone da câmera).
2. Digite a senha: `melhoroficina26`.
3. Na aba **Gerenciador de Fotos**, visualize a miniatura real e faça upload do novo arquivo.
