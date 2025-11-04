
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import {
  Home, Target, Sparkles, Award, User as UserIcon, TrendingUp, MessagesSquare, CheckSquare, BarChart3, X,
  ArrowLeftToLine, ArrowRightToLine } from
'lucide-react';
import { cn } from '@/lib/utils';
import ReferralCard from './ReferralCard';

// --- SUB-COMPONENTS ---
const NavLink = ({ item, isExpanded, onMobileMenuClose, location }) => {
  const itemHref = createPageUrl(item.path);
  const isActive = location.pathname === itemHref;

  return (
    <Link
      to={itemHref}
      onClick={onMobileMenuClose}
      className={cn(
        "text-gray-100 pr-2 pl-2 text-sm font-medium flex items-center gap-4 rounded-md transition-colors h-10 group hover:text-white",
        isExpanded ? "justify-start" : "justify-center",
        isActive ? 'text-white' : ''
      )}>

      <item.icon className={cn(
        "w-5 h-5 flex-shrink-0 transition-colors",
        isActive ? 'text-white' : 'text-gray-100 group-hover:text-white'
      )} />
      {isExpanded &&
      <span className="flex-grow truncate transition-opacity duration-200 opacity-100 flex items-center">
          {item.label}
          {item.badge !== undefined && item.badge > 0 &&
        <span className="ml-auto w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
        }
        </span>
      }
    </Link>);

};

const SettingsMenu = ({ user, credits, onSignOut, onClose }) => {
  // isSubscriber check was for the old credit display logic, which is now replaced by the more detailed one below.
  // const isSubscriber = user?.subscriptionTier === 'Subscriber' || user?.subscriptionTier === 'Admin';

  return (
    <div className="absolute bottom-20 left-4 w-60 bg-white rounded-lg shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ color: '#565d6d' }}>
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img src={user?.avatar || user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=450063&color=fff`} alt="User Avatar" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="font-medium text-slate-800">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {/* The previous credit display for non-subscribers is removed here, as the new one below covers 'Free' and 'Subscriber' */}
            {/*
              {!isSubscriber && credits && (
               <p className="text-sm font-semibold" style={{ color: '#7500a8' }}>
                 Credits: {credits.creditsRemaining || 0}
               </p>
              )}
              */}
          </div>
        </div>
      </div>
      <div className="p-2 space-y-1">
        <Link to={createPageUrl('Settings')} onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-100 text-sm font-medium">
          <UserIcon className="w-4 h-4" /> Settings
        </Link>
        <a href="https://pwru.app/login" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-100 text-sm font-medium">
          <Sparkles className="w-4 h-4" /> Training Center
        </a>
        <Link to={createPageUrl('Settings?tab=referrals')} onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-100 text-sm font-medium">
          <Target className="w-4 h-4" /> Share & Earn
        </Link>
        <Link to={createPageUrl('Plans')} onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-100 text-sm font-medium">
          <TrendingUp className="w-4 h-4" /> Upgrades
        </Link>
        <a href="https://account.pwru.app/pages/9e804f0e-00c0-431a-9fe4-f7e74f29e11c" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-100 text-sm font-medium">
          <Target className="w-4 h-4" /> Billing & Subscription
        </a>
        <a href="https://help.powerunitcoaching.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-100 text-sm font-medium">
          <MessagesSquare className="w-4 h-4" /> Knowledge Base
        </a>
      </div>

      {/* Credit Display - Show for Free and Subscriber tiers */}
      {(user?.subscriptionTier === 'Free' || user?.subscriptionTier === 'Subscriber') &&
      <div className="px-4 py-3 border-t border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600">Credits</span>
            <span className="text-xs font-semibold text-slate-900">
              {credits?.creditsRemaining || 0} / {(credits?.creditsRemaining || 0) + (credits?.creditsUsed || 0) || 100}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
            className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${(credits?.creditsRemaining || 0) / ((credits?.creditsRemaining || 0) + (credits?.creditsUsed || 0) || 1) * 100}%`
            }} />

          </div>
        </div>
      }

      <div className="p-2 border-t border-slate-200 mt-1">
        <button onClick={onSignOut} className="text-red-700 px-3 py-2.5 text-sm font-medium w-full flex items-center gap-3 rounded-md hover:bg-slate-100">
          <X className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>);

};


