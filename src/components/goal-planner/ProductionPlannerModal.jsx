import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { UserContext } from '../context/UserContext';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Step1AgentInfo from './Step1AgentInfo';
import Step2Financial, { PERSONAL_EXPENSE_CATEGORIES, BUSINESS_EXPENSE_CATEGORIES } from './Step2Financial';
import Step3DealStructure from './Step3DealStructure';
import Step4Activities from './Step4Activities';
import Step5Summary from './Step5Summary';
import {
  calculatePlanTargets,
  calculateFinancialSummary,
  getDefaultConversionRates,
  initializeExpenseCategories,
} from './calculations';
import { supabase } from '@/integrations/supabase/client';

const createInitialPlanData = () => {
  const currentYear = new Date().getFullYear();
  return {
    planYear: currentYear,
    netIncomeGoal: 70000,
    personalExpenses: initializeExpenseCategories(PERSONAL_EXPENSE_CATEGORIES),
    businessExpenses: initializeExpenseCategories(BUSINESS_EXPENSE_CATEGORIES),
    taxRate: 25,
    avgSalePrice: 450000,
    commissionRate: 3,
    incomeSplit: 60,
    buyerSellerSplit: 60,
    brokerageSplitBuyers: 20,
    brokerageSplitSellers: 20,
    brokerageCap: 0,
    teamSplitBuyers: 0,
    teamSplitSellers: 0,
    conversionRates: getDefaultConversionRates(),
  };
};

const normalizeExpenseCollection = (savedCollection, defaultCollection, mergeWithDefaults = false) => {
  const result = {};
  const categories = mergeWithDefaults 
    ? [...Object.keys(defaultCollection), ...Object.keys(savedCollection || {})]
    : Object.keys(savedCollection || {});
  
  const uniqueCategories = [...new Set(categories)];
  
  for (const key of uniqueCategories) {
    const savedItems = savedCollection?.[key] || [];
    const defaultItems = defaultCollection?.[key] || [];
    
    if (mergeWithDefaults) {
      // Create a map of saved items by name
      const savedMap = new Map(savedItems.map(item => [item.name, item]));
      
      // Start with default structure, overlay saved values
      result[key] = defaultItems.map(defaultItem => {
        const saved = savedMap.get(defaultItem.name);
        return saved || defaultItem;
      });
      
      // Add any saved items not in defaults (custom items)
      savedItems.forEach(savedItem => {
        if (!defaultItems.some(d => d.name === savedItem.name)) {
          result[key].push(savedItem);
        }
      });
    } else {
      result[key] = savedItems.length > 0 ? savedItems : defaultItems;
    }
  }
  
  return result;
};

const mergeSavedPlan = (savedPlan) => {
  if (!savedPlan) return createInitialPlanData();

  const defaults = createInitialPlanData();
  
  // For expenses, merge intelligently: keep user values but add any new default items
  const mergedPersonalExpenses = normalizeExpenseCollection(
    savedPlan.personalExpenses,
    defaults.personalExpenses,
    true // mergeWithDefaults flag
  );
  
  const mergedBusinessExpenses = normalizeExpenseCollection(
    savedPlan.businessExpenses,
    defaults.businessExpenses,
    true // mergeWithDefaults flag
  );

  return {
    ...defaults,
    ...savedPlan,
    personalExpenses: mergedPersonalExpenses,
    businessExpenses: mergedBusinessExpenses,
    conversionRates: {
      buyer: { ...defaults.conversionRates.buyer, ...(savedPlan.conversionRates?.buyer || {}) },
      listing: { ...defaults.conversionRates.listing, ...(savedPlan.conversionRates?.listing || {}) },
    },
  };
};

