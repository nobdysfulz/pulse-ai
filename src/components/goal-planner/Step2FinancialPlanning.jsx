import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

export default function Step2FinancialPlanning({ planData, setPlanData }) {
  const calculateGCI = () => {
    const grossIncome = planData.netIncomeGoal / (1 - planData.taxRate);
    const gci = grossIncome + planData.businessExpenses;
    return Math.round(gci);
  };

  React.useEffect(() => {
    const gci = calculateGCI();
    setPlanData(prev => ({ ...prev, gciRequired: gci }));
  }, [planData.netIncomeGoal, planData.businessExpenses, planData.taxRate]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-[#7C3AED]" />
        </div>
        <h3 className="text-xl font-semibold text-[#1E293B] mb-2">Financial Goals</h3>
        <p className="text-sm text-[#475569]">Set your income and expense targets</p>
      </div>

      <Card className="bg-white border border-[#E2E8F0]">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="netIncomeGoal">Desired Net Income (Take-Home)</Label>
            <Input
              id="netIncomeGoal"
              type="number"
              value={planData.netIncomeGoal}
              onChange={(e) => setPlanData({ ...planData, netIncomeGoal: parseFloat(e.target.value) || 0 })}
              placeholder="100000"
              className="mt-1"
            />
            <p className="text-xs text-[#64748B] mt-1">After taxes and business expenses</p>
          </div>

          <div>
            <Label htmlFor="businessExpenses">Annual Business Expenses</Label>
            <Input
              id="businessExpenses"
              type="number"
              value={planData.businessExpenses}
              onChange={(e) => setPlanData({ ...planData, businessExpenses: parseFloat(e.target.value) || 0 })}
              placeholder="25000"
              className="mt-1"
            />
            <p className="text-xs text-[#64748B] mt-1">Marketing, tools, fees, etc.</p>
          </div>

          <div>
            <Label htmlFor="taxRate">Estimated Tax Rate</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={planData.taxRate}
              onChange={(e) => setPlanData({ ...planData, taxRate: parseFloat(e.target.value) || 0 })}
              placeholder="0.30"
              className="mt-1"
            />
            <p className="text-xs text-[#64748B] mt-1">Enter as decimal (e.g., 0.30 for 30%)</p>
          </div>
        </CardContent>
      </Card>

      {/* Calculated GCI */}
      <Card className="bg-[#F8FAFC] border border-[#E2E8F0]">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-[#475569] mb-2">Required GCI</p>
            <p className="text-3xl font-bold text-[#7C3AED]">
              ${calculateGCI().toLocaleString()}
            </p>
            <p className="text-xs text-[#64748B] mt-2">
              This is your Gross Commission Income target
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}