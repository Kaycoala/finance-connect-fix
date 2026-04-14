import { useMemo } from 'react'
import { useData } from '@/lib/data-context'
import { Pie, Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, type TooltipItem } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function RelatoriosSection() {
  const { dadosGlobais, dadosMesAtual, getTotalGastosFixos, getTotalGastosMensais, getTotalCartoes, getTotalParcelas } = useData()

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const textColor = isDark ? '#f8fafc' : '#0f172a'
  const gridColor = isDark ? '#334155' : '#e2e8f0'

  const dadosPorCategoria = useMemo(() => {
    const categorias: Record<number, number> = {}
    dadosGlobais.gastosFixos.forEach(g => { categorias[g.categoriaId || 8] = (categorias[g.categoriaId || 8] || 0) + g.valor })
    dadosMesAtual.gastosMensais.forEach(g => { categorias[g.categoriaId || 8] = (categorias[g.categoriaId || 8] || 0) + g.valor })
    const labels: string[] = [], values: number[] = [], colors: string[] = []
    Object.entries(categorias).forEach(([catId, valor]) => {
      const cat = dadosGlobais.categorias.find(c => c.id === parseInt(catId))
      if (cat && valor > 0) { labels.push(cat.nome); values.push(valor); colors.push(cat.cor) }
    })
    return { labels, values, colors }
  }, [dadosGlobais, dadosMesAtual])

  const dadosPorTipo = useMemo(() => ({
    labels: ['Gastos Fixos', 'Gastos Mensais', 'Cartões', 'Parcelas'],
    values: [getTotalGastosFixos(), getTotalGastosMensais(), getTotalCartoes(), getTotalParcelas()],
    colors: ['#0066ff', '#059669', '#dc2626', '#7c3aed']
  }), [getTotalGastosFixos, getTotalGastosMensais, getTotalCartoes, getTotalParcelas])

  const dadosPorBanco = useMemo(() => {
    const labels: string[] = [], values: number[] = []
    dadosGlobais.bancos.forEach(banco => {
      const total = (dadosMesAtual.cartoes[banco] || []).reduce((acc, i) => acc + i.valor, 0)
      if (total > 0) { labels.push(banco); values.push(total) }
    })
    return { labels, values }
  }, [dadosGlobais.bancos, dadosMesAtual.cartoes])

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: textColor, padding: 16, usePointStyle: true, pointStyle: 'circle' as const } },
      tooltip: { callbacks: { label: (ctx: TooltipItem<'doughnut'>) => `${ctx.label}: ${formatCurrency(typeof ctx.raw === 'number' ? ctx.raw : 0)}` } }
    }
  }

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: TooltipItem<'bar'>) => `${ctx.label}: ${formatCurrency(typeof ctx.raw === 'number' ? ctx.raw : 0)}` } } },
    scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor, callback: (v: string | number) => formatCurrency(Number(v)) }, grid: { color: gridColor } } }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h2 className="text-lg font-semibold text-foreground">Relatórios</h2><p className="text-sm text-muted-foreground">Visualize seus gastos</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-4">Gastos por Categoria</h3>
          <div className="h-64">
            {dadosPorCategoria.values.length > 0 ? (
              <Doughnut data={{ labels: dadosPorCategoria.labels, datasets: [{ data: dadosPorCategoria.values, backgroundColor: dadosPorCategoria.colors, borderWidth: 0 }] }} options={chartOptions} />
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados para exibir</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-4">Gastos por Tipo</h3>
          <div className="h-64">
            {dadosPorTipo.values.some(v => v > 0) ? (
              <Pie data={{ labels: dadosPorTipo.labels, datasets: [{ data: dadosPorTipo.values, backgroundColor: dadosPorTipo.colors, borderWidth: 0 }] }} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, tooltip: { callbacks: { label: (ctx: TooltipItem<'pie'>) => `${ctx.label}: ${formatCurrency(typeof ctx.raw === 'number' ? ctx.raw : 0)}` } } } }} />
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados para exibir</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 md:col-span-2">
          <h3 className="font-semibold text-foreground mb-4">Gastos por Banco</h3>
          <div className="h-64">
            {dadosPorBanco.values.length > 0 ? (
              <Bar data={{ labels: dadosPorBanco.labels, datasets: [{ data: dadosPorBanco.values, backgroundColor: '#0066ff', borderRadius: 8 }] }} options={barOptions} />
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados para exibir</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Gastos Fixos</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(getTotalGastosFixos())}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Gastos Mensais</p>
          <p className="text-lg font-bold text-success">{formatCurrency(getTotalGastosMensais())}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cartões</p>
          <p className="text-lg font-bold text-destructive">{formatCurrency(getTotalCartoes())}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Parcelas</p>
          <p className="text-lg font-bold" style={{ color: '#7c3aed' }}>{formatCurrency(getTotalParcelas())}</p>
        </div>
      </div>
    </div>
  )
}
