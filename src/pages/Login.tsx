import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Eye, EyeOff, Shield, Loader2, Download } from 'lucide-react'
import { FirebaseManager } from '@/lib/firebase'

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export default function LoginPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'login' | 'cadastro'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info', text: string } | null>(null)
  const [loginData, setLoginData] = useState({ username: '', senha: '' })
  const [cadastroData, setCadastroData] = useState({ username: '', senha: '', confirmarSenha: '' })
  const [installPrompt, setInstallPrompt] = useState<BIPEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    const ua = window.navigator.userAgent
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    setIsIOS(iOS)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    setIsInstalled(standalone)
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e as BIPEvent) }
    window.addEventListener('beforeinstallprompt', handler)
    const installed = () => setIsInstalled(true)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') setInstallPrompt(null)
    } else if (isIOS) {
      setShowIOSHelp(true)
    } else {
      showMessage('Use o menu do navegador para instalar o app', 'info')
    }
  }

  const showMessage = (text: string, type: 'error' | 'success' | 'info' = 'error') => setMessage({ text, type })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginData.username || !loginData.senha) { showMessage('Preencha todos os campos'); return }
    setIsLoading(true)
    try {
      await FirebaseManager.init()
      const result = await FirebaseManager.login(loginData.username, loginData.senha)
      if (result.success) {
        showMessage('Login realizado! Redirecionando...', 'success')
        setTimeout(() => navigate('/'), 500)
      } else {
        showMessage(result.message || 'Erro ao fazer login')
      }
    } catch (error) {
      showMessage('Erro ao conectar. Tente novamente.')
      console.error(error)
    } finally { setIsLoading(false) }
  }

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[a-zA-Z0-9_]+$/.test(cadastroData.username)) { showMessage('Nome de usuário deve conter apenas letras, números e underline'); return }
    if (cadastroData.username.length < 3) { showMessage('Nome de usuário deve ter no mínimo 3 caracteres'); return }
    if (cadastroData.senha !== cadastroData.confirmarSenha) { showMessage('As senhas não coincidem'); return }
    if (cadastroData.senha.length < 6) { showMessage('A senha deve ter no mínimo 6 caracteres'); return }
    setIsLoading(true)
    try {
      await FirebaseManager.init()
      const result = await FirebaseManager.registrar(cadastroData.username, cadastroData.senha)
      if (result.success) {
        showMessage(result.message || 'Conta criada com sucesso!', 'success')
        setCadastroData({ username: '', senha: '', confirmarSenha: '' })
        setActiveTab('login')
      } else { showMessage(result.message || 'Erro ao criar conta') }
    } catch (error) {
      showMessage('Erro ao conectar. Tente novamente.')
      console.error(error)
    } finally { setIsLoading(false) }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-in">
          <div className="text-center mb-6">
            <div className="mb-4">
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent leading-none">
                Gestor
              </h1>
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mt-2">de Finanças</p>
            </div>
            <p className="text-muted-foreground text-sm">Controle suas finanças de forma simples e segura</p>
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-success/10 border border-success/20 rounded-full text-success text-xs font-medium">
              <Shield className="w-4 h-4" />
              Criptografia AES-256 ponta a ponta
            </div>
          </div>

          <div className="flex border-b border-border mb-6">
            <button onClick={() => { setActiveTab('login'); setMessage(null) }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'login' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              Entrar
              {activeTab === 'login' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
            <button onClick={() => { setActiveTab('cadastro'); setMessage(null) }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'cadastro' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              Cadastrar
              {activeTab === 'cadastro' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
              message.type === 'success' ? 'bg-success/10 text-success border border-success/20' :
              'bg-primary/10 text-primary border border-primary/20'
            }`}>{message.text}</div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Usuário</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={loginData.username} onChange={e => setLoginData(p => ({ ...p, username: e.target.value }))}
                    placeholder="Digite seu usuário" className="w-full h-12 pl-10 pr-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type={showPassword ? 'text' : 'password'} value={loginData.senha} onChange={e => setLoginData(p => ({ ...p, senha: e.target.value }))}
                    placeholder="Digite sua senha" className="w-full h-12 pl-10 pr-12 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCadastro} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Usuário</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={cadastroData.username} onChange={e => setCadastroData(p => ({ ...p, username: e.target.value }))}
                    placeholder="Escolha um nome de usuário" className="w-full h-12 pl-10 pr-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type={showPassword ? 'text' : 'password'} value={cadastroData.senha} onChange={e => setCadastroData(p => ({ ...p, senha: e.target.value }))}
                    placeholder="Mínimo 6 caracteres" className="w-full h-12 pl-10 pr-12 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="password" value={cadastroData.confirmarSenha} onChange={e => setCadastroData(p => ({ ...p, confirmarSenha: e.target.value }))}
                    placeholder="Repita a senha" className="w-full h-12 pl-10 pr-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Conta'}
              </button>
            </form>
          )}
        </div>

        {!isInstalled && (
          <button onClick={handleInstall} className="mt-4 w-full h-12 bg-card border border-border hover:border-primary text-foreground font-medium rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Download className="w-4 h-4" />
            Instalar App
          </button>
        )}

        {showIOSHelp && (
          <div className="mt-4 p-4 bg-card border border-border rounded-xl text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Para instalar no iOS:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Toque no botão Compartilhar</li>
              <li>Selecione "Adicionar à Tela de Início"</li>
              <li>Toque em "Adicionar"</li>
            </ol>
            <button onClick={() => setShowIOSHelp(false)} className="mt-3 text-primary text-xs">Fechar</button>
          </div>
        )}
      </div>
    </main>
  )
}
