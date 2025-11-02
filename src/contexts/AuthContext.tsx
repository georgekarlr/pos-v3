import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session as SupabaseSession, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContextType, PersonaData, User, Session } from '../types/auth'
import { usePersonaStorage } from '../hooks/usePersonaStorage'
import { PersonaService } from '../services/personaService'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Account authentication state
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Persona authentication state
  const [personaLoading, setPersonaLoading] = useState(false)
  const { persona, loading: personaStorageLoading, savePersona, clearPersona } = usePersonaStorage(user?.email || null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Account authentication methods
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    // Clear persona data on logout
    clearPersona()
    await supabase.auth.signOut()
  }

  // Persona authentication methods
  const validateAdminPersona = async (password: string) => {
    setPersonaLoading(true)
    try {
      const result = await PersonaService.validateAdminPersona(password)

      if (result.success && user?.email) {
        const personaData: PersonaData = {
          type: result.data?.user_type,
          email: user.email,
          id: result.data?.id,
          loginName: result.data?.name,
          personName: result.data?.person_name,
          timestamp: Date.now()
        }
        savePersona(personaData)
      }

      return result
    } finally {
      setPersonaLoading(false)
    }
  }

  const validateStaffPersona = async (loginName: string, password: string) => {
    setPersonaLoading(true)
    try {
      const result = await PersonaService.validateStaffPersona(loginName, password)

      if (result.success && user?.email) {
        const personaData: PersonaData = {
          type: result.data?.user_type,
          email: user.email,
          id: result.data?.id,
          loginName: result.data?.name || loginName,
          personName: result.data?.person_name,
          timestamp: Date.now()
        }
        savePersona(personaData)
      }

      return result
    } finally {
      setPersonaLoading(false)
    }
  }

  const setPersona = (personaData: PersonaData) => {
    savePersona(personaData)
  }

  const switchPersona = () => {
    clearPersona()
  }

  const value = {
    // Account authentication
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    
    // Persona authentication
    persona,
    personaLoading: personaLoading || personaStorageLoading,
    validateAdminPersona,
    validateStaffPersona,
    setPersona,
    clearPersona,
    switchPersona,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}