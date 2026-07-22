import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import PersonaSelection from './auth/PersonaSelection'
import LoadingSpinner from './LoadingSpinner'
import SettingUpScreen from './auth/SettingUpScreen'

interface PersonaProtectedRouteProps {
  children: React.ReactNode
}

const PersonaProtectedRoute: React.FC<PersonaProtectedRouteProps> = ({ children }) => {
  const { persona, personaLoading, isSettingUp, setupProgress } = useAuth()

  if (personaLoading) {
    return <LoadingSpinner />
  }

  if (!persona) {
    return <PersonaSelection />
  }

  if (isSettingUp) {
    return <SettingUpScreen progressState={setupProgress} />
  }

  return <>{children}</>
}

export default PersonaProtectedRoute