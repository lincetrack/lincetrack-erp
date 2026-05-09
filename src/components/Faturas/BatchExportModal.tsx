import { useState } from 'react'
import { Fatura, Cliente } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { faturaService } from '@/services/faturaService'
import { clienteService } from '@/services/clienteService'

interface BatchExportModalProps {
  isOpen: boolean
  onClose: () => void
}

const MESES: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Marco',
  '04': 'Abril', '05': 'Maio', '06': 'Junho',
  '07': 'Julho', '08': 'Agosto', '09': 'Setembro',
  '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
}

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50)
}

async function loadLogoAsDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('/logo-lince-track-new.png')
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function generateInvoicePDF(invoice: Fatura, customer: Cliente, logoDataUrl: string | null) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const pageW = 210
  const mL = 15
  const mR = 15
  const usableW = pageW - mL - mR

  const qtd = invoice.quantidade_veiculos || 1
  const vlrUnit = invoice.valor / qtd

  // ── HEADER ──────────────────────────────────────────────────────────
  let y = 15

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', mL, y, 38, 22)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('LINCE TRACK', mL + 42, y + 9)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text('RASTREAMENTO VEICULAR', mL + 42, y + 15)
  doc.setTextColor(0)

  // Caixa Nº FATURA (direita)
  const boxW = 46
  const boxX = pageW - mR - boxW
  doc.setDrawColor(30)
  doc.setLineWidth(0.5)
  doc.rect(boxX, y, boxW, 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('Nº FATURA', boxX + boxW / 2, y + 5, { align: 'center' })
  doc.setFontSize(15)
  doc.text(String(invoice.numero_fatura), boxX + boxW / 2, y + 12, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`VENCIMENTO: ${formatDate(invoice.data_vencimento)}`, pageW - mR, y + 21, { align: 'right' })
  doc.text(`Data de emissão: ${formatDate(invoice.data_emissao)}`, pageW - mR, y + 26, { align: 'right' })

  // Linha divisória
  y = 42
  doc.setLineWidth(0.7)
  doc.line(mL, y, pageW - mR, y)

  // ── EMISSOR ─────────────────────────────────────────────────────────
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('LINCE TRACK', mL, y)
  doc.setFont('helvetica', 'normal')
  doc.text('Av. Duque de Caxias nº 882, SL 107, Zona 01, MARINGÁ-PARANÁ', mL, y + 5)
  doc.text('CEP: 87020-025 | CONTATO: (44) 99700-3426 | e-mail: lincetrack@gmail.com', mL, y + 10)
  doc.setFont('helvetica', 'bold')
  doc.text('CNPJ: 63.061.943/0001-44 | Inscrição Estadual: ISENTO', mL, y + 15)

  // ── DESTINATÁRIO ────────────────────────────────────────────────────
  y += 23
  doc.setDrawColor(150)
  doc.setLineWidth(0.3)
  doc.setFillColor(240, 240, 240)
  doc.rect(mL, y, usableW, 7, 'F')
  doc.rect(mL, y, usableW, 29)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('DESTINATÁRIO', mL + 2, y + 5)

  y += 9
  const c1 = mL + 2
  const c2 = mL + usableW / 2

  doc.setFont('helvetica', 'bold')
  doc.text('Nome/Razão Social:', c1, y)
  doc.setFont('helvetica', 'normal')
  const nomeCliente = (customer.nome || '').slice(0, 40)
  doc.text(nomeCliente, c1 + 34, y)

  doc.setFont('helvetica', 'bold')
  doc.text('CNPJ:', c2, y)
  doc.setFont('helvetica', 'normal')
  doc.text(customer.cnpj || '', c2 + 11, y)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Endereço:', c1, y)
  doc.setFont('helvetica', 'normal')
  doc.text((customer.endereco || '').slice(0, 40), c1 + 19, y)

  doc.setFont('helvetica', 'bold')
  doc.text('Bairro:', c2, y)
  doc.setFont('helvetica', 'normal')
  doc.text((customer.bairro || '').slice(0, 25), c2 + 13, y)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Cidade:', c1, y)
  doc.setFont('helvetica', 'normal')
  doc.text(customer.cidade || '', c1 + 14, y)

  doc.setFont('helvetica', 'bold')
  doc.text('UF:', c2, y)
  doc.setFont('helvetica', 'normal')
  doc.text(customer.estado || '', c2 + 7, y)

  // ── REFERENTE ───────────────────────────────────────────────────────
  y += 15
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Referente a solicitação de fornecimento', mL, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80)
  doc.text('Fornecimento de equipamento e software para rastreamento veicular.', mL, y + 6)
  doc.setTextColor(0)

  // ── DADOS BANCÁRIOS ─────────────────────────────────────────────────
  y += 15
  doc.setFillColor(240, 240, 240)
  doc.setDrawColor(180)
  doc.rect(mL, y, usableW, 22, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Dados Bancários:', mL + 3, y + 6)
  doc.setFontSize(10)
  doc.text('PIX CNPJ: 63.061.943/0001-44', mL + 3, y + 13)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Banco Nubank', mL + 3, y + 18.5)
  doc.setTextColor(120)
  doc.setFontSize(7)
  doc.text('Ou Boleto.', mL + 3, y + 22 - 1.5)
  doc.setTextColor(0)

  // ── TABELA ──────────────────────────────────────────────────────────
  y += 30
  const cDescW = usableW * 0.50
  const cQtdW = usableW * 0.12
  const cUnitW = usableW * 0.19
  const cTotW = usableW * 0.19
  const cDescX = mL
  const cQtdX = cDescX + cDescW
  const cUnitX = cQtdX + cQtdW
  const cTotX = cUnitX + cUnitW

  // Cabeçalho tabela
  doc.setFillColor(210, 210, 210)
  doc.setDrawColor(30)
  doc.setLineWidth(0.4)
  doc.rect(mL, y, usableW, 7, 'FD')
  doc.line(cQtdX, y, cQtdX, y + 7)
  doc.line(cUnitX, y, cUnitX, y + 7)
  doc.line(cTotX, y, cTotX, y + 7)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Descrição', cDescX + 2, y + 5)
  doc.text('Qtde.', cQtdX + cQtdW / 2, y + 5, { align: 'center' })
  doc.text('Vlr Unit.', cUnitX + cUnitW / 2, y + 5, { align: 'center' })
  doc.text('TOTAL', cTotX + cTotW / 2, y + 5, { align: 'center' })

  // Linha de dados
  y += 7
  const rowH = 9
  doc.setFillColor(255, 255, 255)
  doc.rect(mL, y, usableW, rowH, 'FD')
  doc.line(cQtdX, y, cQtdX, y + rowH)
  doc.line(cUnitX, y, cUnitX, y + rowH)
  doc.line(cTotX, y, cTotX, y + rowH)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  const desc = (invoice.descricao || '').slice(0, 55)
  doc.text(desc, cDescX + 2, y + 6)
  doc.text(String(qtd), cQtdX + cQtdW / 2, y + 6, { align: 'center' })
  doc.text(formatCurrency(vlrUnit), cUnitX + cUnitW - 2, y + 6, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(invoice.valor), cTotX + cTotW - 2, y + 6, { align: 'right' })

  // ── TOTAIS ──────────────────────────────────────────────────────────
  y += rowH + 6
  const totW = usableW / 2
  const totX = mL + usableW - totW

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setDrawColor(180)
  doc.setLineWidth(0.2)

  doc.line(totX, y, totX + totW, y)
  doc.text('Retenção de ISSQN:', totX + 1, y + 5)
  doc.text('NÃO', totX + totW - 1, y + 5, { align: 'right' })

  y += 6
  doc.line(totX, y, totX + totW, y)
  doc.text('Valor da Retenção:', totX + 1, y + 5)
  doc.text('R$ 0,00', totX + totW - 1, y + 5, { align: 'right' })

  y += 8
  doc.setFillColor(210, 210, 210)
  doc.rect(totX, y, totW, 9, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('TOTAL GERAL:', totX + 2, y + 6.2)
  doc.text(formatCurrency(invoice.valor), totX + totW - 2, y + 6.2, { align: 'right' })

  // ── RODAPÉ ──────────────────────────────────────────────────────────
  const footerY = 275
  doc.setDrawColor(180)
  doc.setLineWidth(0.3)
  doc.line(mL, footerY, pageW - mR, footerY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(100)
  doc.text(
    'Operação não sujeita a emissão de nota fiscal de serviço - Vetada a cobrança de ISSQN conforme lei complementar 116/2003',
    pageW / 2, footerY + 5, { align: 'center' }
  )
  doc.text(
    'Documento emitido por ME ou EPP Optante pelo Simples Nacional',
    pageW / 2, footerY + 10, { align: 'center' }
  )
  doc.setFont('helvetica', 'bold')
  doc.text(
    `${customer.cidade} - ${customer.estado}, ${new Date().toLocaleDateString('pt-BR')}`,
    pageW / 2, footerY + 16, { align: 'center' }
  )
  doc.setTextColor(0)

  return doc
}

export default function BatchExportModal({ isOpen, onClose }: BatchExportModalProps) {
  const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, currentName: '' })
  const [done, setDone] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleExport = async () => {
    setLoading(true)
    setDone(false)
    setErro(null)
    setProgress({ current: 0, total: 0, currentName: '' })

    try {
      const [clientes, todasFaturas] = await Promise.all([
        clienteService.getAll(),
        faturaService.getAll()
      ])

      const [ano, mes] = selectedMonth.split('-')
      const faturasFiltradas = todasFaturas.filter(f => {
        const [fAno, fMes] = f.data_vencimento.split('-')
        return fAno === ano && fMes === mes
      })

      if (faturasFiltradas.length === 0) {
        setErro('Nenhuma fatura encontrada para o período selecionado.')
        setLoading(false)
        return
      }

      const [logoDataUrl, JSZipModule] = await Promise.all([
        loadLogoAsDataUrl(),
        import('jszip')
      ])
      const JSZip = JSZipModule.default
      const zip = new JSZip()

      setProgress({ current: 0, total: faturasFiltradas.length, currentName: '' })

      const mesNome = MESES[mes] || mes

      for (let i = 0; i < faturasFiltradas.length; i++) {
        const fatura = faturasFiltradas[i]
        const cliente = clientes.find(c => c.id === fatura.cliente_id)
        if (!cliente) continue

        setProgress({ current: i + 1, total: faturasFiltradas.length, currentName: cliente.nome })

        const doc = await generateInvoicePDF(fatura, cliente, logoDataUrl)
        const pdfBlob = doc.output('blob')

        const nomeArquivo = `${sanitizeFileName(cliente.nome)}_${mesNome}_${ano}.pdf`
        zip.file(nomeArquivo, pdfBlob)

        await new Promise(r => setTimeout(r, 30))
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Faturas_LinceTrack_${MESES[mes]}_${ano}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setDone(true)
    } catch (err) {
      console.error('Erro ao exportar faturas:', err)
      setErro('Erro ao gerar os PDFs. Verifique o console e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setDone(false)
      setErro(null)
      onClose()
    }
  }

  if (!isOpen) return null

  const [ano, mes] = selectedMonth.split('-')
  const mesNome = MESES[mes] || mes
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">📦 Exportar Faturas em Lote</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-red-500 text-2xl font-bold disabled:opacity-30"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mês / Ano de referência
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setDone(false); setErro(null) }}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 space-y-2">
            <p className="font-medium text-gray-700">O que será gerado:</p>
            <p>📄 Um PDF por fatura com o layout padrão Lince Track</p>
            <p>📝 Nome de cada arquivo:</p>
            <p className="font-mono bg-white border rounded px-2 py-1 text-gray-800">
              NomeCliente_{mesNome}_{ano}.pdf
            </p>
            <p>🗜️ Todos compactados em um único arquivo ZIP para download</p>
          </div>

          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between text-sm font-medium text-blue-800 mb-2">
                <span>Gerando PDFs...</span>
                <span>{progress.current}/{progress.total} ({pct}%)</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {progress.currentName && (
                <p className="text-xs text-blue-600 truncate">
                  ⏳ Processando: {progress.currentName}
                </p>
              )}
            </div>
          )}

          {done && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800">
                ✅ ZIP gerado e salvo com sucesso!
              </p>
              <p className="text-xs text-green-600 mt-1">
                {progress.total} fatura(s) exportada(s) — {MESES[mes]} {ano}
              </p>
            </div>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">⚠️ {erro}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Fechar
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {loading ? '⏳ Processando...' : '📦 Exportar ZIP'}
          </button>
        </div>
      </div>
    </div>
  )
}
