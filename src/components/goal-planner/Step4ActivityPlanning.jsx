import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, TrendingUp } from 'lucide-react';

export default function Step4ActivityPlanning({ planData, setPlanData }) {
  const calculateDealsNeeded = () => {
    const avgCommission = planData.avgSalePrice * planData.commissionRate * planData.brokerageSplit;
    const totalDeals = Math.ceil(planData.gciRequired / avgCommission);
    const buyerDeals = Math.ceil(totalDeals * planData.buyerSellerSplit);
    const listingDeals = totalDeals - buyerDeals;

    return { totalDeals, buyerDeals, listingDeals };
  };

  React.useEffect(() => {
    const { totalDeals, buyerDeals, listingDeals } = calculateDealsNeeded();
    setPlanData(prev => ({
      ...prev,
      totalDealsNeeded: totalDeals,
      buyerDeals,
      listingDeals
    }));
  }, [planData.avgSalePrice, planData.commissionRate, planData.brokerageSplit, planData.buyerSellerSplit, planData.gciRequired]);

  const { totalDeals, buyerDeals, listingDeals } = calculateDealsNeeded();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-[#7C3AED]" />
        </div>
        <h3 className="text-xl font-semibold text-[#1E293B] mb-2">Deal Structure</h3>
        <p className="text-sm text-[#475569]">Configure your commission and deal breakdown</p>
      </div>

      <Card className="bg-white border border-[#E2E8F0]">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="avgSalePrice">Average Sale Price</Label>
            <Input
              id="avgSalePrice"
              type="number"
              value={planData.avgSalePrice}
              onChange={(e) => setPlanData({ ...planData, avgSalePrice: parseFloat(e.target.value) || 0 })}
              placeholder="400000"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="commissionRate">Commission Rate</Label>
            <Input
              id="commissionRate"
              type="number"
              step="0.001"
              value={planData.commissionRate}
              onChange={(e) => setPlanData({ ...planData, commissionRate: parseFloat(e.target.value) || 0 })}
              placeholder="0.03"
              className="mt-1"
            />
            <p className="text-xs text-[#64748B] mt-1">Enter as decimal (e.g., 0.03 for 3%)</p>
          </div>

          <div>
            <Label htmlFor="brokerageSplit">Your Brokerage Split</Label>
            <Input
              id="brokerageSplit"
              type="number"
              step="0.01"
              value={planData.brokerageSplit}
              onChange={(e) => setPlanData({ ...planData, brokerageSplit: parseFloat(e.target.value) || 0 })}
              placeholder="0.70"
              className="mt-1"
            />
            <p className="text-xs text-[#64748B] mt-1">Enter as decimal (e.g., 0.70 for 70/30 split)</p>
          </div>

          <div>
            <Label htmlFor="buyerSellerSplit">Buyer/Seller Split</Label>
            <Input
              id="buyerSellerSplit"
              type="number"
              step="0.01"
              value={planData.buyerSellerSplit}
              onChange={(e) => setPlanData({ ...planData, buyerSellerSplit: parseFloat(e.target.value) || 0 })}
              placeholder="0.50"
              className="mt-1"
            />
            <p className="text-xs text-[#64748B] mt-1">Enter as decimal (e.g., 0.50 for 50/50 split)</p>
          </div>
        </CardContent>
      </Card>

      {/* Calculated Deals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#F8FAFC] border border-[#E2E8F0]">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-[#475569] mb-2">Total Deals</p>
            <p className="text-3xl font-bold text-[#7C3AED]">{totalDeals}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#F8FAFC] border border-[#E2E8F0]">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-[#475569] mb-2">Buyer Deals</p>
            <p className="text-3xl font-bold text-[#7C3AED]">{buyerDeals}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#F8FAFC] border border-[#E2E8F0]">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-[#475569] mb-2">Listing Deals</p>
            <p className="text-3xl font-bold text-[#7C3AED]">{listingDeals}</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Planning */}
      <Card className="bg-white border border-[#E2E8F0]">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-[#1E293B]">Activity Metrics</h4>
              <p className="text-sm text-[#475569]">Set your conversion targets</p>
            </div>
          </div>

          <div>
            <Label htmlFor="contactsDatabase">Total Contacts in Database</Label>
            <Input
              id="contactsDatabase"
              type="number"
              value={planData.contactsDatabase}
              onChange={(e) => setPlanData({ ...planData, contactsDatabase: parseInt(e.target.value) || 0 })}
              placeholder="500"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="monthlyContacts">Monthly New Contacts Goal</Label>
            <Input
              id="monthlyContacts"
              type="number"
              value={planData.monthlyContacts}
              onChange={(e) => setPlanData({ ...planData, monthlyContacts: parseInt(e.target.value) || 0 })}
              placeholder="50"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="conversionRate">Conversion Rate</Label>
            <Input
              id="conversionRate"
              type="number"
              step="0.001"
              value={planData.conversionRate}
              onChange={(e) => setPlanData({ ...planData, conversionRate: parseFloat(e.target.value) || 0 })}
              placeholder="0.02"
              className="mt-1"
            />
            <p className="text-xs text-[#64748B] mt-1">Enter as decimal (e.g., 0.02 for 2%)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}