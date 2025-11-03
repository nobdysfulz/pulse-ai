import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./Dashboard'));
const Agents = React.lazy(() => import('./Agents'));
const Goals = React.lazy(() => import('./Goals'));
const Market = React.lazy(() => import('./Market'));
const Contacts = React.lazy(() => import('./Contacts'));
const Settings = React.lazy(() => import('./Settings'));
const GoalPlanner = React.lazy(() => import('./GoalPlanner'));
const ContentStudio = React.lazy(() => import('./ContentStudio'));
const RolePlay = React.lazy(() => import('./RolePlay'));
const Onboarding = React.lazy(() => import('./Onboarding'));
const Login = React.lazy(() => import('./Login'));
const Signup = React.lazy(() => import('./Signup'));
const Plans = React.lazy(() => import('./Plans'));
const ToDo = React.lazy(() => import('./ToDo'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-text-body">Loading...</div>
  </div>
);

export default function AppRoutes() {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
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
              <Layout><Dashboard /></Layout>
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
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Layout><Onboarding /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <Layout><Plans /></Layout>
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
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </React.Suspense>
  );
}