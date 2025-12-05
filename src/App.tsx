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
import SalesHistory from './pages/SalesHistory'
import {
  Users,
  Settings
} from 'lucide-react'
import Reports from './pages/Reports'
import ReceiptPrinter from './pages/ReceiptPrinter'

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
                  <SalesHistory />
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
                  <Reports />
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

          <Route path="/settings/receipt-printer" element={
            <ProtectedRoute>
              <PersonaProtectedRoute>
                <Layout>
                  <ReceiptPrinter />
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