import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContextType, PersonaData, PersonaType, User, Session } from '../types/auth'
import { usePersonaStorage } from '../hooks/usePersonaStorage'
import { PersonaService } from '../services/personaService'
import { SettingsService } from '../services/settingsService'
import { OfflineSetupService, SetupProgressState } from '../services/offlineSetupService'

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

  // Workspace offline setup state
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupProgress, setSetupProgress] = useState<SetupProgressState | null>(null)
  const hasInitializedSetupRef = useRef<boolean>(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session as Session | null)
      setUser((session?.user ?? null) as User | null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session as Session | null)
      setUser((session?.user ?? null) as User | null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Watch session state to load business settings in the background without deadlocking the auth listener
  useEffect(() => {
    const fetchSettings = async () => {
      if (session && navigator.onLine) {
        try {
          await SettingsService.getBusinessSettings(true)
        } catch (err) {
          console.error('Failed to fetch business settings on session update:', err)
        }
      }
    }
    fetchSettings()
  }, [session])

  // Trigger offline data setup when user and persona are both authenticated
  useEffect(() => {
    if (user && persona && !hasInitializedSetupRef.current && !personaStorageLoading) {
      hasInitializedSetupRef.current = true
      setIsSettingUp(true)

      OfflineSetupService.runSetup((progressState) => {
        setSetupProgress(progressState)
        if (progressState.isComplete) {
          setIsSettingUp(false)
        }
      }).catch((err) => {
        console.error('Offline setup execution error:', err)
        setIsSettingUp(false)
      })
    }
  }, [user, persona, personaStorageLoading])

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

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://pos-pro.ceintelly.com/dashboard',
      },
    })
    return { error }
  }

  const signOut = async () => {
    // Clear persona data on logout
    hasInitializedSetupRef.current = false
    setIsSettingUp(false)
    setSetupProgress(null)
    clearPersona()
    await supabase.auth.signOut()
  }

  // Persona authentication methods
  const validateAdminPersona = async (password: string) => {
    setPersonaLoading(true)
    try {
      const result = await PersonaService.validateAdminPersona(password)

      console.log('Persona data:', result)
      if (result.success && user?.email) {
        const personaData: PersonaData = {
          type: result.data?.user_type as PersonaType,
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

      console.log('Persona data:', result)
      if (result.success && user?.email) {
        const personaData: PersonaData = {
          type: result.data?.user_type as PersonaType,
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
    hasInitializedSetupRef.current = false
    setIsSettingUp(false)
    setSetupProgress(null)
    clearPersona()
  }

  const value = {
    // Account authentication
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,

    // Persona authentication
    persona,
    personaLoading: personaLoading || personaStorageLoading,
    isSettingUp,
    setupProgress,
    validateAdminPersona,
    validateStaffPersona,
    setPersona,
    clearPersona,
    switchPersona,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}