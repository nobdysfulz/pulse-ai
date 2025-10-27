import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function Step5Summary({ planData, user }) {

  // Recalculate totals for display
  const calculateTotal = (expenses) => {
    return Object.values(expenses).reduce((total, item) => {
      const amount = parseFloat(item?.amount) || 0;
      if (item?.frequency === 'monthly') {
        return total + amount * 12;
      }
      return total + amount;
    }, 0);
  };

  const totalPersonal = calculateTotal(planData.personalExpenses);
  const totalBusiness = calculateTotal(planData.businessExpenses);
  const totalExpenses = totalPersonal + totalBusiness;
  const grossIncomeNeeded = planData.netIncomeGoal + totalExpenses;
  const taxReserve = grossIncomeNeeded / (1 - planData.taxRate / 100) - grossIncomeNeeded;
  const totalIncomeNeeded = grossIncomeNeeded + taxReserve;

  const avgCommissionPerDeal = planData.avgSalePrice * (planData.commissionRate / 100);
  const brokerageCutBuyers = avgCommissionPerDeal * (planData.brokerageSplitBuyers / 100);
  const teamCutBuyers = (avgCommissionPerDeal - brokerageCutBuyers) * (planData.teamSplitBuyers / 100);
  const netCommissionBuyer = avgCommissionPerDeal - brokerageCutBuyers - teamCutBuyers;
  const brokerageCutSellers = avgCommissionPerDeal * (planData.brokerageSplitSellers / 100);
  const teamCutSellers = (avgCommissionPerDeal - brokerageCutSellers) * (planData.teamSplitSellers / 100);
  const netCommissionSeller = avgCommissionPerDeal - brokerageCutSellers - teamCutSellers;
  const avgNetCommission = netCommissionBuyer * (planData.buyerSellerSplit / 100) + netCommissionSeller * (1 - planData.buyerSellerSplit / 100);

  const gciNeeded = totalIncomeNeeded;
  const dealsNeeded = avgNetCommission > 0 ? Math.ceil(gciNeeded / avgNetCommission) : 0;
  const buyerDeals = Math.round(dealsNeeded * (planData.buyerSellerSplit / 100));
  const listingDeals = dealsNeeded - buyerDeals;
  const totalSalesVolume = dealsNeeded * planData.avgSalePrice;


  const handleDownload = () => toast.info("PDF Download feature coming soon!");
  const handleEmail = () => toast.info("Email Plan feature coming soon!");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{user.firstName}'s {planData.planYear} Business Plan</h2>
                <div className="flex justify-center gap-4 mt-4">
                    <Button variant="outline" onClick={handleDownload} className="bg-white text-zinc-900 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-[#E2E8F0] hover:bg-[#F8FAFC] h-10"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                    <Button variant="outline" onClick={handleEmail} className="bg-white text-zinc-900 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-[#E2E8F0] hover:bg-[#F8FAFC] h-10"><Mail className="mr-2 h-4 w-4" /> Email Plan</Button>
                </div>
            </div>

            {/* Income Summary */}
            <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4 text-center">Income Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500">Net Income Goal</p>
                        <p className="font-bold text-xl">${planData.netIncomeGoal.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500">Total Expenses</p>
                        <p className="font-bold text-xl">${Math.round(totalExpenses).toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500">Tax Set Aside</p>
                        <p className="font-bold text-xl">${Math.round(taxReserve).toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-gray-950 text-sm font-semibold">Total Income Needed</p>
                        <p className="text-violet-700 text-xl font-bold">${Math.round(totalIncomeNeeded).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Production Goals */}
            <div className="border p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4 text-center">Production Goals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500">GCI Needed</p>
                        <p className="font-bold text-xl">${Math.round(gciNeeded).toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500">Total Sales Volume</p>
                        <p className="font-bold text-xl">${Math.round(totalSalesVolume).toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500">Buyer Deals</p>
                        <p className="font-bold text-xl">{buyerDeals}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500">Listing Deals</p>
                        <p className="font-bold text-xl">{listingDeals}</p>
                    </div>
                </div>
            </div>
        </div>);

}