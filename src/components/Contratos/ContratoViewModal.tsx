import { Contrato } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface ContratoViewModalProps {
  contrato: Contrato | null
  onClose: () => void
}

// ── Número por extenso (pt-BR) ────────────────────────────────────────────────
function numPorExtenso(n: number): string {
  if (n === 0) return 'zero'
  const un = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
    'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
  const dz = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const ct = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
    'seiscentos', 'setecentos', 'oitocentos', 'novecentos']
  if (n < 20) return un[n]
  if (n < 100) { const d = Math.floor(n / 10); const u = n % 10; return u === 0 ? dz[d] : `${dz[d]} e ${un[u]}` }
  if (n === 100) return 'cem'
  if (n < 1000) { const c = Math.floor(n / 100); const r = n % 100; return r === 0 ? ct[c] : `${ct[c]} e ${numPorExtenso(r)}` }
  if (n < 2000) { const r = n % 1000; return r === 0 ? 'mil' : `mil e ${numPorExtenso(r)}` }
  if (n < 1000000) { const m = Math.floor(n / 1000); const r = n % 1000; return r === 0 ? `${numPorExtenso(m)} mil` : `${numPorExtenso(m)} mil e ${numPorExtenso(r)}` }
  return n.toString()
}

function valorExtenso(valor: number): string {
  const reais = Math.floor(valor)
  const centavos = Math.round((valor - reais) * 100)
  let t = reais > 0 ? numPorExtenso(reais) : ''
  if (reais > 0 && centavos > 0) {
    t += ` ${reais === 1 ? 'real' : 'reais'} e ${numPorExtenso(centavos)} centavo${centavos !== 1 ? 's' : ''}`
  } else if (reais > 0) {
    t += ` ${reais === 1 ? 'real' : 'reais'}`
  } else {
    t = `${numPorExtenso(centavos)} centavo${centavos !== 1 ? 's' : ''}`
  }
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function dataLonga(dateStr: string): string {
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const parts = dateStr.split('-')
  return `${parseInt(parts[2])} de ${meses[parseInt(parts[1]) - 1]} de ${parts[0]}`
}

// ── Componentes de layout do contrato ────────────────────────────────────────
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 text-sm leading-relaxed text-justify">{children}</p>
)
const B = ({ children }: { children: React.ReactNode }) => <strong>{children}</strong>
const Cl = ({ num, titulo, children }: { num: string; titulo: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <p className="font-bold text-sm mb-2">{num} – {titulo}</p>
    {children}
  </div>
)
const Ul = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="list-disc list-outside ml-5 mb-3 space-y-1">
    {items.map((item, i) => <li key={i} className="text-sm text-justify">{item}</li>)}
  </ul>
)

