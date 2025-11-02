import { useState, useEffect } from 'react'
import { PersonaData } from '../types/auth'
import { createEncryption } from '../utils/encryption'

export const usePersonaStorage = (email: string | null) => {
  const [persona, setPersonaState] = useState<PersonaData | null>(null)
  const [loading, setLoading] = useState(true)

  const getStorageKey = () => `persona_${email}`

  useEffect(() => {
    if (!email) {
      setPersonaState(null)
      setLoading(false)
      return
    }

    // Load persona from localStorage
    const loadPersona = () => {
      try {
        const encryption = createEncryption(email)
        const stored = localStorage.getItem(getStorageKey())
        
        if (stored) {
          const decrypted = encryption.decrypt(stored)
          if (decrypted && decrypted.email === email) {
            // Check if persona is still valid (not older than 24 hours)
            const isValid = Date.now() - decrypted.timestamp < 24 * 60 * 60 * 1000
            if (isValid) {
              setPersonaState(decrypted)
            } else {
              // Remove expired persona
              localStorage.removeItem(getStorageKey())
            }
          }
        }
      } catch (error) {
        console.error('Error loading persona:', error)
        localStorage.removeItem(getStorageKey())
      }
      setLoading(false)
    }

    loadPersona()
  }, [email])

  const savePersona = (personaData: PersonaData) => {
    if (!email) return

    try {
      const encryption = createEncryption(email)
      const encrypted = encryption.encrypt(personaData)
      localStorage.setItem(getStorageKey(), encrypted)
      setPersonaState(personaData)
    } catch (error) {
      console.error('Error saving persona:', error)
    }
  }

  const clearPersona = () => {
    if (!email) return

    try {
      localStorage.removeItem(getStorageKey())
      setPersonaState(null)
    } catch (error) {
      console.error('Error clearing persona:', error)
    }
  }

  return {
    persona,
    loading,
    savePersona,
    clearPersona
  }
}