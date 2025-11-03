import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PersonaProtectedRoute from './components/PersonaProtectedRoute'
import Layout from './components/layout/Layout'
import LoginForm from './components/auth/LoginForm'
import SignupForm from './components/auth/SignupForm'
import Dashboard from './pages/Dashboard'
import PlaceholderPage from './pages/PlaceholderPage'
import PersonaManagement from './pages/PersonaManagement'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import POS from './pages/POS'
import {
  ShoppingCart,
  History,
  Users,
  BarChart3,
  Settings
} from 'lucide-react'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <PersonaProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PersonaProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/persona-management" element={
            <ProtectedRoute>
              <PersonaProtectedRoute>
                <Layout>
                  <PersonaManagement />
                </Layout>
              </PersonaProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/pos" element={
            <ProtectedRoute>
              <PersonaProtectedRoute>
                <Layout>
                  <POS />
                </Layout>
              </PersonaProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/management/products" element={
            <ProtectedRoute>
              <PersonaProtectedRoute>
                <Layout>
                  <Products />
                </Layout>
              </PersonaProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/management/inventory" element={
            <ProtectedRoute>
              <PersonaProtectedRoute>
                <Layout>
                  <Inventory />
                </Layout>
              </PersonaProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/management/sales-history" element={
            <ProtectedRoute>
              <PersonaProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="Sales History"
                    description="View and analyze your past sales transactions."
                    icon={History}
                  />
                </Layout>
              </PersonaProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/management/customers" element={
            <ProtectedRoute>
              <PersonaProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="Customers"
                    description="Manage customer information and relationships."
                    icon={Users}
                  />
                </Layout>
              </PersonaProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/analytics-reports" element={
            <ProtectedRoute>
              <PersonaProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="Analytics Reports"
                    description="View detailed analytics reports and business insights."
                    icon={BarChart3}
                  />
                </Layout>
              </PersonaProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <PersonaProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="Settings"
                    description="Configure your application settings and preferences."
                    icon={Settings}
                  />
                </Layout>
              </PersonaProtectedRoute>
            </ProtectedRoute>
          } />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App