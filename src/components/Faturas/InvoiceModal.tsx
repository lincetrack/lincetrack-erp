import { Fatura, Cliente } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface InvoiceModalProps {
  invoice: Fatura | null
  customer: Cliente | null
  onClose: () => void
}

export default function InvoiceModal({ invoice, customer, onClose }: InvoiceModalProps) {
  if (!invoice || !customer) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl min-h-[800px] p-8 shadow-2xl relative text-sm font-sans text-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 print:hidden text-2xl font-bold"
        >
          ✕
        </button>

        {/* HEADER */}
        <div className="flex justify-between border-b-2 border-gray-800 pb-4 mb-4">
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
            </div>
          </div>
          <div className="text-right">
            <div className="border border-gray-800 p-2 mb-2 inline-block text-center min-w-[120px]">
              <p className="text-xs font-bold">NOTA Nº FATURA</p>
              <p className="text-lg font-bold">{invoice.id.toString().slice(-4)}</p>
            </div>
            <p className="text-sm"><strong>VENCIMENTO:</strong> {formatDate(invoice.data_vencimento)}</p>
            <p className="text-sm">Data de emissão: {formatDate(invoice.data_emissao)}</p>
          </div>
        </div>

        {/* EMISSOR */}
        <div className="mb-6 text-xs">
          <p className="font-bold">LINCE TRACK</p>
          <p>Av. Duque de Caxias nº 882, SL 107, Zona 01, MARINGÁ-PARANÁ</p>
          <p>CEP: 87020-025 | CONTATO: (44) 99700-3426 | e-mail: lincetrack@gmail.com</p>
          <p className="mt-1"><strong>CNPJ: 63.061.943/0001-44</strong> | Inscrição Estadual: ISENTO</p>
        </div>

        {/* DESTINATÁRIO */}
        <div className="border border-gray-400 p-4 mb-6 bg-gray-50">
          <h3 className="font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">DESTINATÁRIO</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-bold">Nome/Razão Social:</span> {customer.nome}</p>
              <p><span className="font-bold">Endereço:</span> {customer.endereco}</p>
              <p><span className="font-bold">Cidade:</span> {customer.cidade}</p>
            </div>
            <div>
              <p><span className="font-bold">CNPJ:</span> {customer.cnpj}</p>
              <p><span className="font-bold">Bairro:</span> {customer.bairro}</p>
              <p><span className="font-bold">UF:</span> {customer.estado}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="font-bold mb-1">Referente a solicitação de fornecimento</p>
          <p className="text-gray-600">Fornecimento de equipamento e software para rastreamento veicular.</p>
        </div>

        {/* DADOS BANCÁRIOS */}
        <div className="mb-6 bg-gray-100 p-3 rounded">
          <p className="font-bold">Dados Bancários:</p>
          <p className="text-lg">PIX CNPJ: 63.061.943/0001-44</p>
          <p>Banco Nubank</p>
          <p className="text-xs text-gray-500 mt-1">Ou Boleto.</p>
        </div>

        {/* TABELA */}
        <table className="w-full mb-8 border-collapse border border-gray-800">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-800 p-2 text-left">Descrição</th>
              <th className="border border-gray-800 p-2 text-center">Qtde.</th>
              <th className="border border-gray-800 p-2 text-right">Vlr Unit.</th>
              <th className="border border-gray-800 p-2 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-800 p-2">{invoice.descricao}</td>
              <td className="border border-gray-800 p-2 text-center">1</td>
              <td className="border border-gray-800 p-2 text-right">{formatCurrency(invoice.valor)}</td>
              <td className="border border-gray-800 p-2 text-right font-bold">{formatCurrency(invoice.valor)}</td>
            </tr>
          </tbody>
        </table>

        {/* TOTAIS */}
        <div className="flex justify-end mb-8">
          <div className="w-1/2">
            <div className="flex justify-between border-b border-gray-300 py-1">
              <span>Retenção de ISSQN:</span>
              <span>NÃO</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 py-1">
              <span>Valor da Retenção:</span>
              <span>R$ 0,00</span>
            </div>
            <div className="flex justify-between py-2 text-lg font-bold bg-gray-200 px-2 mt-2">
              <span>TOTAL GERAL:</span>
              <span>{formatCurrency(invoice.valor)}</span>
            </div>
          </div>
        </div>

        {/* RODAPÉ LEGAL */}
        <div className="text-[10px] text-gray-500 text-center border-t border-gray-300 pt-4 mt-auto">
          <p>Operação não sujeita a emissão de nota fiscal de serviço - Vetada a cobrança de ISSQN conforme lei complementar 116/2003</p>
          <p>Documento emitido por ME ou EPP Optante pelo Simples Nacional</p>
          <p className="mt-2 font-bold">{customer.cidade} - {customer.estado}, {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="absolute bottom-4 right-4 print:hidden">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
          >
            🖨️ Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    </div>
  )
}
