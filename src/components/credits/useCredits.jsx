
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { UserContext } from '../context/UserContext';
import { UserCredit, CreditTransaction } from '@/api/entities';
import { toast } from 'sonner';

export default function useCredits() {
  const { user, loading } = useContext(UserContext);
  const [userCredits, setUserCredits] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  const isSubscriber = user?.subscriptionTier === 'Subscriber' || user?.subscriptionTier === 'Admin';

  const loadCredits = useCallback(() => {
    if (!user || !user.id) {
      setUserCredits(null);
      setCreditsLoading(false);
      return;
    }
    
    // For subscribers, give a large number of credits and don't fetch from DB.
    if (isSubscriber) {
        setUserCredits({ creditsRemaining: 9999999, creditsUsed: 0 }); // Use a large number instead of Infinity
        setCreditsLoading(false);
        return;
    }
    
    // Logic for Free users
    const fetchFreeCredits = async () => {
        setCreditsLoading(true);
        try {
          const creditsData = await UserCredit.filter({ userId: user.id });
          if (creditsData.length > 0) {
            setUserCredits(creditsData[0]);
          } else {
            const newCredits = await UserCredit.create({ userId: user.id, creditsRemaining: 100, creditsUsed: 0 });
            setUserCredits(newCredits);
          }
        } catch (error) {
          if (!error.message?.includes('429') && !error.message?.includes('Rate limit')) {
            console.error("Error loading user credits:", error.message);
          }
          setUserCredits(null);
        } finally {
          setCreditsLoading(false);
        }
    }
    fetchFreeCredits();

  }, [user, isSubscriber]);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const hasSufficientCredits = useCallback((amount) => {
    if (isSubscriber) return true;
    if (!userCredits) return false;
    return userCredits.creditsRemaining >= amount;
  }, [userCredits, isSubscriber]);

  const deductCredits = useCallback(async (amount, feature, description = '') => {
    if (!user) {
      toast.error("User session issue. Please refresh the page and try again.");
      return false;
    }

    if (isSubscriber) {
        // For subscribers, we still log the transaction for tracking purposes, but don't deduct credits.
        try {
             await CreditTransaction.create({
                userId: user.id,
                feature,
                credits: amount,
                description: `${description} (Subscriber - No Deduction)`,
                balanceAfter: 9999999, // Use a large number instead of Infinity
            });
        } catch (e) {
            console.error("Error creating subscriber credit transaction log:", e);
        }
        return true;
    }
    
    // Logic for Free users
    if (!userCredits || userCredits.creditsRemaining < amount) {
      toast.error("Insufficient credits for this action.");
      return false;
    }

    const currentUsed = parseInt(userCredits.creditsUsed, 10) || 0;
    const currentRemaining = parseInt(userCredits.creditsRemaining, 10) || 0;
    const deductionAmount = parseInt(amount, 10);

    if (isNaN(deductionAmount) || deductionAmount <= 0) {
        console.error("Invalid deduction amount:", amount);
        toast.error("An internal error occurred with credit calculation.");
        return false;
    }

    const newCreditsUsed = currentUsed + deductionAmount;
    const newCreditsRemaining = currentRemaining - deductionAmount;
    
    try {
      await UserCredit.update(userCredits.id, {
        userId: user.id,
        creditsUsed: newCreditsUsed,
        creditsRemaining: newCreditsRemaining,
      });

      await CreditTransaction.create({
        userId: user.id,
        feature,
        credits: deductionAmount,
        description,
        balanceAfter: newCreditsRemaining,
      });

      setUserCredits(prev => ({
        ...prev,
        creditsUsed: newCreditsUsed,
        creditsRemaining: newCreditsRemaining
      }));
      
      return true;
    } catch (error) {
      console.error("Error deducting credits:", error);
      toast.error(`Error deducting credits: ${error.message}`);
      return false;
    }
  }, [user, userCredits, isSubscriber]);

  const refreshCredits = useCallback(() => {
    loadCredits();
  }, [loadCredits]);

  return { 
    user, 
    userCredits, 
    loading: loading || creditsLoading, 
    hasSufficientCredits, 
    deductCredits, 
    refreshCredits 
  };
}
