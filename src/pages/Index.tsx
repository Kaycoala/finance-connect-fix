import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FirebaseManager } from '@/lib/firebase'
import { DataProvider, useData } from '@/lib/data-context'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import { Dashboard } from '@/components/sections/DashboardSection'
import { GastosFixosSection } from '@/components/sections/GastosFixosSection'
import { GastosMensaisSection } from '@/components/sections/GastosMensaisSection'
import { CartoesSection } from '@/components/sections/CartoesSection'
import { RelatoriosSection } from '@/components/sections/RelatoriosSection'
import { Loader2 } from 'lucide-react'

function AppContent() {
  const { mesAtual, anoAtual, setMes, isSaving } = useData()
  const [activeSection, setActiveSection] = useState('dashboard')

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} isSaving={isSaving} />
      <div className="md:ml-60">
        <AppHeader mesAtual={mesAtual} anoAtual={anoAtual} onMesChange={setMes} activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="p-4 md:p-6 max-w-5xl mx-auto">
          {activeSection === 'dashboard' && <Dashboard />}
          {activeSection === 'gastos' && <GastosFixosSection />}
          {activeSection === 'gastosMensais' && <GastosMensaisSection />}
          {activeSection === 'cartoes' && <CartoesSection />}
          {activeSection === 'relatorios' && <RelatoriosSection />}
        </main>
      </div>
    </div>
  )
}

export default function Index() {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const user = await FirebaseManager.init()
      if (user) {
        setIsAuthenticated(true)
      } else {
        navigate('/login')
      }
      setIsChecking(false)
    }
    checkAuth()
  }, [navigate])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  )
}
