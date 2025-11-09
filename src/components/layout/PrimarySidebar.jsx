import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, CheckSquare, Target, Users, LogOut, TrendingUp, Camera, Award, MessageSquare, Brain } from 'lucide-react';
import { UserContext } from '../context/UserContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function PrimarySidebar({ onNavigate }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isAdmin = useIsAdmin();
  const isSubscriberOrAdmin = user?.subscriptionTier === 'Subscriber' || user?.subscriptionTier === 'Admin';

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to log out');
    } else {
      navigate('/login');
    }
    onNavigate?.();
  };

  // Calculate active states based on currentPath
  const isDashboardActive = currentPath === '/dashboard' || currentPath === '/';
  const isToDoActive = currentPath === '/to-do';
  const isGoalsActive = currentPath === '/goals';
  const isIntelligenceActive = currentPath === '/intelligence';
  const isContentActive = currentPath === '/content-studio';
  const isSkillsActive = currentPath === '/role-play';
  const isAdvisorActive = currentPath === '/personaladvisor';
  const isMarketActive = currentPath === '/market';
  const isAgentsActive = currentPath === '/agents';

  // Determine where My AI Agents should link to
  const aiAgentsLink = isSubscriberOrAdmin ? '/agents' : '/plans';

  return (
    <aside className="bg-white w-40 flex flex-col h-full border-r border-[#E2E8F0] shadow-sm pt-4">
      <nav className="flex-1 py-4">
        {/* Dashboard */}
        <NavLink
          key="dashboard"
          to="/dashboard"
          end={true}
          className={
            `text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-normal flex items-center transition-colors hover:bg-[#F8FAFC] 
            ${isDashboardActive ? 'font-semibold bg-[#F8FAFC]' : ''}`
          }
          onClick={() => onNavigate?.()}
        >
          <Home className="w-5 h-5 mr-3" />
          <span className="text-left">Dashboard</span>
        </NavLink>

        {/* To-Do */}
        <NavLink
          key="todo"
          to="/to-do"
          className={
            `text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-normal flex items-center transition-colors hover:bg-[#F8FAFC] 
            ${isToDoActive ? 'font-semibold bg-[#F8FAFC]' : ''}`
          }
          onClick={() => onNavigate?.()}
        >
          <CheckSquare className="w-5 h-5 mr-3" />
          <span className="text-left">To-Do</span>
        </NavLink>

        {/* Goals */}
        <NavLink
          key="goals"
          to="/goals"
          className={
            `text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-normal flex items-center transition-colors hover:bg-[#F8FAFC] 
            ${isGoalsActive ? 'font-semibold bg-[#F8FAFC]' : ''}`
          }
          onClick={() => onNavigate?.()}
        >
          <Target className="w-5 h-5 mr-3" />
          <span className="text-left">Goals</span>
        </NavLink>

        {/* Intelligence */}
        <NavLink
          key="intelligence"
          to="/intelligence"
          className={
            `text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-normal flex items-center transition-colors hover:bg-[#F8FAFC] 
            ${isIntelligenceActive ? 'font-semibold bg-[#F8FAFC]' : ''}`
          }
          onClick={() => onNavigate?.()}
        >
          <Brain className="w-5 h-5 mr-3" />
          <span className="text-left">Intelligence</span>
        </NavLink>

        {/* Content */}
        <NavLink
          key="content"
          to="/content-studio"
          className={
            `text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-normal flex items-center transition-colors hover:bg-[#F8FAFC] 
            ${isContentActive ? 'font-semibold bg-[#F8FAFC]' : ''}`
          }
          onClick={() => onNavigate?.()}
        >
          <Camera className="w-5 h-5 mr-3" />
          <span className="text-left">Content</span>
        </NavLink>

        {/* Skills */}
        <NavLink
          key="skills"
          to="/role-play"
          className={
            `text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-normal flex items-center transition-colors hover:bg-[#F8FAFC] 
            ${isSkillsActive ? 'font-semibold bg-[#F8FAFC]' : ''}`
          }
          onClick={() => onNavigate?.()}
        >
          <Award className="w-5 h-5 mr-3" />
          <span className="text-left">Skills</span>
        </NavLink>

        {/* My Advisor */}
        <NavLink
          key="advisor"
          to="/personaladvisor"
          className={
            `text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-normal flex items-center transition-colors hover:bg-[#F8FAFC] 
            ${isAdvisorActive ? 'font-semibold bg-[#F8FAFC]' : ''}`
          }
          onClick={() => onNavigate?.()}
        >
          <MessageSquare className="w-5 h-5 mr-3" />
          <span className="text-left">My Advisor</span>
        </NavLink>

        {/* My Market */}
        <NavLink
          key="market"
          to="/market"
          className={
            `text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-normal flex items-center transition-colors hover:bg-[#F8FAFC] 
            ${isMarketActive ? 'font-semibold bg-[#F8FAFC]' : ''}`
          }
          onClick={() => onNavigate?.()}
        >
          <TrendingUp className="w-5 h-5 mr-3" />
          <span className="text-left">My Market</span>
        </NavLink>

        {/* My AI Agents - Conditionally links to Plans or Agents based on subscription */}
        <NavLink
          key="agents"
          to={aiAgentsLink}
          className={
            `text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-normal flex items-center transition-colors hover:bg-[#F8FAFC] 
            ${isAgentsActive ? 'font-semibold bg-[#F8FAFC]' : ''}`
          }
          onClick={() => onNavigate?.()}
        >
          <Users className="w-5 h-5 mr-3" />
          <span className="text-left">My AI Agents</span>
        </NavLink>
      </nav>

      <div className="mt-auto">
        {/* The Upgrade link is visible only if the user is NOT an admin */}
        {!isAdmin && ( 
          <NavLink
            to="/plans"
            className="text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-medium flex items-center transition-colors hover:bg-[#F8FAFC]"
            onClick={() => onNavigate?.()}
          >
            <img 
              src="/images/logos/pulse-logo.png" 
              alt="Upgrade" 
              className="w-5 h-5 mr-3"
            />
            <span className="text-left">Upgrade</span>
          </NavLink>
        )}
        
        <div className="p-2 border-t border-[#E2E8F0]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium transition-colors text-[#475569] hover:bg-[#F8FAFC] rounded-md"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}