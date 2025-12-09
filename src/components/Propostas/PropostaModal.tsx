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
    'Envio de alertas via WhatsApp e Email'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:relative print:bg-white print:p-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
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
        <div className="p-8 print:p-12">
          {/* Cabeçalho com Logo */}
          <div className="flex justify-between items-start mb-8 border-b-4 border-primary-600 pb-6">
            <div>
              <img
                src="/logo.png"
                alt="Lince Track"
                className="h-16 mb-2"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <div className="hidden text-3xl font-bold text-primary-600">LINCE TRACK</div>
              <p className="text-sm text-gray-600 mt-2">Soluções em Rastreamento Veicular</p>
              <p className="text-xs text-gray-500">CNPJ: 63.061.943/0001-44</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Proposta Comercial</p>
              <p className="text-2xl font-bold text-gray-800">#{String(proposta.numero_proposta).padStart(4, '0')}</p>
              <p className="text-xs text-gray-500 mt-1">Data: {formatDate(proposta.created_at.split('T')[0])}</p>
              <p className="text-xs text-gray-500">Validade: {formatDate(proposta.data_validade)}</p>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">DADOS DO CLIENTE</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Empresa</p>
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
              {proposta.prospect_cnpj && (
                <div>
                  <p className="text-sm text-gray-600">CNPJ</p>
                  <p className="font-semibold text-gray-800">{proposta.prospect_cnpj}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Localização</p>
                <p className="font-semibold text-gray-800">{proposta.prospect_cidade}/{proposta.prospect_estado}</p>
              </div>
            </div>
          </div>

          {/* Detalhes da Proposta */}
          <div className="mb-8">
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

          {/* Recursos Incluídos */}
          <div className="mb-8 page-break-before">
            <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">RECURSOS INCLUÍDOS</h3>
            <div className="grid grid-cols-1 gap-2">
              {recursos.map((recurso, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-sm text-gray-700">{recurso}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="mb-8">
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
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">OBSERVAÇÕES</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{proposta.observacoes}</p>
            </div>
          )}

          {/* Rodapé */}
          <div className="mt-12 pt-6 border-t-2 border-gray-300">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Estamos à disposição para dirimir quaisquer dúvidas.
              </p>
              <p className="text-sm font-semibold text-gray-800">
                Aguardamos o retorno!
              </p>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p className="font-bold text-gray-800 mb-1">LINCE TRACK RASTREAMENTO</p>
              <p>CNPJ: 63.061.943/0001-44</p>
              <p>Email: comercial@lincetrack.com.br</p>
              <p>Telefone: (41) 99999-9999</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white;
          }

          .page-break-before {
            page-break-before: always;
          }

          @page {
            margin: 2cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  )
}