export default function ContratoViewModal({ contrato, onClose }: ContratoViewModalProps) {
  if (!contrato) return null

  const totalRastr = contrato.valor_mensalidade * contrato.qtd_veiculos
  const totalAssist = (contrato.valor_assistencia || 0) * (contrato.qtd_veiculos_assistencia || 0)
  const temAssist = (contrato.valor_assistencia || 0) > 0

  const vlrMensStr = formatCurrency(contrato.valor_mensalidade)
  const vlrMensExt = valorExtenso(contrato.valor_mensalidade)
  const qtdVeicStr = numPorExtenso(contrato.qtd_veiculos)

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #contrato-print-content, #contrato-print-content * { visibility: visible; }
          #contrato-print-content {
            position: absolute; left: 0; top: 0;
            width: 100%; background: white;
            padding: 40px 60px; margin: 0; box-shadow: none;
          }
          .print-hide { display: none !important; }
          @page { size: A4 portrait; margin: 20mm; }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div
          id="contrato-print-content"
          className="bg-white w-full max-w-4xl max-h-[95vh] overflow-y-auto my-4 p-8 shadow-2xl relative font-sans text-gray-900"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="print-hide absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold z-10"
          >✕</button>

          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/logo-lince-track-new.png" alt="Lince Track" className="h-20 w-auto mx-auto object-contain" />
          </div>

          {/* Título */}
          <h1 className="text-center font-bold text-base mb-2 underline">CONTRATO DE LOCAÇÃO DE EQUIPAMENTO</h1>
          <h2 className="text-center font-bold text-sm mb-8">
            CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ALUGUEL DE EQUIPAMENTOS PARA RASTREAMENTO VEICULAR.
          </h2>

          {/* PARTES */}
          <div className="mb-6">
            <p className="font-bold text-sm mb-4">PARTES:</p>
            <P>
              De um lado, <B>LINCETRACK ALUGUEL DE EQUIPAMENTOS DE RASTREAMENTO VEICULAR LTDA, CNPJ 63.061.943/0001-44</B>,
              com sede e foro à Avenida Duque de Caxias, nº 882, Edifício New Tower Plaza I, Andar 01, Sala 107, Zona 01,
              CNPJ/MF: 63.061.943/0001-44, doravante denominada <B>CONTRATADA</B>.
            </P>
            <P>
              De outro lado, <B>{contrato.cliente_nome.toUpperCase()}</B>, CNPJ/CPF: {contrato.cliente_cnpj}, doravante denominada <B>CONTRATANTE</B>.
            </P>
            <P>As partes firmam este contrato conforme as cláusulas abaixo:</P>
          </div>

          {/* CLÁUSULA 1 */}
          <Cl num="CLÁUSULA 1" titulo="OBJETO">
            <P>
              Este contrato tem por objeto o aluguel de equipamento de rastreamento veicular, com equipamentos fornecidos e
              instalados pela <B>CONTRATADA</B>, utilizando tecnologia GPS/GPRS/GSM.
            </P>
            <P>
              A <B>CONTRATADA</B> fará a instalação, manutenção e assistência técnica apenas do equipamento, caso venha
              apresentar defeito do mesmo. O acompanhamento do rastreamento do veículo será feito por parte da <B>CONTRATANTE</B> via aplicativo.
            </P>
          </Cl>

          {/* CLÁUSULA 2 */}
          <Cl num="CLÁUSULA 2" titulo="OBRIGAÇÕES DA CONTRATADA">
            <Ul items={[
              <>Fornecer suporte técnico apenas do equipamento caso o mesmo apresente defeito em seu funcionamento;</>,
              <>Comunicar ocorrências aos contatos autorizados pela <B>CONTRATANTE</B> e, quando necessário, às autoridades.</>,
              <>Não responder por falhas de terceiros, ações criminosas, desastres naturais, mau uso ou manutenção por terceiros.</>,
              <>Não é responsabilidade da <B>CONTRATADA</B> a recuperação ou ressarcimento em caso de sinistro, furto ou roubo.</>
            ]} />
          </Cl>

          {/* CLÁUSULA 3 — dinâmica com valores do contrato */}
          <Cl num="CLÁUSULA 3" titulo="OBRIGAÇÕES DA CONTRATANTE">
            <Ul items={[
              // Item mensalidade
              contrato.qtd_veiculos === 1
                ? <>Pagar mensalidade por veículo monitorado de <B>{vlrMensStr} ({vlrMensExt})</B>.</>
                : <>Pagar mensalidade de <B>{vlrMensStr} ({vlrMensExt})</B> por veículo monitorado, para {qtdVeicStr} ({contrato.qtd_veiculos}) veículos, totalizando <B>{formatCurrency(totalRastr)} ({valorExtenso(totalRastr)})</B> mensais.</>,

              // Item assistência (só se tiver)
              ...(temAssist ? [
                contrato.qtd_veiculos_assistencia === 1
                  ? <>Assistência veicular adicional por veículo monitorado <B>R${formatCurrency(contrato.valor_assistencia!).replace('R$ ', '').replace('R$ ', '')} ({valorExtenso(contrato.valor_assistencia!)})</B> por unidade, podendo ser contratada conforme necessidade da <B>CONTRATANTE</B>.</>
                  : <>Assistência veicular adicional de <B>{formatCurrency(contrato.valor_assistencia!)} ({valorExtenso(contrato.valor_assistencia!)})</B> por veículo monitorado, para {numPorExtenso(contrato.qtd_veiculos_assistencia!)} ({contrato.qtd_veiculos_assistencia}) veículos, totalizando <B>{formatCurrency(totalAssist)} ({valorExtenso(totalAssist)})</B> mensais, podendo ser contratada conforme necessidade da <B>CONTRATANTE</B>.</>
              ] : []),

              <>Em caso de atraso, incidirá multa de 2% e juros de 1% ao mês. Após 30 dias, poderá haver negativação no SPC/SERASA.</>,
              <>Preservar os equipamentos e comunicar qualquer problema.</>,
              <>Arcar com custos de deslocamento da <B>CONTRATADA</B> para manutenções fora da sua base.</>,
              <>Manter seus dados atualizados e comunicar alterações.</>
            ]} />
          </Cl>

          {/* CLÁUSULA 3-A — nova: reajuste de valores */}
          <Cl num="CLÁUSULA 3-A" titulo="REAJUSTE DE VALORES">
            <P>
              Os valores pactuados na Cláusula 3 poderão sofrer reajuste durante o período de vigência contratual, desde que
              previamente comunicado e acordado com a <B>CONTRATANTE</B>, com antecedência mínima de 30 (trinta) dias,
              visando manter o equilíbrio econômico-financeiro do contrato e a qualidade dos serviços prestados.
            </P>
          </Cl>

          {/* CLÁUSULA 4 */}
          <Cl num="CLÁUSULA 4" titulo="FORNECIMENTO DE INFORMAÇÕES">
            <P>
              A <B>CONTRATANTE</B> deve fornecer todos os dados e identificações necessárias para o funcionamento dos serviços.
            </P>
          </Cl>

          {/* CLÁUSULA 5 */}
          <Cl num="CLÁUSULA 5" titulo="RESTRIÇÕES">
            <Ul items={[
              <>Os serviços só serão prestados se os pagamentos estiverem em dia.</>,
              <>A reinstalação do equipamento em outro veículo custa <B>R$ 80,00 (oitenta reais)</B>.</>,
              <>O não recebimento do boleto não exime a <B>CONTRATANTE</B> do pagamento.</>
            ]} />
          </Cl>

          {/* CLÁUSULA 6 */}
          <Cl num="CLÁUSULA 6" titulo="VIGÊNCIA">
            <P>
              O contrato de locação do equipamento tem vigência de 12 (doze) meses, com renovação automática por igual
              período, salvo manifestação em contrário, com pelo menos 30 dias de antecedência.
            </P>
          </Cl>

          {/* CLÁUSULA 7 */}
          <Cl num="CLÁUSULA 7" titulo="PAGAMENTO">
            <P>
              Pagamentos devem ser feitos via boleto ou PIX. O não recebimento do boleto deve ser comunicado para emissão
              da segunda via. Fica condicionado por parte da <B>CONTRATANTE</B> definir qual e-mail irá receber a nota fiscal
              e boleto da <B>CONTRATADA</B>.
            </P>
          </Cl>

          {/* CLÁUSULA 8 */}
          <Cl num="CLÁUSULA 8" titulo="RESCISÃO">
            <P>O contrato poderá ser rescindido antecipadamente por qualquer das partes.</P>
            <Ul items={[
              <>Em caso de rescisão por iniciativa da <B>CONTRATANTE</B> antes do término da vigência, será aplicada uma multa
                de 10% sobre o valor total restante do contrato, além de ser cobrada uma taxa de retirada do equipamento no
                valor de <B>R$80,00 (oitenta reais)</B> por equipamento instalado.</>
            ]} />
            <P>A rescisão também poderá ocorrer nas seguintes hipóteses, sem prejuízo da multa acima:</P>
            <Ul items={[
              <>Falência ou insolvência de qualquer das partes;</>,
              <>Descumprimento das cláusulas contratuais;</>,
              <>Alterações organizacionais que inviabilizem a utilização do equipamento;</>,
              <>Não é permitida a transferência de débitos e responsabilidades a terceiros.</>
            ]} />
          </Cl>

          {/* CLÁUSULA 9 */}
          <Cl num="CLÁUSULA 9" titulo="DISPOSIÇÕES GERAIS">
            <P>A cobertura depende da infraestrutura das operadoras de sinal GPS/GPRS/GSM.</P>
            <P>
              A <B>CONTRATANTE</B> declara estar ciente e de acordo com todos os termos e autoriza o contato com a
              Central de Atendimento para suporte.
            </P>
          </Cl>

          {/* CLÁUSULA 10 */}
          <Cl num="CLÁUSULA 10" titulo="EXTRAVIO DO EQUIPAMENTO">
            <P>
              Em caso de extravio, perda ou não devolução do equipamento de rastreamento, a <B>CONTRATANTE</B> deverá pagar
              o valor de <B>R$250,00 (duzentos e cinquenta reais)</B> por unidade extraviada.
            </P>
          </Cl>

          {/* CLÁUSULA 11 */}
          <Cl num="CLÁUSULA 11" titulo="FORO">
            <P>
              Fica eleito o foro da comarca de Maringá/PR para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato.
            </P>
          </Cl>

          {/* Assinaturas */}
          <div className="mt-10">
            <P>E, por estarem de acordo, as partes assinam o presente instrumento.</P>
            <P>Maringá – PR, {dataLonga(contrato.data_contrato)}.</P>

            <div className="mt-12 space-y-10">
              <div>
                <div className="border-b border-gray-800 w-full mb-1" />
                <p className="text-sm font-bold">LINCETRACK ALUGUEL DE EQUIPAMENTOS DE RASTREAMENTO VEICULAR LTDA</p>
              </div>
              <div>
                <div className="border-b border-gray-800 w-64 mb-1" />
                <p className="text-sm font-bold">{contrato.cliente_nome.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Botão imprimir */}
          <div className="print-hide sticky bottom-0 bg-white border-t border-gray-300 p-4 mt-8 flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-700 font-medium"
            >
              🖨️ Imprimir / Salvar PDF
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
