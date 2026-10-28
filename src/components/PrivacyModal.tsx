import React from 'react';
import { X, ShieldCheck, Lock, FileText } from 'lucide-react';
import { CompanySettings } from '../types';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompanySettings;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Fechar política de privacidade"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-blue-950 border border-blue-800 text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 id="privacy-title" className="text-xl font-bold text-white font-heading">
              Aviso de Privacidade e Proteção de Dados (LGPD)
            </h2>
            <p className="text-xs text-slate-400">
              {settings.name} — Bairro Brasil, Uberlândia–MG
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <section className="space-y-1.5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              1. Quais dados coletamos e por quê
            </h3>
            <p>
              Ao solicitar um orçamento ou agendamento através do nosso site, solicitamos apenas as informações essenciais para a realização do atendimento mecânico:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Nome:</strong> para identificação do titular do veículo na recepção.</li>
              <li><strong>WhatsApp / Telefone:</strong> exclusivamente para responder ao orçamento e confirmar a data de agendamento.</li>
              <li><strong>Marca, modelo e ano do veículo:</strong> para consultar especificações de peças, tipo de óleo e ferramentas necessárias.</li>
              <li><strong>Descrição da necessidade:</strong> para preparar previamente a equipe técnica.</li>
              <li><strong>Mensagens do atendimento:</strong> para conversar com a oficina e acompanhar alterações.</li>
              <li><strong>Inscrição de notificações do navegador:</strong> somente quando você ativa os avisos, para enviar atualizações e lembretes ao aparelho.</li>
            </ul>
            <p className="text-slate-400">
              * Não solicitamos placas, número de Renavam, CPF ou dados bancários em nossos formulários públicos.
            </p>
          </section>

          <section className="space-y-1.5 pt-2 border-t border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              2. Finalidade e Consentimento Separado
            </h3>
            <p>
              Os dados são utilizados exclusivamente para responder à sua solicitação de serviço. O recebimento de eventuais informativos sobre revisões sazonais requer autorização expressa e separada através de caixa de seleção opcional, podendo ser revogado a qualquer momento.
            </p>
          </section>

          <section className="space-y-1.5 pt-2 border-t border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              3. Armazenamento e Não Compartilhamento
            </h3>
            <p>
              Seus dados não são vendidos, alugados ou compartilhados com ferramentas de publicidade de terceiros. A agenda e as mensagens são armazenadas no serviço de banco de dados usado pela oficina, com acesso restrito. Notificações autorizadas passam pelo serviço de push do navegador; os avisos não exibem nome, telefone, veículo nem conteúdo da conversa. O link privado permite acessar e alterar o atendimento: guarde-o com segurança. Você pode desativar os avisos neste site ou nas configurações do navegador.
            </p>
          </section>

          <section className="space-y-1.5 pt-2 border-t border-slate-800">
            <h3 className="font-bold text-white">4. Seus Direitos</h3>
            <p>
              Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode solicitar a qualquer momento a confirmação, correção ou exclusão dos seus dados dos registros de contato da oficina através do nosso WhatsApp oficial ou presencialmente em nossa unidade.
            </p>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