export default function ProductionPlannerModal({ isOpen, onClose, onPlanSaved }) {
  const { user, businessPlan, refreshUserData } = useContext(UserContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [activating, setActivating] = useState(false);
  const [planData, setPlanData] = useState(createInitialPlanData());

  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep(1);
    if (businessPlan?.detailedPlan) {
      try {
        const saved = JSON.parse(businessPlan.detailedPlan);
        setPlanData(mergeSavedPlan(saved));
      } catch (error) {
        console.error('Failed to parse saved production plan', error);
        setPlanData(createInitialPlanData());
      }
    } else {
      setPlanData(createInitialPlanData());
    }
  }, [businessPlan, isOpen]);

  const totalSteps = 5;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  const calculatedTargets = useMemo(() => calculatePlanTargets(planData), [planData]);
  const financialSummary = useMemo(() => calculateFinancialSummary(planData), [planData]);

  const validateStep = useCallback((step) => {
    if (step === 1) {
      if (!planData.netIncomeGoal || planData.netIncomeGoal <= 0) {
        toast.error('Please enter a positive net income goal.');
        return false;
      }
    }
    if (step === 3) {
      if (!planData.avgSalePrice || planData.avgSalePrice <= 0) {
        toast.error('Average sale price must be greater than zero.');
        return false;
      }
      if (!planData.commissionRate || planData.commissionRate <= 0) {
        toast.error('Commission rate must be greater than zero.');
        return false;
      }
      if (!planData.incomeSplit || planData.incomeSplit <= 0) {
        toast.error('Income split must be greater than zero.');
        return false;
      }
    }
    return true;
  }, [planData]);

  const handleNext = () => {
    if (currentStep >= totalSteps) return;
    if (!validateStep(currentStep)) return;
    setCurrentStep((step) => Math.min(totalSteps, step + 1));
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(1, step - 1));
  };

const closeModal = () => {
  setCurrentStep(1);
  onClose?.();
};

  const handleFinishAndActivate = async () => {
    if (!user) {
      toast.error('You need to be logged in to activate your plan.');
      return;
    }

    if (!validateStep(3)) {
      setCurrentStep(3);
      return;
    }

    setActivating(true);
    try {
      const payload = {
        planData,
        calculatedTargets,
        userId: user.id,
      };

      const { data, error } = await supabase.functions.invoke('activateProductionPlan', { body: payload });

      console.log('Edge function response:', { data, error });
      console.log('Goals created:', data?.goalsCreated, 'Goals updated:', data?.goalsUpdated);

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to activate production plan');
      }

      toast.success(`Production plan activated! Created ${data.goalsCreated} new goal(s), updated ${data.goalsUpdated} goal(s).`);
      await refreshUserData();
      await onPlanSaved?.();
      setCurrentStep(1);
      onClose?.();
    } catch (err) {
      console.error('Error activating production plan', err);
      toast.error(err.message || 'Failed to activate production plan. Please try again.');
    } finally {
      setActivating(false);
    }
  };

  if (!isOpen) return null;

  const stepComponents = [
    <Step1AgentInfo planData={planData} setPlanData={setPlanData} />,
    <Step2Financial planData={planData} setPlanData={setPlanData} />,
    <Step3DealStructure planData={planData} setPlanData={setPlanData} financialSummary={financialSummary} />,
    <Step4Activities
      planData={planData}
      setPlanData={setPlanData}
      activityTargets={calculatedTargets.activityTargets}
      dealStructure={calculatedTargets.dealStructure}
    />,
    <Step5Summary
      planData={planData}
      calculatedTargets={calculatedTargets}
      onEditStep={(step) => setCurrentStep(step)}
    />,
  ];

  const stepTitles = [
    'Step 1: Agent Information',
    'Step 2: Financial Planning',
    'Step 3: Deal Structure',
    'Step 4: Activity Planning',
    'Step 5: Business Plan Summary',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">12-Month Production Planner</h2>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-violet-600" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-500">{stepTitles[currentStep - 1]}</p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
            onClick={closeModal}
            aria-label="Close planner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {stepComponents[currentStep - 1]}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={closeModal} disabled={activating}>
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || activating}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={activating}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinishAndActivate} disabled={activating} className="bg-violet-600 text-white hover:bg-violet-700">
                {activating ? 'Activating…' : 'Finish & Activate Plan'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
