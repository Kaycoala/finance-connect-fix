import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Plus, Edit2, Trash2, X, Check, Calendar, CalendarX, CalendarRange } from 'lucide-react'
import { GastoFixo } from '@/lib/types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

type DeleteOption = 'thisMonth' | 'allMonths' | 'fromThisMonth'

export function GastosFixosSection() {
  const { dadosGlobais, mesAtual, anoAtual, getTotalGastosFixos, getGastosFixosFiltrados, adicionarGastoFixo, editarGastoFixo, removerGastoFixo, removerGastoFixoMes, removerGastoFixoAPartirDe } = useData()
  const gastosFixosFiltrados = getGastosFixosFiltrados()
  const [showForm, setShowForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingGasto, setDeletingGasto] = useState<GastoFixo | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ nome: '', valor: '', categoriaId: '' })
  const totalGastosFixos = getTotalGastosFixos()

  const handleSubmit = () => {
    const valor = parseFloat(formData.valor.replace(',', '.')) || 0
    if (!formData.nome || valor <= 0) return
    if (editingId) {
      editarGastoFixo(editingId, { nome: formData.nome, valor, categoriaId: formData.categoriaId ? parseInt(formData.categoriaId) : null })
      setEditingId(null)
    } else {
      adicionarGastoFixo({ nome: formData.nome, valor, categoriaId: formData.categoriaId ? parseInt(formData.categoriaId) : null })
    }
    setFormData({ nome: '', valor: '', categoriaId: '' }); setShowForm(false)
  }

  const handleDelete = (option: DeleteOption) => {
    if (!deletingGasto) return
    if (option === 'allMonths') removerGastoFixo(deletingGasto.id)
    else if (option === 'thisMonth') removerGastoFixoMes(deletingGasto.id, mesAtual, anoAtual)
    else if (option === 'fromThisMonth') removerGastoFixoAPartirDe(deletingGasto.id, mesAtual, anoAtual)
    setShowDeleteModal(false); setDeletingGasto(null)
  }

  const startEdit = (gasto: GastoFixo) => {
    setFormData({ nome: gasto.nome, valor: String(gasto.valor), categoriaId: gasto.categoriaId ? String(gasto.categoriaId) : '' })
    setEditingId(gasto.id); setShowForm(true)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Gastos Fixos</h2>
          <p className="text-sm text-muted-foreground">Gastos que se repetem todo mês</p>
        </div>
        <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">Total: {formatCurrency(totalGastosFixos)}</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {gastosFixosFiltrados.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum gasto fixo cadastrado</p>
        ) : (
          <div className="divide-y divide-border">
            {gastosFixosFiltrados.map(gasto => {
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
                      <button onClick={() => startEdit(gasto)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { setDeletingGasto(gasto); setShowDeleteModal(true) }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
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
        <Plus className="w-5 h-5" /> Adicionar Gasto Fixo
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{editingId ? 'Editar' : 'Novo'} Gasto Fixo</h3>
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

      {showDeleteModal && deletingGasto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Remover "{deletingGasto.nome}"</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              <button onClick={() => handleDelete('thisMonth')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary transition-colors text-left">
                <CalendarX className="w-5 h-5 text-warning" />
                <div><p className="text-sm font-medium text-foreground">Apenas este mês</p><p className="text-xs text-muted-foreground">Remove só no mês atual</p></div>
              </button>
              <button onClick={() => handleDelete('fromThisMonth')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary transition-colors text-left">
                <CalendarRange className="w-5 h-5 text-primary" />
                <div><p className="text-sm font-medium text-foreground">A partir deste mês</p><p className="text-xs text-muted-foreground">Remove deste mês em diante</p></div>
              </button>
              <button onClick={() => handleDelete('allMonths')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-destructive/30 hover:bg-destructive/10 transition-colors text-left">
                <Calendar className="w-5 h-5 text-destructive" />
                <div><p className="text-sm font-medium text-destructive">Todos os meses</p><p className="text-xs text-muted-foreground">Remove permanentemente</p></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
