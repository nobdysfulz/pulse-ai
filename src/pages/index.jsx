import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';

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

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-text-body">Loading...</div>
  </div>
);

export default function AppRoutes() {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/market" element={<Market />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/goal-planner" element={<GoalPlanner />} />
          <Route path="/content-studio" element={<ContentStudio />} />
          <Route path="/role-play" element={<RolePlay />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </React.Suspense>
  );
}