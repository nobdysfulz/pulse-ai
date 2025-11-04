import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useMemo } from 'react';
import { calculateDealStructure, formatCurrency } from './calculations';

const formatPercent = (value) => `${Math.round(value)}%`;

export default function Step3DealStructure({ planData, setPlanData, financialSummary }) {
  const dealPreview = useMemo(
    () => calculateDealStructure(planData, financialSummary),
    [planData, financialSummary],
  );

  const handleChange = (field, value) => {
    setPlanData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSliderChange = (field, value) => {
    const sliderValue = Array.isArray(value) ? value[0] : value;
    setPlanData((prev) => ({ ...prev, [field]: sliderValue }));
  };

  return (
    <div className="space-y-10">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Deal Structure & Commission Split</h2>
        <p className="text-sm text-slate-500">
          Tell us about your average transaction so we can calculate how many deals you need to close this year.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Financial Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="avgSalePrice">Average Sale Price</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">$</span>
              <Input
                id="avgSalePrice"
                type="number"
                min="0"
                value={planData.avgSalePrice}
                onChange={(e) => handleChange('avgSalePrice', Number(e.target.value))}
                className="pl-7"
                placeholder="450000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Commission Rate</Label>
            <div className="relative">
              <Input
                id="commissionRate"
                type="number"
                min="0"
                value={planData.commissionRate}
                onChange={(e) => handleChange('commissionRate', Number(e.target.value))}
                placeholder="3"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">%</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium text-slate-700">Income Split</Label>
              <span className="text-sm font-semibold text-violet-700">{formatPercent(planData.incomeSplit)}</span>
            </div>
            <Slider value={[planData.incomeSplit]} min={0} max={100} step={1} onValueChange={(value) => handleSliderChange('incomeSplit', value)} />
            <p className="text-xs text-slate-500">
              Percentage of the commission you keep after brokerage splits.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium text-slate-700">Buyer vs. Listing Mix</Label>
              <span className="text-sm font-semibold text-violet-700">{formatPercent(planData.buyerSellerSplit)} Buyers</span>
            </div>
            <Slider
              value={[planData.buyerSellerSplit]}
              min={0}
              max={100}
              step={5}
              onValueChange={(value) => handleSliderChange('buyerSellerSplit', value)}
            />
            <p className="text-xs text-slate-500">
              We&apos;ll calculate transactions using this buyer / seller mix.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Advanced Splits</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brokerageSplitBuyers">Brokerage Split - Buyers</Label>
            <div className="relative">
              <Input
                id="brokerageSplitBuyers"
                type="number"
                min="0"
                value={planData.brokerageSplitBuyers}
                onChange={(e) => handleChange('brokerageSplitBuyers', Number(e.target.value))}
                placeholder="20"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brokerageSplitSellers">Brokerage Split - Sellers</Label>
            <div className="relative">
              <Input
                id="brokerageSplitSellers"
                type="number"
                min="0"
                value={planData.brokerageSplitSellers}
                onChange={(e) => handleChange('brokerageSplitSellers', Number(e.target.value))}
                placeholder="20"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamSplitBuyers">Team Split - Buyers</Label>
            <div className="relative">
              <Input
                id="teamSplitBuyers"
                type="number"
                min="0"
                value={planData.teamSplitBuyers}
                onChange={(e) => handleChange('teamSplitBuyers', Number(e.target.value))}
                placeholder="0"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamSplitSellers">Team Split - Sellers</Label>
            <div className="relative">
              <Input
                id="teamSplitSellers"
                type="number"
                min="0"
                value={planData.teamSplitSellers}
                onChange={(e) => handleChange('teamSplitSellers', Number(e.target.value))}
                placeholder="0"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brokerageCap">Brokerage Cap</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">$</span>
              <Input
                id="brokerageCap"
                type="number"
                min="0"
                value={planData.brokerageCap}
                onChange={(e) => handleChange('brokerageCap', Number(e.target.value))}
                className="pl-7"
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-violet-200 bg-violet-50">
        <CardContent className="grid gap-6 p-6 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-violet-600">Net Commission Per Deal</p>
            <p className="text-xl font-semibold text-violet-900">{formatCurrency(dealPreview.estimatedNetCommissionPerDeal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-violet-600">Total Deals Needed</p>
            <p className="text-xl font-semibold text-violet-900">{dealPreview.totalDealsNeeded}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-violet-600">Buyer Transactions</p>
            <p className="text-xl font-semibold text-violet-900">{dealPreview.buyerTransactions}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-violet-600">Listing Transactions</p>
            <p className="text-xl font-semibold text-violet-900">{dealPreview.listingTransactions}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
