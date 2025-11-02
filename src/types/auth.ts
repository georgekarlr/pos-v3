export interface User {
  id: string
  email: string
  created_at: string
  email_confirmed_at?: string
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_at?: number
  user: User 
}

export interface PersonaData {
  type: string
  email: string
  id?: number // Database ID from validation
  loginName?: string // Only for staff - login username
  personName?: string // Actual person's name (for both admin and staff)
  timestamp: number
}

export interface AuthContextType {
  // Account authentication
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any | null }>
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  
  // Persona authentication
  persona: PersonaData | null
  personaLoading: boolean
  validateAdminPersona: (password: string) => Promise<{ success: boolean; message: string }>
  validateStaffPersona: (loginName: string, password: string) => Promise<{ success: boolean; message: string }>
  setPersona: (persona: PersonaData) => void
  clearPersona: () => void
  switchPersona: () => void
}