export default function NewSidebar({ user, credits, tasksDueTodayCount, onMobileMenuClose, isMobile = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const sidebarRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (!isMobile) {
      const savedState = sessionStorage.getItem('sidebarExpanded');
      if (savedState !== null) {
        setIsExpanded(JSON.parse(savedState));
      }
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      sessionStorage.setItem('sidebarExpanded', JSON.stringify(isExpanded));
    }
  }, [isExpanded, isMobile]);

  const isOpen = isMobile || isExpanded;

  const handleSignOut = async () => {
    await User.logout();
    window.location.href = '/login';
  };

  const handleNavClick = () => {
    if (isMobile) {
      onMobileMenuClose?.();
    }
  };

  const isAdminOrAdminTier = useMemo(() => user?.role === 'admin' || user?.subscriptionTier === 'Admin', [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mainMenuItems = useMemo(() => {
    const items = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: 'Dashboard' },
    { id: 'todo', label: 'To-Do', icon: CheckSquare, path: 'ToDo', badge: tasksDueTodayCount > 0 ? tasksDueTodayCount : undefined },
    { id: 'goals', label: 'Goals', icon: Target, path: 'Goals' },
    { id: 'content', label: 'Content', icon: Sparkles, path: 'ContentStudio' }];


    // Only show Practice on desktop
    if (!isMobile) {
      items.push({ id: 'practice', label: 'Practice', icon: Award, path: 'RolePlay' });
    }

    items.push(
      { id: 'advisor', label: 'My Advisor', icon: UserIcon, path: 'PersonalAdvisor' },
      { id: 'market', label: 'My Market', icon: TrendingUp, path: 'Market' },
      { id: 'ai', label: 'My AI', icon: MessagesSquare, path: 'Agents' }
    );

    return items;
  }, [isMobile, tasksDueTodayCount]);

  const adminMenuItems = useMemo(() => {
    if (!isAdminOrAdminTier) return [];
    return [
    { id: 'metrics', label: 'Metrics', icon: BarChart3, path: 'PlatformMetrics' }];

  }, [isAdminOrAdminTier]);

  // Find the index of Practice item to add divider after it
  const practiceIndex = mainMenuItems.findIndex((item) => item.id === 'practice');

  return (
    <div
      ref={sidebarRef}
      className={cn(
        'relative h-full flex flex-col transition-all duration-300 ease-in-out z-20',
        'bg-gradient-to-b from-[#2c0047] via-[#1a0029] to-[#12001c]',
        isOpen ? 'w-48' : 'w-20'
      )}>


      {/* Logo and Toggle Section */}
      <div className="bg-[#350250] pt-6 pb-6 px-3 h-[80px] flex items-center justify-between flex-shrink-0">
        <img
          src={isOpen ? "/images/logos/logo-white.png" : "/images/logos/emblem.png"}
          alt="PWRU Logo"
          className="transition-all duration-300 h-10" />

        {isOpen && isMobile &&
        <button onClick={onMobileMenuClose} className="text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        }
      </div>

      {/* Main Navigation */}
      <nav className="bg-[#350250] pr-3 pl-3 flex-1 space-y-1 overflow-y-auto">
        {mainMenuItems.map((item, index) =>
        <React.Fragment key={item.id}>
            <NavLink item={item} isExpanded={isOpen} onMobileMenuClose={handleNavClick} location={location} />
            {/* Add divider after Practice item (if it exists) */}
            {practiceIndex !== -1 && index === practiceIndex &&
          <div className="px-4 py-2">
                <div className="border-t border-white/10"></div>
              </div>
          }
          </React.Fragment>
        )}
        {adminMenuItems.length > 0 &&
        <>
            <div className="px-4 py-2">
              <div className="border-t border-white/10"></div>
            </div>
            {adminMenuItems.map((item) =>
          <NavLink key={item.id} item={item} isExpanded={isOpen} onMobileMenuClose={handleNavClick} location={location} />
          )}
          </>
        }
      </nav>

      {/* Bottom Section */}
      <div className="bg-[#350250]">
        {/* Referral Card - Only show when expanded */}
        {isOpen && <ReferralCard />}

        {/* User Profile Link */}
        <a href="#" onClick={(e) => {e.preventDefault();setIsSettingsOpen(true);}} className="flex items-center gap-3 p-3 hover:bg-black/10 transition-colors rounded-md mx-2 mb-2">
          <img src={user?.avatar || user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=450063&color=fff`} alt="User Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          {isOpen &&
          <div className="flex-grow truncate">
              <p className="font-semibold text-sm text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400">View Profile</p>
            </div>
          }
        </a>
      </div>

      {/* Sidebar Toggle */}
      {!isMobile &&
      <div className="border-t border-white/10 px-3 py-3 bg-[#350250]">
          {isExpanded ?
        <button
          onClick={(e) => {e.stopPropagation();setIsExpanded(false);}}
          className="w-full flex items-center gap-4 h-10 px-2 rounded-md text-gray-100 hover:bg-white/10 hover:text-white">

                <ArrowLeftToLine className="w-5 h-5" />
                <span className="font-medium text-sm">Collapse</span>
            </button> :

        <button
          onClick={(e) => {e.stopPropagation();setIsExpanded(true);}}
          className="w-full flex items-center justify-center h-10 rounded-md text-gray-100 hover:bg-white/10 hover:text-white">

                <ArrowRightToLine className="w-5 h-5" />
            </button>
        }
        </div>
      }

      {isSettingsOpen &&
      <SettingsMenu
        user={user}
        credits={credits}
        onSignOut={handleSignOut}
        onClose={() => setIsSettingsOpen(false)} />

      }
    </div>);

}