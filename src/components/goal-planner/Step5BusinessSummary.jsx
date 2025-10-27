import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, TrendingUp, DollarSign, Users, Target } from 'lucide-react';

export default function Step5BusinessSummary({ planData }) {
  const formatCurrency = (value) => `$${Math.round(value).toLocaleString()}`;
  const formatPercent = (value) => `${Math.round(value * 100)}%`;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
        </div>
        <h3 className="text-xl font-semibold text-[#1E293B] mb-2">Plan Summary</h3>
        <p className="text-sm text-[#475569]">Review your {planData.planYear} business plan</p>
      </div>

      {/* Financial Summary */}
      <Card className="bg-white border border-[#E2E8F0]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <h4 className="text-lg font-semibold text-[#1E293B]">Financial Goals</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#64748B]">Net Income Goal</p>
              <p className="text-lg font-bold text-[#1E293B]">{formatCurrency(planData.netIncomeGoal)}</p>
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Required GCI</p>
              <p className="text-lg font-bold text-[#7C3AED]">{formatCurrency(planData.gciRequired)}</p>
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Business Expenses</p>
              <p className="text-lg font-bold text-[#1E293B]">{formatCurrency(planData.businessExpenses)}</p>
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Tax Rate</p>
              <p className="text-lg font-bold text-[#1E293B]">{formatPercent(planData.taxRate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Summary */}
      <Card className="bg-white border border-[#E2E8F0]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <h4 className="text-lg font-semibold text-[#1E293B]">Production Targets</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#64748B]">Total Deals Needed</p>
              <p className="text-lg font-bold text-[#7C3AED]">{planData.totalDealsNeeded}</p>
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Avg Sale Price</p>
              <p className="text-lg font-bold text-[#1E293B]">{formatCurrency(planData.avgSalePrice)}</p>
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Buyer Deals</p>
              <p className="text-lg font-bold text-[#1E293B]">{planData.buyerDeals}</p>
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Listing Deals</p>
              <p className="text-lg font-bold text-[#1E293B]">{planData.listingDeals}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card className="bg-white border border-[#E2E8F0]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <h4 className="text-lg font-semibold text-[#1E293B]">Activity Metrics</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#64748B]">Database Size</p>
              <p className="text-lg font-bold text-[#1E293B]">{planData.contactsDatabase}</p>
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Monthly Contacts</p>
              <p className="text-lg font-bold text-[#1E293B]">{planData.monthlyContacts}</p>
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Conversion Rate</p>
              <p className="text-lg font-bold text-[#1E293B]">{formatPercent(planData.conversionRate)}</p>
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Brokerage Split</p>
              <p className="text-lg font-bold text-[#1E293B]">{formatPercent(planData.brokerageSplit)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      <Card className="bg-[#F8FAFC] border border-[#E2E8F0]">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-[#22C55E] mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-[#1E293B] mb-2">Ready to Save Your Plan</h4>
          <p className="text-sm text-[#475569]">
            Click "Save Plan" to finalize your {planData.planYear} business plan and start tracking your progress.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}