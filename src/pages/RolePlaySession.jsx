import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RolePlaySession from '../components/roleplay/RolePlaySession';

export default function RolePlaySessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);

  useEffect(() => {
    // Get scenario from navigation state
    if (location.state?.scenario) {
      setScenario(location.state.scenario);
    } else {
      // If no scenario in state, redirect back to role play page
      navigate(createPageUrl('RolePlay'));
    }
  }, [location.state, navigate]);

  if (!scenario) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <RolePlaySession />;
}