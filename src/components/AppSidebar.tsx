import { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, Receipt, Calendar, CreditCard, BarChart3, Sun, Moon } from 'lucide-react'

interface AppSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  isSaving: boolean
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gastos', label: 'Gastos Fixos', icon: Receipt },
  { id: 'gastosMensais', label: 'Gastos Mensais', icon: Calendar },
  { id: 'cartoes', label: 'Cartões', icon: CreditCard },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
]

export function AppSidebar({ activeSection, onSectionChange, isSaving }: AppSidebarProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = saved === 'dark' || (!saved && prefersDark)
    setIsDark(shouldBeDark)
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = useCallback(() => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.setAttribute('data-theme', newIsDark ? 'dark' : 'light')
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDark: newIsDark } }))
  }, [isDark])

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isDark: boolean }>
      setIsDark(customEvent.detail.isDark)
    }
    window.addEventListener('themeChange', handleThemeChange)
    return () => window.removeEventListener('themeChange', handleThemeChange)
  }, [])

  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-screen w-60 bg-card border-r border-border flex-col z-50">
      <div className="p-5 border-b border-border text-center">
        <h1 className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
          Gestor
        </h1>
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">de Finanças</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button key={item.id} onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeSection === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}>
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-border space-y-2">
        {isSaving && <p className="text-xs text-muted-foreground text-center animate-pulse">Salvando...</p>}
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? 'Tema Claro' : 'Tema Escuro'}
        </button>
      </div>
    </aside>
  )
}
