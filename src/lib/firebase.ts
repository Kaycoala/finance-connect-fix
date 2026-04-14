import { initializeApp, getApps } from 'firebase/app'
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  collection,
  where
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAUdxfRrw1D6hYi_iG8DYCFIj5jQEh2TVw",
  authDomain: "gestor-financa.firebaseapp.com",
  projectId: "gestor-financa",
  storageBucket: "gestor-financa.firebasestorage.app",
  messagingSenderId: "132905908850",
  appId: "1:132905908850:web:da487fdbfb6f69c116e0eb"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

let currentUser: { uid: string; username: string } | null = null
let userEncryptionKey: CryptoKey | null = null
const SESSION_KEY = 'gante_session'

function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder()
  const uint8Array = encoder.encode(str)
  return uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength)
}

function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = stringToArrayBuffer(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return arrayBufferToBase64(hashBuffer)
}

async function deriveEncryptionKey(password: string, salt: string): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: stringToArrayBuffer(salt), iterations: 100000, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encryptData(plaintext: string, key: CryptoKey): Promise<string | null> {
  if (!key) return null
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, stringToArrayBuffer(plaintext))
    const combined = new Uint8Array(iv.length + ciphertext.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(ciphertext), iv.length)
    const resultBuffer = combined.buffer.slice(combined.byteOffset, combined.byteOffset + combined.byteLength)
    return arrayBufferToBase64(resultBuffer)
  } catch (error) {
    console.error('Encryption error:', error)
    return null
  }
}

async function decryptData(encryptedBase64: string, key: CryptoKey): Promise<string | null> {
  if (!key) return null
  try {
    const combined = new Uint8Array(base64ToArrayBuffer(encryptedBase64))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return arrayBufferToString(plaintext)
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

function generateUid(username: string): string {
  return 'user_' + username.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export const FirebaseManager = {
  async init(): Promise<{ uid: string; username: string } | null> {
    const savedSession = localStorage.getItem(SESSION_KEY)
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession)
        if (sessionData.uid && sessionData.username && sessionData.keyData) {
          currentUser = { uid: sessionData.uid, username: sessionData.username }
          userEncryptionKey = await deriveEncryptionKey(sessionData.keyData, sessionData.uid)
          return currentUser
        }
      } catch {
        localStorage.removeItem(SESSION_KEY)
      }
    }
    return null
  },

  async registrar(username: string, senha: string): Promise<{ success: boolean; message: string }> {
    try {
      const uid = generateUid(username)
      
      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'credentials', uid))
      if (userDoc.exists()) {
        return { success: false, message: 'Este usuário já existe.' }
      }

      const passwordHash = await hashPassword(senha, uid)
      await setDoc(doc(db, 'credentials', uid), { 
        username, 
        passwordHash,
        createdAt: new Date().toISOString() 
      })
      
      return { success: true, message: 'Conta criada com sucesso!' }
    } catch (error: unknown) {
      console.error('Registration error:', error)
      return { success: false, message: 'Erro ao criar conta. Tente novamente.' }
    }
  },

  async login(username: string, senha: string): Promise<{ success: boolean; message?: string; user?: typeof currentUser }> {
    try {
      const uid = generateUid(username)
      const userDoc = await getDoc(doc(db, 'credentials', uid))
      
      if (!userDoc.exists()) {
        return { success: false, message: 'Usuário ou senha incorretos.' }
      }

      const userData = userDoc.data()
      const passwordHash = await hashPassword(senha, uid)
      
      if (userData.passwordHash !== passwordHash) {
        return { success: false, message: 'Usuário ou senha incorretos.' }
      }

      currentUser = { uid, username: userData.username || username }
      userEncryptionKey = await deriveEncryptionKey(senha, uid)
      localStorage.setItem(SESSION_KEY, JSON.stringify({ uid, username: currentUser.username, keyData: senha }))
      return { success: true, user: currentUser }
    } catch (error: unknown) {
      console.error('Login error:', error)
      return { success: false, message: 'Erro ao fazer login. Tente novamente.' }
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY)
    userEncryptionKey = null
    currentUser = null
  },

  async verificarAutenticacao(): Promise<typeof currentUser> {
    if (currentUser) return currentUser
    return this.init()
  },

  getUsuario() {
    return currentUser ? { uid: currentUser.uid, username: currentUser.username, criptografiaAtiva: !!userEncryptionKey } : null
  },

  temChave(): boolean {
    return !!userEncryptionKey
  },

  async salvarDados(dadosXML: string): Promise<boolean> {
    if (!currentUser || !userEncryptionKey) return false
    try {
      const dadosCriptografados = await encryptData(dadosXML, userEncryptionKey)
      if (!dadosCriptografados) return false
      await setDoc(doc(db, 'userData', currentUser.uid), { dados: dadosCriptografados, updatedAt: new Date().toISOString() })
      return true
    } catch (error) {
      console.error('Save error:', error)
      return false
    }
  },

  async carregarDados(): Promise<string | null> {
    if (!currentUser || !userEncryptionKey) return null
    try {
      const docRef = doc(db, 'userData', currentUser.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists() && docSnap.data().dados) {
        return await decryptData(docSnap.data().dados, userEncryptionKey)
      }
      return null
    } catch (error) {
      console.error('Load error:', error)
      return null
    }
  }
}
