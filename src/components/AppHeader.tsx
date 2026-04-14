import { ChevronLeft, ChevronRight, LogOut, Menu, X } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { FirebaseManager } from '@/lib/firebase'
import { useNavigate } from 'react-router-dom'

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

interface AppHeaderProps {
  mesAtual: number
  anoAtual: number
  onMesChange: (mes: number, ano: number) => void
  activeSection: string
  onSectionChange: (section: string) => void
}

export function AppHeader({ mesAtual, anoAtual, onMesChange, activeSection, onSectionChange }: AppHeaderProps) {
  const navigate = useNavigate()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const usuario = FirebaseManager.getUsuario()

  const handlePrevMonth = useCallback(() => {
    if (mesAtual === 0) onMesChange(11, anoAtual - 1)
    else onMesChange(mesAtual - 1, anoAtual)
  }, [mesAtual, anoAtual, onMesChange])

  const handleNextMonth = useCallback(() => {
    if (mesAtual === 11) onMesChange(0, anoAtual + 1)
    else onMesChange(mesAtual + 1, anoAtual)
  }, [mesAtual, anoAtual, onMesChange])

  const handleLogout = async () => {
    await FirebaseManager.logout()
    navigate('/login')
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'gastos', label: 'Gastos Fixos' },
    { id: 'gastosMensais', label: 'Gastos Mensais' },
    { id: 'cartoes', label: 'Cartões' },
    { id: 'relatorios', label: 'Relatórios' },
  ]

  useEffect(() => {
    if (showMobileMenu) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [showMobileMenu])

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button className="md:hidden text-foreground" onClick={() => setShowMobileMenu(true)}>
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">
              {meses[mesAtual]} {anoAtual}
            </span>
            <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {usuario && <span className="text-xs text-muted-foreground hidden sm:block">{usuario.username}</span>}
            <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border animate-slide-up p-4">
            <div className="flex items-center justify-between mb-6">
              <img src="/images/logo-pro-interface.png" alt="Logo" className="h-8" />
              <button onClick={() => setShowMobileMenu(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <nav className="space-y-1">
              {navItems.map(item => (
                <button key={item.id} onClick={() => { onSectionChange(item.id); setShowMobileMenu(false) }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                  }`}>{item.label}</button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
