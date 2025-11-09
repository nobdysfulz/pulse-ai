import React, { useContext, useMemo } from 'react';
import { UserContext } from '@/components/context/UserContext';

/**
 * Hook to check if the current user has admin privileges
 * Uses the secure user_roles table instead of profile.role
 */
export function useIsAdmin() {
  const { user } = useContext(UserContext);

  const isAdmin = useMemo(() => {
    // Check isAdmin flag from backend (computed from user_roles table)
    if (user?.isAdmin) return true;
    
    // Fallback: check roles array
    if (user?.roles?.includes('admin')) return true;
    
    // Legacy fallback for backward compatibility during transition
    if (user?.role === 'admin') return true;
    
    // Also check subscription tier as admin indicator
    if (user?.subscriptionTier === 'Admin') return true;
    
    return false;
  }, [user]);

  return isAdmin;
}

/**
 * Hook to check if user is admin OR has admin-level subscription
 */
export function useIsAdminOrAdminTier() {
  const { user } = useContext(UserContext);

  const isAdminOrAdminTier = useMemo(() => {
    return user?.isAdmin || 
           user?.roles?.includes('admin') || 
           user?.role === 'admin' || 
           user?.subscriptionTier === 'Admin';
  }, [user]);

  return isAdminOrAdminTier;
}
