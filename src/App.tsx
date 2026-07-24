import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ScannerSettingsProvider } from './contexts/ScannerSettingsContext'
import { PrinterProvider } from './contexts/PrinterContext'
import { SyncService } from './services/syncService'

import ProtectedRoute from './components/ProtectedRoute'
import PersonaProtectedRoute from './components/PersonaProtectedRoute'
import Layout from './components/layout/Layout'

import LoginForm from './components/auth/LoginForm'
import SignupForm from './components/auth/SignupForm'

import Dashboard from './pages/Dashboard'
import PersonaManagement from './pages/PersonaManagement'
import POS from './pages/POS'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import SalesHistory from './pages/SalesHistory'
import CustomersAndDebts from './pages/CustomersAndDebts'
import Customers from './pages/Customers'
import DebtWizard from './pages/DebtWizard'
import Installments from './pages/Installments'
import Reports from './pages/Reports'
import XReading from './pages/XReading'
import ZReading from './pages/ZReading'
import EJournal from './pages/EJournal'
import BIRBooks from './pages/BIRBooks'
import SystemAuditTrail from './pages/SystemAuditTrail'
import Settings from './pages/Settings'
import UserManual from './pages/UserManual'
import Promotions from './pages/Promotions'

function App() {
  useEffect(() => {
    SyncService.init()
  }, [])

  return (
    <AuthProvider>
      <ScannerSettingsProvider>
        <PrinterProvider>
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

              <Route path="/management/promotions" element={
                <ProtectedRoute>
                  <PersonaProtectedRoute>
                    <Layout>
                      <Promotions />
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
                      <Customers />
                    </Layout>
                  </PersonaProtectedRoute>
                </ProtectedRoute>
              } />

              <Route path="/debt-management/wizard" element={
                <ProtectedRoute>
                  <PersonaProtectedRoute>
                    <Layout>
                      <DebtWizard />
                    </Layout>
                  </PersonaProtectedRoute>
                </ProtectedRoute>
              } />

              {/* Reusing Customers page for Debts temporarily as per your structure */}
              <Route path="/debt-management/debts" element={
                <ProtectedRoute>
                  <PersonaProtectedRoute>
                    <Layout>
                      <CustomersAndDebts />
                    </Layout>
                  </PersonaProtectedRoute>
                </ProtectedRoute>
              } />

              <Route path="/installments" element={
                <ProtectedRoute>
                  <PersonaProtectedRoute>
                    <Layout>
                      <Installments />
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

              <Route path="/reports-compliance/x-reading" element={
                <ProtectedRoute>
                  <PersonaProtectedRoute>
                    <Layout>
                      <XReading />
                    </Layout>
                  </PersonaProtectedRoute>
                </ProtectedRoute>
              } />

              <Route path="/reports-compliance/z-reading" element={
                <ProtectedRoute>
                  <PersonaProtectedRoute>
                    <Layout>
                      <ZReading />
                    </Layout>
                  </PersonaProtectedRoute>
                </ProtectedRoute>
              } />

              <Route path="/reports-compliance/e-journal" element={
                <ProtectedRoute>
                  <PersonaProtectedRoute>
                    <Layout>
                      <EJournal />
                    </Layout>
                  </PersonaProtectedRoute>
                </ProtectedRoute>
              } />

              <Route path="/reports-compliance/bir-books" element={
                <ProtectedRoute>
                  <PersonaProtectedRoute>
                    <Layout>
                      <BIRBooks />
                    </Layout>
                  </PersonaProtectedRoute>
                </ProtectedRoute>
              } />

              <Route path="/reports-compliance/system-audit-trail" element={
                <ProtectedRoute>
                  <PersonaProtectedRoute>
                    <Layout>
                      <SystemAuditTrail />
                    </Layout>
                  </PersonaProtectedRoute>
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <PersonaProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </PersonaProtectedRoute>
                </ProtectedRoute>
              } />

              <Route path="/user-manual" element={
                <ProtectedRoute>
                  <PersonaProtectedRoute>
                    <Layout>
                      <UserManual />
                    </Layout>
                  </PersonaProtectedRoute>
                </ProtectedRoute>
              } />

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </PrinterProvider>
      </ScannerSettingsProvider>
    </AuthProvider>
  )
}

export default App