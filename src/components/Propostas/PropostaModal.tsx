import { PropostaComercial } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface PropostaModalProps {
  proposta: PropostaComercial
  onClose: () => void
}

export default function PropostaModal({ proposta, onClose }: PropostaModalProps) {
  const handlePrint = () => {
    window.print()
  }

  const recursos = [
    'Acesso ilimitado ao portal de rastreamento, via Internet, 24hs dia/7dias semana',
    'Plataforma com acesso exclusivo e restrito para sua Empresa através de um link enviado com login e senha, e também pelo nosso aplicativo para celular',
    'Central 24 Horas, 7 dias por semana, para atendimento em caso de Roubo ou Furto',
    'Gestão de manutenção preventiva',
    'Opções de Mapas detalhado',
    'Relatórios das ruas percorridas pelo veículo com velocidade',
    'Relatórios com históricos dos veículos por data ou período',
    'Criação de Cercas Eletrônicas',
    'Relatório de deslocamento e Paradas',
    'Cobertura via GPS em todo território nacional',
    'Mapas com sobreposição de camadas',
    'Envio de alertas via Aplicativo'
  ]

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Remover cabeçalhos e rodapés do navegador */
          @page {
            margin: 1.5cm;
            size: A4;
          }

          /* Ocultar tudo com visibility */
          body * {
            visibility: hidden;
          }

          /* Mostrar apenas o conteúdo da proposta */
          #proposta-print-content,
          #proposta-print-content * {
            visibility: visible;
          }

          /* Posicionar conteúdo no topo */
          #proposta-print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
            margin: 0;
            box-shadow: none;
          }

          /* Controle de quebras de página */
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }

          .page-break-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Garantir que cores e backgrounds sejam impressos */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Botões de ação - ocultos na impressão */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center print:hidden z-10">
            <h2 className="text-xl font-bold text-gray-800">Proposta Comercial #{String(proposta.numero_proposta).padStart(4, '0')}</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                🖨️ Imprimir / Salvar PDF
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>

          {/* Conteúdo da Proposta */}
          <div id="proposta-print-content" className="p-8 bg-white">
          {/* Cabeçalho com Logo */}
          <div className="flex justify-between items-start mb-8 border-b-4 border-primary-600 pb-6 page-break-avoid">
            <div className="flex items-center gap-4">
              <div className="w-28 h-20 flex items-center justify-center">
                <img
                  src="/logo-lince-track-new.png"
                  alt="Lince Track Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900">LINCE TRACK</h1>
                <p className="text-xs text-gray-500 tracking-widest">RASTREAMENTO VEICULAR</p>
                <p className="text-xs text-gray-500 mt-1">CNPJ: 63.061.943/0001-44</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Proposta Comercial</p>
              <p className="text-2xl font-bold text-gray-800">#{String(proposta.numero_proposta).padStart(4, '0')}</p>
              <p className="text-xs text-gray-500 mt-1">Data: {formatDate(proposta.created_at.split('T')[0])}</p>
              <p className="text-xs text-gray-500">Validade: {formatDate(proposta.data_validade)}</p>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="mb-6 page-break-avoid">
            <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">
              DADOS DO CLIENTE - {proposta.tipo_pessoa === 'fisica' ? 'PESSOA FÍSICA' : 'PESSOA JURÍDICA'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  {proposta.tipo_pessoa === 'fisica' ? 'Nome Completo' : 'Empresa'}
                </p>
                <p className="font-semibold text-gray-800">{proposta.prospect_nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contato</p>
                <p className="font-semibold text-gray-800">{proposta.prospect_contato}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-800">{proposta.prospect_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telefone</p>
                <p className="font-semibold text-gray-800">{proposta.prospect_telefone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {proposta.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}
                </p>
                <p className="font-semibold text-gray-800">{proposta.prospect_documento}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Localização</p>
                <p className="font-semibold text-gray-800">{proposta.prospect_cidade}/{proposta.prospect_estado}</p>
              </div>
            </div>
          </div>

          {/* Detalhes da Proposta */}
          <div className="mb-6 page-break-avoid">
            <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">DETALHES DA PROPOSTA</h3>

            <div className="bg-primary-50 p-6 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Equipamento</p>
                  <p className="font-bold text-gray-800">{proposta.tipo_equipamento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Plano</p>
                  <p className="font-bold text-gray-800">{proposta.plano}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantidade de Veículos</p>
                  <p className="font-bold text-gray-800">{proposta.quantidade_veiculos} veículo(s)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Unitário</p>
                  <p className="font-bold text-gray-800">{formatCurrency(proposta.valor_mensal)}/mês</p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-primary-600 p-6 rounded-lg">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Valor Mensal Total</p>
                  <p className="text-3xl font-bold text-primary-600">
                    {formatCurrency(proposta.valor_mensal * proposta.quantidade_veiculos)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Instalação</p>
                  <p className="text-3xl font-bold text-green-600">
                    {proposta.instalacao_gratuita ? 'GRATUITA' : formatCurrency(proposta.valor_instalacao || 0)}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Prazo de Permanência</p>
                <p className="text-lg font-bold text-gray-800">{proposta.prazo_permanencia} meses</p>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Instalação e Sinal */}
          <div className="mb-6 page-break-avoid">
            <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">INSTALAÇÃO E SINAL GPS/GPRS</h3>
            <div className="bg-blue-50 p-6 rounded-lg space-y-4">
              <div>
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="text-primary-600">🔧</span> Instalação Profissional
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Trabalhamos com as melhores práticas do mercado para garantir a eficiência e discrição do sistema.
                  Utilizamos materiais de alta qualidade e técnicas avançadas de instalação. O equipamento é
                  estrategicamente posicionado em locais ocultos do veículo, como parte interna dos bancos,
                  porta-malas, painéis ou outros compartimentos seguros, fugindo do padrão convencional.
                  Essa abordagem maximiza a proteção contra tentativas de remoção e garante o funcionamento
                  contínuo do rastreador.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="text-green-600">📡</span> Cobertura de Sinal Premium
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Utilizamos a infraestrutura da Algar Telecom com tecnologia multi-operadora, contando com
                  conexão simultânea de até 5 operadoras diferentes. Isso significa que seu veículo estará
                  sempre conectado, mesmo em áreas remotas ou de difícil cobertura. Essa redundância elimina
                  praticamente todos os pontos cegos e áreas sem cobertura, proporcionando rastreamento
                  ininterrupto em todo o território nacional com a máxima confiabilidade.
                </p>
              </div>
            </div>
          </div>

          {/* Recursos Incluídos */}
          <div className="mb-6 page-break-before">
            <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">RECURSOS INCLUÍDOS</h3>
            <div className="grid grid-cols-1 gap-2">
              {recursos.map((recurso, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <p className="text-sm text-gray-700">{recurso}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="mb-6 page-break-avoid">
            <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">INFORMAÇÕES IMPORTANTES</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>• <strong>Comodato:</strong> Equipamento em regime de comodato durante o período de contrato</p>
              <p>• <strong>Cobertura Nacional:</strong> Sistema funciona em todo território nacional via GPS/GPRS</p>
              <p>• <strong>Suporte 24/7:</strong> Central de atendimento disponível 24 horas por dia, 7 dias por semana</p>
              <p>• <strong>Aplicativo Mobile:</strong> Acesso via aplicativo iOS e Android incluído</p>
              <p>• <strong>Garantia:</strong> Equipamento com garantia contra defeitos de fabricação</p>
            </div>
          </div>

          {proposta.observacoes && (
            <div className="mb-6 page-break-avoid">
              <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">OBSERVAÇÕES</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{proposta.observacoes}</p>
            </div>
          )}

          {/* Rodapé */}
          <div className="mt-12 pt-6 border-t-2 border-gray-300 page-break-avoid">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Estamos à disposição para esclarecer quaisquer dúvidas sobre nossa proposta.
              </p>
              <p className="text-sm font-semibold text-gray-800">
                Aguardamos ansiosamente seu retorno para iniciarmos nossa parceria!
              </p>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p className="font-bold text-gray-800 mb-1">LINCE TRACK RASTREAMENTO</p>
              <p>CNPJ: 63.061.943/0001-44</p>
              <p>Email: comercial@lincetrack.com.br</p>
              <p>Telefone: (44) 99700-3426</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  )
}
