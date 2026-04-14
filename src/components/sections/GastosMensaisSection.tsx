import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function GastosMensaisSection() {
  const { dadosGlobais, dadosMesAtual, getTotalGastosMensais, adicionarGastoMensal, editarGastoMensal, removerGastoMensal } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ nome: '', valor: '', categoriaId: '' })
  const totalGastosMensais = getTotalGastosMensais()

  const handleSubmit = () => {
    const valor = parseFloat(formData.valor.replace(',', '.')) || 0
    if (!formData.nome || valor <= 0) return
    if (editingId) {
      editarGastoMensal(editingId, { nome: formData.nome, valor, categoriaId: formData.categoriaId ? parseInt(formData.categoriaId) : null })
      setEditingId(null)
    } else {
      adicionarGastoMensal({ nome: formData.nome, valor, categoriaId: formData.categoriaId ? parseInt(formData.categoriaId) : null })
    }
    setFormData({ nome: '', valor: '', categoriaId: '' }); setShowForm(false)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Gastos Mensais</h2>
          <p className="text-sm text-muted-foreground">Gastos variáveis deste mês</p>
        </div>
        <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">Total: {formatCurrency(totalGastosMensais)}</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {dadosMesAtual.gastosMensais.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum gasto mensal cadastrado</p>
        ) : (
          <div className="divide-y divide-border">
            {dadosMesAtual.gastosMensais.map(gasto => {
              const categoria = dadosGlobais.categorias.find(c => c.id === gasto.categoriaId)
              return (
                <div key={gasto.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoria?.cor || '#64748b' }} />
                    <div>
                      <span className="font-medium text-foreground">{gasto.nome}</span>
                      {categoria && <p className="text-xs text-muted-foreground">{categoria.nome}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-destructive">{formatCurrency(gasto.valor)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setFormData({ nome: gasto.nome, valor: String(gasto.valor), categoriaId: gasto.categoriaId ? String(gasto.categoriaId) : '' }); setEditingId(gasto.id); setShowForm(true) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Deseja remover este gasto?')) removerGastoMensal(gasto.id) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button onClick={() => { setFormData({ nome: '', valor: '', categoriaId: '' }); setEditingId(null); setShowForm(true) }}
        className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
        <Plus className="w-5 h-5" /> Adicionar Gasto Mensal
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{editingId ? 'Editar' : 'Novo'} Gasto Mensal</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do gasto"
                className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
              <input type="number" value={formData.valor} onChange={e => setFormData(p => ({ ...p, valor: e.target.value }))} placeholder="Valor"
                className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <select value={formData.categoriaId} onChange={e => setFormData(p => ({ ...p, categoriaId: e.target.value }))}
                className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Sem categoria</option>
                {dadosGlobais.categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <button onClick={handleSubmit} className="w-full h-12 mt-4 bg-primary text-primary-foreground font-medium rounded-lg flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> {editingId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
