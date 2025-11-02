import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import PersonaSelection from './auth/PersonaSelection'
import LoadingSpinner from './LoadingSpinner'

interface PersonaProtectedRouteProps {
  children: React.ReactNode
}

const PersonaProtectedRoute: React.FC<PersonaProtectedRouteProps> = ({ children }) => {
  const { persona, personaLoading } = useAuth()

  if (personaLoading) {
    return <LoadingSpinner />
  }

  if (!persona) {
    return <PersonaSelection />
  }

  return <>{children}</>
}

export default PersonaProtectedRoute