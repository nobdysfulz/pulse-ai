import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { BusinessPlan, Goal } from '@/api/entities';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Step1AgentInfo from './Step1AgentInfo';
import Step2Financial from './Step2Financial';
import Step3DealStructure from './Step3DealStructure';
import Step4Activities from './Step4Activities';
import Step5Summary from './Step5Summary';

const initialPlanData = {
  planYear: new Date().getFullYear(),
  netIncomeGoal: 70000,
  personalExpenses: {},
  businessExpenses: {},
  taxRate: 25,
  avgSalePrice: 450000,
  commissionRate: 3,
  buyerSellerSplit: 60,
  incomeSplit: 60,
  brokerageSplitBuyers: 20,
  brokerageSplitSellers: 20,
  teamSplitBuyers: 0,
  teamSplitSellers: 0,
  buyerActivities: { conversions: 16, appointments: 1, met: 1, signed: 2, underContract: 1, closings: 1 },
  listingActivities: { conversions: 10, appointments: 0, met: 0, signed: 1, underContract: 1, closings: 1 }
};

export default function ProductionPlannerModal({ isOpen, onClose, onPlanSaved }) {
  const { user, businessPlan, refreshUserData } = useContext(UserContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [planData, setPlanData] = useState(initialPlanData);

  useEffect(() => {
    if (businessPlan?.detailedPlan) {
      try {
        const savedPlan = JSON.parse(businessPlan.detailedPlan);
        setPlanData({ ...initialPlanData, ...savedPlan });
      } catch (e) {
        console.error("Failed to parse saved business plan, starting fresh.");
        setPlanData(initialPlanData);
      }
    } else {
      setPlanData(initialPlanData);
    }
  }, [businessPlan, isOpen]);

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateGoalsFromPlan = (data) => {
    // Calculate financial targets
    const grossIncome = data.netIncomeGoal / (1 - (data.taxRate / 100));
    const totalExpenses = Object.values(data.personalExpenses || {}).reduce((a, b) => a + b, 0) + 
                          Object.values(data.businessExpenses || {}).reduce((a, b) => a + b, 0);
    const gciRequired = grossIncome + totalExpenses;
    
    // Calculate deal breakdown
    const avgCommission = (data.avgSalePrice * (data.commissionRate / 100));
    const agentGrossPerDeal = avgCommission * (data.incomeSplit / 100);
    const totalDealsNeeded = Math.ceil(gciRequired / agentGrossPerDeal);
    
    // Calculate buyer/seller split
    const buyerSplitPercent = data.buyerSellerSplit / 100;
    const buyerDeals = Math.ceil(totalDealsNeeded * buyerSplitPercent);
    const listingDeals = Math.ceil(totalDealsNeeded * (1 - buyerSplitPercent));
    
    // Calculate activity goals based on conversion ratios
    const totalConversations = (buyerDeals * (data.buyerActivities?.conversions || 16)) + 
                               (listingDeals * (data.listingActivities?.conversions || 10));
    const totalAppointments = (buyerDeals * (data.buyerActivities?.appointments || 1)) + 
                              (listingDeals * (data.listingActivities?.appointments || 0));
    const totalAgreements = buyerDeals + listingDeals;
    
    return {
      gciRequired,
      totalDealsNeeded,
      buyerDeals,
      listingDeals,
      totalConversations,
      totalAppointments,
      totalAgreements,
      totalVolume: totalDealsNeeded * data.avgSalePrice
    };
  };

  const handleFinishAndActivate = async () => {
    setSaving(true);
    try {
      const calculatedTargets = calculateGoalsFromPlan(planData);
      
      // Save Business Plan
      const planPayload = {
        ...calculatedTargets,
        planYear: planData.planYear,
        netIncomeGoal: planData.netIncomeGoal,
        taxRate: planData.taxRate / 100,
        commissionRate: planData.commissionRate / 100,
        avgSalePrice: planData.avgSalePrice,
        userId: user.id,
        isActive: true,
        detailedPlan: JSON.stringify(planData)
      };

      const existing = await BusinessPlan.filter({ userId: user.id, planYear: planData.planYear });

      let savedPlan;
      if (existing.length > 0) {
        await BusinessPlan.update(existing[0].id, planPayload);
        savedPlan = { ...existing[0], ...planPayload };
      } else {
        savedPlan = await BusinessPlan.create(planPayload);
      }

      // Create/Update Goals
      const goalsToCreate = [
        {
          title: 'Total Conversations',
          category: 'lead-generation',
          type: 'annual',
          targetValue: calculatedTargets.totalConversations,
          targetUnit: 'conversations',
          deadline: `${planData.planYear}-12-31`,
          currentValue: 0,
          status: 'active'
        },
        {
          title: 'Total Appointments Set',
          category: 'lead-generation',
          type: 'annual',
          targetValue: calculatedTargets.totalAppointments,
          targetUnit: 'appointments',
          deadline: `${planData.planYear}-12-31`,
          currentValue: 0,
          status: 'active'
        },
        {
          title: 'Total Agreements Signed',
          category: 'production',
          type: 'annual',
          targetValue: calculatedTargets.totalAgreements,
          targetUnit: 'agreements',
          deadline: `${planData.planYear}-12-31`,
          currentValue: 0,
          status: 'active'
        },
        {
          title: 'Total Under Contract',
          category: 'production',
          type: 'annual',
          targetValue: calculatedTargets.totalDealsNeeded,
          targetUnit: 'contracts',
          deadline: `${planData.planYear}-12-31`,
          currentValue: 0,
          status: 'active'
        },
        {
          title: 'Total Buyers Closed',
          category: 'production',
          type: 'annual',
          targetValue: calculatedTargets.buyerDeals,
          targetUnit: 'closings',
          deadline: `${planData.planYear}-12-31`,
          currentValue: 0,
          status: 'active'
        },
        {
          title: 'Total Listings Closed',
          category: 'production',
          type: 'annual',
          targetValue: calculatedTargets.listingDeals,
          targetUnit: 'closings',
          deadline: `${planData.planYear}-12-31`,
          currentValue: 0,
          status: 'active'
        },
        {
          title: 'Total Sales Volume',
          category: 'production',
          type: 'annual',
          targetValue: calculatedTargets.totalVolume,
          targetUnit: 'USD',
          deadline: `${planData.planYear}-12-31`,
          currentValue: 0,
          status: 'active'
        },
        {
          title: 'Total GCI',
          category: 'production',
          type: 'annual',
          targetValue: calculatedTargets.gciRequired,
          targetUnit: 'USD',
          deadline: `${planData.planYear}-12-31`,
          currentValue: 0,
          status: 'active'
        }
      ];

      // Create goals using service role to ensure they're created
      const serviceClient = base44.asServiceRole;
      
      for (const goalData of goalsToCreate) {
        // Check if goal already exists
        const existingGoals = await serviceClient.entities.Goal.filter({
          userId: user.id,
          title: goalData.title,
          type: 'annual'
        });

        if (existingGoals.length > 0) {
          // Update existing goal
          await serviceClient.entities.Goal.update(existingGoals[0].id, {
            ...goalData,
            userId: user.id
          });
        } else {
          // Create new goal
          await serviceClient.entities.Goal.create({
            ...goalData,
            userId: user.id
          });
        }
      }

      toast.success('Production plan and goals activated successfully!');
      await refreshUserData();
      onPlanSaved?.();
      onClose();
    } catch (error) {
      console.error('Error saving plan and goals:', error);
      toast.error('Failed to activate production plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const calculatedTargets = calculateGoalsFromPlan(planData);
      
      const payload = {
        ...calculatedTargets,
        planYear: planData.planYear,
        netIncomeGoal: planData.netIncomeGoal,
        taxRate: planData.taxRate / 100,
        commissionRate: planData.commissionRate / 100,
        avgSalePrice: planData.avgSalePrice,
        userId: user.id,
        isActive: true,
        detailedPlan: JSON.stringify(planData)
      };

      const existing = await BusinessPlan.filter({ userId: user.id, planYear: planData.planYear });

      if (existing.length > 0) {
        await BusinessPlan.update(existing[0].id, payload);
      } else {
        await BusinessPlan.create(payload);
      }

      toast.success('Production plan saved successfully!');
      await refreshUserData();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save production plan');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const stepComponents = [
    <Step1AgentInfo planData={planData} setPlanData={setPlanData} />,
    <Step2Financial planData={planData} setPlanData={setPlanData} />,
    <Step3DealStructure planData={planData} setPlanData={setPlanData} />,
    <Step4Activities planData={planData} />,
    <Step5Summary planData={planData} user={user} />
  ];

  const stepTitles = [
    "Step 1: Agent Information",
    "Step 2: Financial Planning",
    "Step 3: Deal Structure",
    "Step 4: Activity Planning",
    "Step 5: Business Plan Summary"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col border border-[#E2E8F0]">
        {/* Header */}
        <div className="bg-zinc-50 px-6 py-4 flex-shrink-0 flex items-center justify-between border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-xl font-bold text-[#1E293B]">12-Month Production Planner</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-violet-700 rounded-full h-2.5" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-1">{stepTitles[currentStep - 1]}</p>
          </div>
          <button onClick={onClose} className="text-[#475569] hover:text-[#1E293B]">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Content */}
        <div className="pt-4 pr-6 pb-6 pl-6 flex-1 overflow-y-auto">
          {stepComponents[currentStep - 1]}
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 pt-4 pr-6 pb-4 pl-6 flex items-center justify-between border-t border-[#E2E8F0] flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              handleSave();
              onClose();
            }}
            disabled={saving}
            className="bg-white text-gray-800 px-4 py-2 text-sm font-medium rounded-md"
          >
            {saving ? 'Saving...' : 'Save & Exit'}
          </Button>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="bg-white text-zinc-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} className="bg-violet-700 text-white hover:bg-[#c026d3]">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinishAndActivate} disabled={saving} className="bg-violet-700 text-white hover:bg-[#c026d3]">
                {saving ? 'Activating...' : 'Finish & Activate Plan'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}