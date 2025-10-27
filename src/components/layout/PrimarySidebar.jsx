import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, CheckSquare, Target, Users, LogOut, TrendingUp, Camera, Award, MessageSquare } from 'lucide-react';
import { UserContext } from '../context/UserContext';
import { base44 } from '@/api/base44Client';

export default function PrimarySidebar({ onNavigate }) {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const currentPath = location.pathname;

  const isAdmin = user?.role === 'admin';
  const isSubscriberOrAdmin = user?.subscriptionTier === 'Subscriber' || user?.subscriptionTier === 'Admin';

  const handleLogout = async () => {
    await base44.auth.logout();
    onNavigate?.(); 
  };

  // Calculate active states based on currentPath
  const isDashboardActive = currentPath === createPageUrl('Dashboard') || currentPath === '/';
  const isToDoActive = currentPath === createPageUrl('ToDo');
  const isGoalsActive = currentPath === createPageUrl('Goals');
  const isContentActive = currentPath === createPageUrl('ContentStudio');
  const isSkillsActive = currentPath === createPageUrl('RolePlay');
  const isAdvisorActive = currentPath === createPageUrl('PersonalAdvisor');
  const isMarketActive = currentPath === createPageUrl('Market');
  const isAgentsActive = currentPath === createPageUrl('Agents');

  // Determine where My AI Agents should link to
  const aiAgentsLink = isSubscriberOrAdmin ? createPageUrl('Agents') : createPageUrl('Plans');

  return (
    <aside className="bg-white w-40 flex flex-col h-full border-r border-[#E2E8F0] shadow-sm pt-4">
      <nav className="flex-1 py-4">
        {/* Dashboard */}
        <NavLink
          key="dashboard"
          to={createPageUrl('Dashboard')}
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
          to={createPageUrl('ToDo')}
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
          to={createPageUrl('Goals')}
          className={
            `text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-normal flex items-center transition-colors hover:bg-[#F8FAFC] 
            ${isGoalsActive ? 'font-semibold bg-[#F8FAFC]' : ''}`
          }
          onClick={() => onNavigate?.()}
        >
          <Target className="w-5 h-5 mr-3" />
          <span className="text-left">Goals</span>
        </NavLink>

        {/* Content */}
        <NavLink
          key="content"
          to={createPageUrl('ContentStudio')}
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
          to={createPageUrl('RolePlay')}
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
          to={createPageUrl('PersonalAdvisor')}
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
          to={createPageUrl('Market')}
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
            to={createPageUrl('Plans')}
            className="text-[#01070f] pt-2 pr-1 pb-2 pl-4 text-sm font-medium flex items-center transition-colors hover:bg-[#F8FAFC]"
            onClick={() => onNavigate?.()}
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/296c6f901_image.png" 
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