import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function Step3DealStructure({ planData, setPlanData }) {

  const avgCommissionPerDeal = planData.avgSalePrice * (planData.commissionRate / 100);
  const brokerageCutBuyers = avgCommissionPerDeal * (planData.brokerageSplitBuyers / 100);
  const teamCutBuyers = (avgCommissionPerDeal - brokerageCutBuyers) * (planData.teamSplitBuyers / 100);
  const netCommissionBuyer = avgCommissionPerDeal - brokerageCutBuyers - teamCutBuyers;

  const brokerageCutSellers = avgCommissionPerDeal * (planData.brokerageSplitSellers / 100);
  const teamCutSellers = (avgCommissionPerDeal - brokerageCutSellers) * (planData.teamSplitSellers / 100);
  const netCommissionSeller = avgCommissionPerDeal - brokerageCutSellers - teamCutSellers;

  const avgNetCommission = netCommissionBuyer * (planData.buyerSellerSplit / 100) + netCommissionSeller * (1 - planData.buyerSellerSplit / 100);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Deal Structure</h2>
                <p className="text-gray-500">Define your commission and splits to calculate your average net income per deal.</p>
            </div>
            
            {/* Commission Structure */}
            <div className="space-y-6">
                <h3 className="font-semibold text-lg">Commission Structure</h3>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="avgSalePrice">Average Sale Price</Label>
                        <Input id="avgSalePrice" type="number" value={planData.avgSalePrice} onChange={(e) => setPlanData({ ...planData, avgSalePrice: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                        <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                        <Input id="commissionRate" type="number" value={planData.commissionRate} onChange={(e) => setPlanData({ ...planData, commissionRate: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                        <Label>Buyer/Seller Business Split</Label>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>{planData.buyerSellerSplit}% Buyers</span>
                            <span>{100 - planData.buyerSellerSplit}% Sellers</span>
                        </div>
                        <Slider
              value={[planData.buyerSellerSplit]}
              onValueChange={(val) => setPlanData({ ...planData, buyerSellerSplit: val[0] })}
              max={100}
              step={1} />

                    </div>
                </div>
            </div>

            {/* Splits */}
             <div className="space-y-6">
                <h3 className="font-semibold text-lg">Splits</h3>
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="brokerageSplitBuyers">Brokerage Split % (Buyers)</Label>
                            <Input id="brokerageSplitBuyers" type="number" value={planData.brokerageSplitBuyers} onChange={(e) => setPlanData({ ...planData, brokerageSplitBuyers: parseFloat(e.target.value) || 0 })} />
                        </div>
                         <div>
                            <Label htmlFor="teamSplitBuyers">Team Split % (Buyers)</Label>
                            <Input id="teamSplitBuyers" type="number" value={planData.teamSplitBuyers} onChange={(e) => setPlanData({ ...planData, teamSplitBuyers: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <div className="space-y-4">
                         <div>
                            <Label htmlFor="brokerageSplitSellers">Brokerage Split % (Sellers)</Label>
                            <Input id="brokerageSplitSellers" type="number" value={planData.brokerageSplitSellers} onChange={(e) => setPlanData({ ...planData, brokerageSplitSellers: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <Label htmlFor="teamSplitSellers">Team Split % (Sellers)</Label>
                            <Input id="teamSplitSellers" type="number" value={planData.teamSplitSellers} onChange={(e) => setPlanData({ ...planData, teamSplitSellers: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Calculations */}
            <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg text-center">Calculations</h3>
                <div className="flex justify-between items-center">
                    <span className="font-medium">Average Commission per Deal:</span>
                    <span className="font-bold text-lg">${Math.round(avgCommissionPerDeal).toLocaleString()}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-medium">Average Net Commission per Deal:</span>
                    <span className="text-violet-800 text-lg font-bold">${Math.round(avgNetCommission).toLocaleString()}</span>
                </div>
            </div>
        </div>);

}