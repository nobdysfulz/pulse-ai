import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LifeBuoy, LogOut, ChevronDown, User, Settings, BookOpen, Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TopHeader() {
  const { user, onboarding, userAgentSubscription, loading, setSupportChatOpen } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await base44.auth.signOut();
      toast.success('Successfully logged out.');
      navigate(createPageUrl('Login'));
    } catch (error) {
      toast.error('Failed to log out.');
      console.error('Logout error:', error);
    }
  };

  // Determine which onboarding phase is needed
  const getOnboardingStatus = () => {
    if (!user || !onboarding || loading) return { needed: false };

    const isSubscriber = user.subscriptionTier === 'Subscriber' || user.subscriptionTier === 'Admin';
    const hasCallCenter = userAgentSubscription?.status === 'active';

    // Phase 1: Core onboarding not complete
    if (!onboarding.onboardingCompleted) {
      return {
        needed: true,
        phase: 'core',
        link: createPageUrl('Onboarding'),
        label: 'COMPLETE ONBOARDING'
      };
    }

    // Phase 2: User is subscriber but hasn't completed agent onboarding
    if (isSubscriber && !onboarding.agentOnboardingCompleted) {
      return {
        needed: true,
        phase: 'agents',
        link: createPageUrl('Onboarding') + '?phase=agents',
        label: 'SETUP AI AGENTS'
      };
    }

    // Phase 3: User has call center subscription but hasn't completed call center onboarding
    if (hasCallCenter && !onboarding.callCenterOnboardingCompleted) {
      return {
        needed: true,
        phase: 'callcenter',
        link: createPageUrl('Onboarding') + '?phase=callcenter',
        label: 'SETUP CALL CENTER'
      };
    }

    // All onboarding complete
    return { needed: false };
  };

  const onboardingStatus = getOnboardingStatus();

  return (
    <header className="bg-[#232323] text-white pt-10 pr-6 pb-10 pl-6 h-14 flex-shrink-0 flex items-center justify-between shadow-[2px_2px_20px_0px_#707070AD]">
      {/* Left side with logo and name */}
      <div className="flex items-center gap-3">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a795970202102129f19983/a45eda2ff_PWRUEmblem.png"
          alt="PULSE Emblem"
          className="h-7 w-auto"
        />
        <span className="text-xl font-bold tracking-tight">
          <span className="font-extrabold">PULSE</span>
          <span className="font-medium">Intelligence</span>
        </span>
      </div>

      {/* Right side with user info and actions */}
      <div className="flex items-center gap-6">
        {/* Dynamic Onboarding Button - Only show if needed */}
        {onboardingStatus.needed && (
          <Link
            to={onboardingStatus.link}
            className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-md text-sm font-semibold tracking-wider transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {onboardingStatus.label}
          </Link>
        )}

        <a
          href="https://pwru.app/login"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold tracking-wider hover:text-gray-200 transition-colors"
        >
          TRAINING CENTER
        </a>

        <button className="hover:text-gray-200 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        
        <button onClick={() => navigate(createPageUrl('Settings'))} className="hover:text-gray-200 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        
        <button onClick={() => setSupportChatOpen(true)} className="hover:text-gray-200 transition-colors">
          <LifeBuoy className="w-5 h-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {loading ? (
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse" />
              </Button>
            ) : user ? (
              <Button variant="ghost" className="h-full rounded-full flex items-center gap-2 text-white hover:bg-white/10 pr-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.firstName || user.full_name} />
                  <AvatarFallback className="bg-[#7C3AED] text-white text-sm">
                    {(user.firstName || user.full_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:inline">
                  {user.firstName || user.full_name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className="w-4 h-4 opacity-70" />
              </Button>
            ) : (
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <User className="w-5 h-5" />
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.firstName || user?.full_name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(createPageUrl('Settings'))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open('https://pwru.app/login', '_blank')}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Training Center</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSupportChatOpen(true)}>
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span>Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}