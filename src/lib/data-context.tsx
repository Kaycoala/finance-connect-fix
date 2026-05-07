import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { 
  DadosGlobais, DadosMes, GastoFixo, GastoMensal, ItemCartao, Parcela,
  defaultDadosGlobais, defaultDadosMes 
} from './types'
import { FirebaseManager } from './firebase'

interface DataContextType {
  dadosGlobais: DadosGlobais
  dadosMesAtual: DadosMes
  mesAtual: number
  anoAtual: number
  isLoading: boolean
  isSaving: boolean
  setMes: (mes: number, ano: number) => void
  setSalario: (valor: number) => void
  adicionarGastoFixo: (gasto: Omit<GastoFixo, 'id'>) => void
  editarGastoFixo: (id: number, gasto: Partial<GastoFixo>) => void
  removerGastoFixo: (id: number) => void
  removerGastoFixoMes: (id: number, mes: number, ano: number) => void
  removerGastoFixoAPartirDe: (id: number, mes: number, ano: number) => void
  adicionarGastoMensal: (gasto: Omit<GastoMensal, 'id'>) => void
  editarGastoMensal: (id: number, gasto: Partial<GastoMensal>) => void
  removerGastoMensal: (id: number) => void
  adicionarItemCartao: (banco: string, item: Omit<ItemCartao, 'id'>) => void
  editarItemCartao: (banco: string, id: number, item: Partial<ItemCartao>) => void
  removerItemCartao: (banco: string, id: number) => void
  adicionarParcela: (parcela: Omit<Parcela, 'id'>) => void
  editarParcela: (id: number, parcela: Partial<Parcela>) => void
  removerParcela: (id: number) => void
  adicionarBanco: (nome: string) => void
  removerBanco: (nome: string) => void
  setPoupancaTotal: (valor: number) => void
  setPoupancaMes: (valor: number) => void
  adicionarParaPoupanca: (valor: number) => void
  getGastosFixosFiltrados: () => GastoFixo[]
  getParcelasAtivas: () => (Parcela & { parcelaAtual: number })[]
  getTotalGastosFixos: () => number
  getTotalGastosMensais: () => number
  getTotalCartoes: () => number
  getTotalParcelas: () => number
  getTotalGastos: () => number
  getSobra: () => number
  salvarDados: () => Promise<boolean>
  carregarDados: () => Promise<boolean>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

function getChaveMes(mes: number, ano: number): string {
  return `${ano}_${mes}`
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [dadosGlobais, setDadosGlobais] = useState<DadosGlobais>(defaultDadosGlobais)
  const [dadosMeses, setDadosMeses] = useState<Record<string, DadosMes>>({})
  const [mesAtual, setMesAtual] = useState(new Date().getMonth())
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dadosAlterados, setDadosAlterados] = useState(false)

  const chaveMes = getChaveMes(mesAtual, anoAtual)
  const dadosMesAtual = dadosMeses[chaveMes] || { cartoes: {}, parcelas: [], salario: 0, gastosMensais: [] }

