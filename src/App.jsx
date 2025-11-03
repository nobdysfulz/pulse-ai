import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React from 'react'

// Import pages directly
const Login = React.lazy(() => import('./pages/Login'))
const Signup = React.lazy(() => import('./pages/Signup'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const ToDo = React.lazy(() => import('./pages/ToDo'))
const Agents = React.lazy(() => import('./pages/Agents'))
const Goals = React.lazy(() => import('./pages/Goals'))
const Market = React.lazy(() => import('./pages/Market'))
const Contacts = React.lazy(() => import('./pages/Contacts'))
const Settings = React.lazy(() => import('./pages/Settings'))
const GoalPlanner = React.lazy(() => import('./pages/GoalPlanner'))
const ContentStudio = React.lazy(() => import('./pages/ContentStudio'))
const RolePlay = React.lazy(() => import('./pages/RolePlay'))
const PersonalAdvisor = React.lazy(() => import('./pages/PersonalAdvisor'))
const Onboarding = React.lazy(() => import('./pages/Onboarding'))

import ProtectedRoute from './components/ProtectedRoute'
import Layout from './pages/Layout'
import ErrorBoundary from './components/ui/ErrorBoundary'

function App() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-text-body">Loading...</div>
        </div>
      }>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/to-do"
            element={
              <ProtectedRoute>
                <Layout><ToDo /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents"
            element={
              <ProtectedRoute>
                <Layout><Agents /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <Layout><Goals /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/market"
            element={
              <ProtectedRoute>
                <Layout><Market /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <Layout><Contacts /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/goal-planner"
            element={
              <ProtectedRoute>
                <Layout><GoalPlanner /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/content-studio"
            element={
              <ProtectedRoute>
                <Layout><ContentStudio /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/role-play"
            element={
              <ProtectedRoute>
                <Layout><RolePlay /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/personaladvisor"
            element={
              <ProtectedRoute>
                <Layout><PersonalAdvisor /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Layout><Onboarding /></Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </React.Suspense>
      <Toaster />
    </BrowserRouter>
  )
}

export default App