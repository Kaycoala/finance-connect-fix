import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Plus, Edit2, Trash2, X, Check, CreditCard, Calendar } from 'lucide-react'
import { Parcela } from '@/lib/types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function CartoesSection() {
  const { dadosGlobais, dadosMesAtual, mesAtual, anoAtual, getTotalCartoes, getParcelasAtivas, adicionarItemCartao, editarItemCartao, removerItemCartao, adicionarBanco, removerBanco, adicionarParcela, editarParcela, removerParcela } = useData()

  const [selectedBanco, setSelectedBanco] = useState(dadosGlobais.bancos[0] || '')
  const [showForm, setShowForm] = useState(false)
  const [showBancoForm, setShowBancoForm] = useState(false)
  const [showParcelaForm, setShowParcelaForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingParcelaId, setEditingParcelaId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ descricao: '', valor: '' })
  const [parcelaData, setParcelaData] = useState({ descricao: '', valorTotal: '', numParcelas: '2', banco: '' })
  const [novoBanco, setNovoBanco] = useState('')

  const parcelasAtivas = getParcelasAtivas()
  const totalCartoes = getTotalCartoes()
  const itensCartao = dadosMesAtual.cartoes[selectedBanco] || []
  const totalBanco = itensCartao.reduce((acc, i) => acc + i.valor, 0)
  const totalParcelas = parcelasAtivas.reduce((acc, p) => acc + (p.valorTotal / p.numParcelas), 0)

  const handleSubmit = () => {
    const valor = parseFloat(formData.valor.replace(',', '.')) || 0
    if (!formData.descricao || valor <= 0) return
    if (editingId) { editarItemCartao(selectedBanco, editingId, { descricao: formData.descricao, valor }); setEditingId(null) }
    else { adicionarItemCartao(selectedBanco, { descricao: formData.descricao, valor }) }
    setFormData({ descricao: '', valor: '' }); setShowForm(false)
  }

  const handleSubmitParcela = () => {
    const valorTotal = parseFloat(parcelaData.valorTotal.replace(',', '.')) || 0
    const numParcelas = parseInt(parcelaData.numParcelas) || 2
    if (!parcelaData.descricao || valorTotal <= 0 || numParcelas < 2) return
    if (editingParcelaId) { editarParcela(editingParcelaId, { descricao: parcelaData.descricao, valorTotal, numParcelas, banco: parcelaData.banco || selectedBanco }); setEditingParcelaId(null) }
    else { adicionarParcela({ descricao: parcelaData.descricao, valorTotal, numParcelas, mesInicio: mesAtual, anoInicio: anoAtual, banco: parcelaData.banco || selectedBanco }) }
    setParcelaData({ descricao: '', valorTotal: '', numParcelas: '2', banco: '' }); setShowParcelaForm(false)
  }

  const startEditParcela = (parcela: Parcela) => {
    setParcelaData({ descricao: parcela.descricao, valorTotal: String(parcela.valorTotal), numParcelas: String(parcela.numParcelas), banco: parcela.banco })
    setEditingParcelaId(parcela.id); setShowParcelaForm(true)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cartões de Crédito</h2>
          <p className="text-sm text-muted-foreground">Itens do cartão por banco</p>
        </div>
        <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">Total: {formatCurrency(totalCartoes + totalParcelas)}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {dadosGlobais.bancos.map(banco => {
          const total = (dadosMesAtual.cartoes[banco] || []).reduce((acc, i) => acc + i.valor, 0)
          return (
            <button key={banco} onClick={() => setSelectedBanco(banco)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedBanco === banco ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-secondary'}`}>
              {banco} <span className="ml-2 opacity-70">{formatCurrency(total)}</span>
            </button>
          )
        })}
        <button onClick={() => setShowBancoForm(true)} className="flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium bg-card border border-dashed border-border text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="w-4 h-4 inline mr-1" /> Banco
        </button>
      </div>

      {selectedBanco && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">{selectedBanco}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-destructive">{formatCurrency(totalBanco)}</span>
              <button onClick={() => { if (confirm(`Remover banco "${selectedBanco}"?`)) { removerBanco(selectedBanco); setSelectedBanco(dadosGlobais.bancos[0] || '') } }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
          {itensCartao.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum item cadastrado</p>
          ) : (
            <div className="divide-y divide-border">
              {itensCartao.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4">
                  <span className="font-medium text-foreground">{item.descricao}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-destructive">{formatCurrency(item.valor)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setFormData({ descricao: item.descricao, valor: String(item.valor) }); setEditingId(item.id); setShowForm(true) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Remover item?')) removerItemCartao(selectedBanco, item.id) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {parcelasAtivas.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-warning/10">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-warning" />
              <span className="font-semibold text-foreground">Parcelas Ativas</span>
            </div>
            <span className="font-bold text-warning">{formatCurrency(totalParcelas)}</span>
          </div>
          <div className="divide-y divide-border">
            {parcelasAtivas.map(parcela => {
              const valorParcela = parcela.valorTotal / parcela.numParcelas
              return (
                <div key={parcela.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-foreground">{parcela.descricao}</p>
                    <p className="text-xs text-muted-foreground">Parcela {parcela.parcelaAtual}/{parcela.numParcelas} {parcela.banco && `• ${parcela.banco}`}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-warning">{formatCurrency(valorParcela)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => startEditParcela(parcela)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Remover parcela?')) removerParcela(parcela.id) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => { setFormData({ descricao: '', valor: '' }); setEditingId(null); setShowForm(true) }}
          className="flex-1 h-12 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" /> Item do Cartão
        </button>
        <button onClick={() => { setParcelaData({ descricao: '', valorTotal: '', numParcelas: '2', banco: '' }); setEditingParcelaId(null); setShowParcelaForm(true) }}
          className="flex-1 h-12 bg-warning text-warning-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" /> Parcela
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{editingId ? 'Editar' : 'Novo'} Item</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" value={formData.descricao} onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição"
                className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
              <input type="number" value={formData.valor} onChange={e => setFormData(p => ({ ...p, valor: e.target.value }))} placeholder="Valor"
                className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button onClick={handleSubmit} className="w-full h-12 mt-4 bg-primary text-primary-foreground font-medium rounded-lg flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> {editingId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {showBancoForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Novo Banco</h3>
              <button onClick={() => setShowBancoForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <input type="text" value={novoBanco} onChange={e => setNovoBanco(e.target.value)} placeholder="Nome do banco"
              className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
            <button onClick={() => { if (novoBanco.trim()) { adicionarBanco(novoBanco.trim()); setSelectedBanco(novoBanco.trim()); setNovoBanco(''); setShowBancoForm(false) } }}
              className="w-full h-12 mt-4 bg-primary text-primary-foreground font-medium rounded-lg flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Adicionar
            </button>
          </div>
        </div>
      )}

      {showParcelaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{editingParcelaId ? 'Editar' : 'Nova'} Parcela</h3>
              <button onClick={() => setShowParcelaForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" value={parcelaData.descricao} onChange={e => setParcelaData(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição"
                className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
              <input type="number" value={parcelaData.valorTotal} onChange={e => setParcelaData(p => ({ ...p, valorTotal: e.target.value }))} placeholder="Valor total"
                className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="number" value={parcelaData.numParcelas} onChange={e => setParcelaData(p => ({ ...p, numParcelas: e.target.value }))} placeholder="Nº parcelas" min="2"
                className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <select value={parcelaData.banco} onChange={e => setParcelaData(p => ({ ...p, banco: e.target.value }))}
                className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Banco (opcional)</option>
                {dadosGlobais.bancos.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <button onClick={handleSubmitParcela} className="w-full h-12 mt-4 bg-warning text-warning-foreground font-medium rounded-lg flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> {editingParcelaId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