  const gerarXML = useCallback(() => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<financas>\n'
    xml += '  <dadosGlobais>\n'
    xml += '    <bancos>\n'
    dadosGlobais.bancos.forEach(banco => { xml += `      <banco>${escapeXml(banco)}</banco>\n` })
    xml += '    </bancos>\n'
    xml += `    <poupancaTotal>${dadosGlobais.poupancaTotal}</poupancaTotal>\n`
    xml += '    <poupancaPorMes>\n'
    for (const chave in dadosGlobais.poupancaPorMes) { xml += `      <mes chave="${chave}">${dadosGlobais.poupancaPorMes[chave]}</mes>\n` }
    xml += '    </poupancaPorMes>\n'
    xml += '    <categorias>\n'
    dadosGlobais.categorias.forEach(c => {
      xml += `      <categoria id="${c.id}"><nome>${escapeXml(c.nome)}</nome><emoji>${escapeXml(c.emoji)}</emoji><cor>${escapeXml(c.cor)}</cor></categoria>\n`
    })
    xml += '    </categorias>\n'
    xml += '    <gastosFixos>\n'
    dadosGlobais.gastosFixos.forEach(g => {
      xml += `      <gasto id="${g.id}"><nome>${escapeXml(g.nome)}</nome><valor>${g.valor}</valor><categoriaId>${g.categoriaId || ''}</categoriaId></gasto>\n`
    })
    xml += '    </gastosFixos>\n'
    xml += '    <gastosFixosExcluidos>\n'
    for (const chave in dadosGlobais.gastosFixosExcluidos) {
      const ids = dadosGlobais.gastosFixosExcluidos[chave]
      if (ids.length > 0) xml += `      <mes chave="${chave}">${ids.join(',')}</mes>\n`
    }
    xml += '    </gastosFixosExcluidos>\n'
    xml += '    <gastosFixosExcluidosAPartirDe>\n'
    for (const id in dadosGlobais.gastosFixosExcluidosAPartirDe) {
      xml += `      <item id="${id}">${dadosGlobais.gastosFixosExcluidosAPartirDe[Number(id)]}</item>\n`
    }
    xml += '    </gastosFixosExcluidosAPartirDe>\n'
    xml += '  </dadosGlobais>\n'
    xml += '  <meses>\n'
    for (const chave in dadosMeses) {
      const mesDados = dadosMeses[chave]
      xml += `    <mes chave="${chave}">\n`
      xml += `      <salario>${mesDados.salario || 0}</salario>\n`
      xml += '      <gastosMensais>\n'
      mesDados.gastosMensais.forEach(g => {
        xml += `        <gasto id="${g.id}"><nome>${escapeXml(g.nome)}</nome><valor>${g.valor}</valor><categoriaId>${g.categoriaId || ''}</categoriaId></gasto>\n`
      })
      xml += '      </gastosMensais>\n'
      xml += '      <cartoes>\n'
      for (const banco in mesDados.cartoes) {
        xml += `        <banco nome="${escapeXml(banco)}">\n`
        mesDados.cartoes[banco].forEach(item => {
          xml += `          <item id="${item.id}"><descricao>${escapeXml(item.descricao)}</descricao><valor>${item.valor}</valor></item>\n`
        })
        xml += '        </banco>\n'
      }
      xml += '      </cartoes>\n'
      xml += '      <parcelas>\n'
      mesDados.parcelas.forEach(p => {
        xml += `        <parcela id="${p.id}"><descricao>${escapeXml(p.descricao)}</descricao><valorTotal>${p.valorTotal}</valorTotal><numParcelas>${p.numParcelas}</numParcelas><mesInicio>${p.mesInicio}</mesInicio><anoInicio>${p.anoInicio}</anoInicio><banco>${escapeXml(p.banco)}</banco></parcela>\n`
      })
      xml += '      </parcelas>\n'
      xml += '    </mes>\n'
    }
    xml += '  </meses>\n</financas>'
    return xml
  }, [dadosGlobais, dadosMeses])

  const parseXML = useCallback((xmlString: string) => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
    if (xmlDoc.querySelector('parsererror')) return null

    const novosDadosGlobais: DadosGlobais = { ...defaultDadosGlobais }
    const novosDadosMeses: Record<string, DadosMes> = {}

    const dadosGlobaisEl = xmlDoc.querySelector('dadosGlobais')
    if (dadosGlobaisEl) {
      const bancosEl = dadosGlobaisEl.querySelectorAll('bancos > banco')
      if (bancosEl.length > 0) novosDadosGlobais.bancos = Array.from(bancosEl).map(b => b.textContent || '')

      const poupancaEl = dadosGlobaisEl.querySelector('poupancaTotal')
      if (poupancaEl) novosDadosGlobais.poupancaTotal = parseFloat(poupancaEl.textContent || '0') || 0

      dadosGlobaisEl.querySelectorAll('poupancaPorMes > mes').forEach(pEl => {
        const chave = pEl.getAttribute('chave')
        if (chave) novosDadosGlobais.poupancaPorMes[chave] = parseFloat(pEl.textContent || '0') || 0
      })

      const categoriasEls = dadosGlobaisEl.querySelectorAll('categorias > categoria')
      if (categoriasEls.length > 0) {
        novosDadosGlobais.categorias = []
        categoriasEls.forEach(c => {
          novosDadosGlobais.categorias.push({
            id: parseInt(c.getAttribute('id') || '0') || Date.now() + Math.random(),
            nome: c.querySelector('nome')?.textContent || '',
            emoji: c.querySelector('emoji')?.textContent || '',
            cor: c.querySelector('cor')?.textContent || '#64748b'
          })
        })
      }

      novosDadosGlobais.gastosFixos = []
      dadosGlobaisEl.querySelectorAll('gastosFixos > gasto').forEach(g => {
        const nome = g.querySelector('nome')?.textContent || ''
        const valor = parseFloat(g.querySelector('valor')?.textContent || '0') || 0
        if (nome && valor > 0) {
          novosDadosGlobais.gastosFixos.push({
            id: parseInt(g.getAttribute('id') || '0') || Date.now(),
            nome, valor,
            categoriaId: parseInt(g.querySelector('categoriaId')?.textContent || '0') || null
          })
        }
      })

      dadosGlobaisEl.querySelectorAll('gastosFixosExcluidos > mes').forEach(el => {
        const chave = el.getAttribute('chave')
        const idsStr = el.textContent || ''
        if (chave && idsStr) novosDadosGlobais.gastosFixosExcluidos[chave] = idsStr.split(',').map(Number).filter(n => !isNaN(n))
      })

      dadosGlobaisEl.querySelectorAll('gastosFixosExcluidosAPartirDe > item').forEach(el => {
        const id = parseInt(el.getAttribute('id') || '0')
        if (id && el.textContent) novosDadosGlobais.gastosFixosExcluidosAPartirDe[id] = el.textContent
      })
    }

    xmlDoc.querySelectorAll('meses > mes').forEach(mesEl => {
      const chave = mesEl.getAttribute('chave')
      if (!chave) return
      const mesDados: DadosMes = { ...defaultDadosMes, cartoes: {}, gastosMensais: [], parcelas: [] }
      mesDados.salario = parseFloat(mesEl.querySelector('salario')?.textContent || '0') || 0

      mesEl.querySelectorAll('gastosMensais > gasto').forEach(g => {
        mesDados.gastosMensais.push({
          id: parseInt(g.getAttribute('id') || '0') || Date.now(),
          nome: g.querySelector('nome')?.textContent || '',
          valor: parseFloat(g.querySelector('valor')?.textContent || '0') || 0,
          categoriaId: parseInt(g.querySelector('categoriaId')?.textContent || '0') || null
        })
      })

      mesEl.querySelectorAll('cartoes > banco').forEach(bancoEl => {
        const nomeBanco = bancoEl.getAttribute('nome') || ''
        if (!nomeBanco) return
        mesDados.cartoes[nomeBanco] = []
        bancoEl.querySelectorAll('item').forEach(item => {
          mesDados.cartoes[nomeBanco].push({
            id: parseInt(item.getAttribute('id') || '0') || Date.now(),
            descricao: item.querySelector('descricao')?.textContent || '',
            valor: parseFloat(item.querySelector('valor')?.textContent || '0') || 0
          })
        })
      })

      mesEl.querySelectorAll('parcelas > parcela').forEach(p => {
        mesDados.parcelas.push({
          id: parseInt(p.getAttribute('id') || '0') || Date.now(),
          descricao: p.querySelector('descricao')?.textContent || '',
          valorTotal: parseFloat(p.querySelector('valorTotal')?.textContent || '0') || 0,
          numParcelas: parseInt(p.querySelector('numParcelas')?.textContent || '0') || 0,
          mesInicio: parseInt(p.querySelector('mesInicio')?.textContent || '0') || 0,
          anoInicio: parseInt(p.querySelector('anoInicio')?.textContent || '0') || 0,
          banco: p.querySelector('banco')?.textContent || ''
        })
      })

      novosDadosMeses[chave] = mesDados
    })

    return { dadosGlobais: novosDadosGlobais, dadosMeses: novosDadosMeses }
  }, [])

  // Auto-save
  useEffect(() => {
    if (!dadosAlterados) return
    const timer = setTimeout(async () => {
      setIsSaving(true)
      await FirebaseManager.salvarDados(gerarXML())
      setIsSaving(false)
      setDadosAlterados(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [dadosAlterados, gerarXML])

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const xmlData = await FirebaseManager.carregarDados()
        if (xmlData) {
          const parsed = parseXML(xmlData)
          if (parsed) {
            setDadosGlobais(parsed.dadosGlobais)
            setDadosMeses(parsed.dadosMeses)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [parseXML])

  const marcarAlterado = () => setDadosAlterados(true)

  const atualizarMesAtual = (updater: Partial<DadosMes> | ((m: DadosMes) => Partial<DadosMes>)) => {
    setDadosMeses(prev => {
      const atual = prev[chaveMes] || { cartoes: {}, parcelas: [], salario: 0, gastosMensais: [] }
      const patch = typeof updater === 'function' ? updater(atual) : updater
      return { ...prev, [chaveMes]: { ...atual, ...patch } }
    })
    marcarAlterado()
  }

  const value: DataContextType = {
    dadosGlobais, dadosMesAtual, mesAtual, anoAtual, isLoading, isSaving,
    setMes: (mes, ano) => { setMesAtual(mes); setAnoAtual(ano) },
    setSalario: (valor) => atualizarMesAtual({ salario: valor }),
    adicionarGastoFixo: (gasto) => { setDadosGlobais(prev => ({ ...prev, gastosFixos: [...prev.gastosFixos, { ...gasto, id: Date.now() }] })); marcarAlterado() },
    editarGastoFixo: (id, gasto) => { setDadosGlobais(prev => ({ ...prev, gastosFixos: prev.gastosFixos.map(g => g.id === id ? { ...g, ...gasto } : g) })); marcarAlterado() },
    removerGastoFixo: (id) => { setDadosGlobais(prev => ({ ...prev, gastosFixos: prev.gastosFixos.filter(g => g.id !== id) })); marcarAlterado() },
    removerGastoFixoMes: (id, mes, ano) => {
      const chave = getChaveMes(mes, ano)
      setDadosGlobais(prev => {
        const excluidos = { ...prev.gastosFixosExcluidos }
        if (!excluidos[chave]) excluidos[chave] = []
        if (!excluidos[chave].includes(id)) excluidos[chave] = [...excluidos[chave], id]
        return { ...prev, gastosFixosExcluidos: excluidos }
      })
      marcarAlterado()
    },
    removerGastoFixoAPartirDe: (id, mes, ano) => {
      setDadosGlobais(prev => ({ ...prev, gastosFixosExcluidosAPartirDe: { ...prev.gastosFixosExcluidosAPartirDe, [id]: getChaveMes(mes, ano) } }))
      marcarAlterado()
    },
    adicionarGastoMensal: (gasto) => atualizarMesAtual(m => ({ gastosMensais: [...m.gastosMensais, { ...gasto, id: Date.now() }] })),
    editarGastoMensal: (id, gasto) => atualizarMesAtual(m => ({ gastosMensais: m.gastosMensais.map(g => g.id === id ? { ...g, ...gasto } : g) })),
    removerGastoMensal: (id) => atualizarMesAtual(m => ({ gastosMensais: m.gastosMensais.filter(g => g.id !== id) })),
    adicionarItemCartao: (banco, item) => atualizarMesAtual(m => {
      const cartoes = { ...m.cartoes }
      cartoes[banco] = [...(cartoes[banco] || []), { ...item, id: Date.now() }]
      return { cartoes }
    }),
    editarItemCartao: (banco, id, item) => atualizarMesAtual(m => {
      const cartoes = { ...m.cartoes }
      if (cartoes[banco]) cartoes[banco] = cartoes[banco].map(i => i.id === id ? { ...i, ...item } : i)
      return { cartoes }
    }),
    removerItemCartao: (banco, id) => atualizarMesAtual(m => {
      const cartoes = { ...m.cartoes }
      if (cartoes[banco]) cartoes[banco] = cartoes[banco].filter(i => i.id !== id)
      return { cartoes }
    }),
    adicionarParcela: (parcela) => atualizarMesAtual(m => ({ parcelas: [...m.parcelas, { ...parcela, id: Date.now() }] })),
    editarParcela: (id, parcela) => {
      setDadosMeses(prev => {
        const novo = { ...prev }
        for (const k in novo) {
          if (novo[k].parcelas.some(p => p.id === id)) {
            novo[k] = { ...novo[k], parcelas: novo[k].parcelas.map(p => p.id === id ? { ...p, ...parcela } : p) }
          }
        }
        return novo
      })
      marcarAlterado()
    },
    removerParcela: (id) => {
      setDadosMeses(prev => {
        const novo = { ...prev }
        for (const k in novo) {
          if (novo[k].parcelas.some(p => p.id === id)) {
            novo[k] = { ...novo[k], parcelas: novo[k].parcelas.filter(p => p.id !== id) }
          }
        }
        return novo
      })
      marcarAlterado()
    },
    adicionarBanco: (nome) => { if (!dadosGlobais.bancos.includes(nome)) { setDadosGlobais(prev => ({ ...prev, bancos: [...prev.bancos, nome] })); marcarAlterado() } },
    removerBanco: (nome) => { setDadosGlobais(prev => ({ ...prev, bancos: prev.bancos.filter(b => b !== nome) })); marcarAlterado() },
    setPoupancaTotal: (valor) => { setDadosGlobais(prev => ({ ...prev, poupancaTotal: valor })); marcarAlterado() },
    setPoupancaMes: (valor) => { setDadosGlobais(prev => ({ ...prev, poupancaPorMes: { ...prev.poupancaPorMes, [chaveMes]: valor } })); marcarAlterado() },
    adicionarParaPoupanca: (valor) => {
      setDadosGlobais(prev => ({
        ...prev,
        poupancaTotal: (prev.poupancaTotal || 0) + valor,
        poupancaPorMes: { ...prev.poupancaPorMes, [chaveMes]: (prev.poupancaPorMes[chaveMes] || 0) + valor }
      }))
      if (valor > 0) {
        atualizarMesAtual(m => ({ gastosMensais: [...m.gastosMensais, { id: Date.now(), nome: 'Depósito Poupança', valor, categoriaId: null }] }))
      } else {
        marcarAlterado()
      }
    },
    getGastosFixosFiltrados: () => {
      const excluidos = dadosGlobais.gastosFixosExcluidos[chaveMes] || []
      return dadosGlobais.gastosFixos.filter(g => {
        if (excluidos.includes(g.id)) return false
        const excAPartirDe = dadosGlobais.gastosFixosExcluidosAPartirDe[g.id]
        if (excAPartirDe) {
          const [anoExc, mesExc] = excAPartirDe.split('_').map(Number)
          if (anoAtual > anoExc || (anoAtual === anoExc && mesAtual >= mesExc)) return false
        }
        return true
      })
    },
    getTotalGastosFixos: () => value.getGastosFixosFiltrados().reduce((acc, g) => acc + g.valor, 0),
    getParcelasAtivas: () => {
      const todasParcelas: (Parcela & { parcelaAtual: number })[] = []
      const seen = new Set<number>()
      for (const chave in dadosMeses) {
        dadosMeses[chave].parcelas.forEach(parcela => {
          if (seen.has(parcela.id)) return
          const mesesPassados = (anoAtual - parcela.anoInicio) * 12 + (mesAtual - parcela.mesInicio)
          const parcelaAtual = mesesPassados + 1
          if (parcelaAtual >= 1 && parcelaAtual <= parcela.numParcelas) {
            seen.add(parcela.id)
            todasParcelas.push({ ...parcela, parcelaAtual })
          }
        })
      }
      return todasParcelas
    },
    getTotalGastosMensais: () => dadosMesAtual.gastosMensais.reduce((acc, g) => acc + g.valor, 0),
    getTotalCartoes: () => {
      let total = 0
      for (const banco in dadosMesAtual.cartoes) total += dadosMesAtual.cartoes[banco].reduce((acc, i) => acc + i.valor, 0)
      return total
    },
    getTotalParcelas: () => value.getParcelasAtivas().reduce((acc, p) => acc + (p.valorTotal / p.numParcelas), 0),
    getTotalGastos: () => value.getTotalGastosFixos() + value.getTotalGastosMensais() + value.getTotalCartoes() + value.getTotalParcelas(),
    getSobra: () => dadosMesAtual.salario - value.getTotalGastos(),
    salvarDados: async () => { setIsSaving(true); const result = await FirebaseManager.salvarDados(gerarXML()); setIsSaving(false); setDadosAlterados(false); return result },
    carregarDados: async () => {
      setIsLoading(true)
      const xmlData = await FirebaseManager.carregarDados()
      if (xmlData) {
        const parsed = parseXML(xmlData)
        if (parsed) { setDadosGlobais(parsed.dadosGlobais); setDadosMeses(parsed.dadosMeses); setIsLoading(false); return true }
      }
      setIsLoading(false)
      return false
    }
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within a DataProvider')
  return context
}
