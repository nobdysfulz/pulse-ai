
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import WelcomeVideoModal from '../onboarding/WelcomeVideoModal';
import { UserOnboarding } from '@/api/entities';
import { toast } from 'sonner';

export default function DashboardHeader({ user, pulseScore }) {
  // The original welcome video logic is being replaced by the new header design,
  // so the state and effects related to it are no longer needed for this component.
  // The `UserContext` and `UserOnboarding` imports are kept as they might be used elsewhere
  // or could be part of a larger change not fully captured here, but for this specific
  // component's new functionality, they are not directly used.

  // The original component had state and effects for the welcome video:
  // const { onboarding, refreshUserData } = useContext(UserContext);
  // const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  // useEffect(() => { ... }, [onboarding]);
  // const handleDismissVideo = async () => { ... };
  // These are removed as per the new component structure.

  // The original `getGreeting` function is also removed as it's no longer used.
  // const getGreeting = () => { ... };

  return (
    <div className="bg-gradient-to-br from-[#7C3AED] to-[#E4018B] rounded-2xl p-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.firstName || 'there'}! 👋
          </h1>
          <p className="text-white/90">
            Here's your business overview for today
          </p>
        </div>
        
        {pulseScore !== null && (
          <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="text-5xl font-bold mb-2">{pulseScore}</div>
            <div className="text-sm text-white/90">PULSE Score</div>
          </div>
        )}
      </div>
    </div>
  );
}
