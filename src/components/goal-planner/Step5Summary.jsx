import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from './calculations';

const SummaryStat = ({ label, value, highlight }) => (
  <div className={`rounded-lg p-4 text-center ${highlight ? 'bg-violet-50 text-violet-900' : 'bg-slate-50 text-slate-900'}`}>
    <p className={`text-xs uppercase tracking-wide ${highlight ? 'text-violet-600' : 'text-slate-500'}`}>{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);

const ActivityList = ({ title, funnel }) => (
  <Card className="border-slate-200">
    <CardHeader>
      <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-3">
      <SummaryStat label="Conversations" value={funnel.conversations} />
      <SummaryStat label="Appointments" value={funnel.appointments} />
      <SummaryStat label="Agreements" value={funnel.agreements} />
      <SummaryStat label="Contracts" value={funnel.contracts} />
      <SummaryStat label="Closings" value={funnel.closings} />
    </CardContent>
  </Card>
);

export default function Step5Summary({ planData, calculatedTargets, onEditStep }) {
  const { financialSummary, dealStructure, activityTargets, monthlyBreakdown } = calculatedTargets;

  return (
    <div className="space-y-10">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">Your {planData.planYear} Business Plan Summary</h2>
        <p className="text-sm text-slate-500">
          Review the financial goals and activity requirements for your production plan. You can jump back to any step to make adjustments.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => onEditStep?.(1)}>Edit Agent Info</Button>
          <Button variant="outline" onClick={() => onEditStep?.(2)}>Edit Expenses</Button>
          <Button variant="outline" onClick={() => onEditStep?.(3)}>Edit Deal Structure</Button>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat label="Net Income Goal" value={formatCurrency(planData.netIncomeGoal)} />
          <SummaryStat label="Total Expenses" value={formatCurrency(financialSummary.totalExpenses)} />
          <SummaryStat label="Taxes (Reserve)" value={formatCurrency(financialSummary.taxAmount)} />
          <SummaryStat label="Gross Commission Income Required" value={formatCurrency(financialSummary.gciRequired)} highlight />
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Production Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryStat label="Total Deals Needed" value={dealStructure.totalDealsNeeded} />
          <SummaryStat label="Buyer Transactions" value={dealStructure.buyerTransactions} />
          <SummaryStat label="Listing Transactions" value={dealStructure.listingTransactions} />
          <SummaryStat label="Total Sales Volume" value={formatCurrency(dealStructure.totalSalesVolume)} />
          <SummaryStat label="Average Deal Size" value={formatCurrency(planData.avgSalePrice)} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityList title="Buyer Activity Requirements" funnel={activityTargets.buyer} />
        <ActivityList title="Listing Activity Requirements" funnel={activityTargets.listing} />
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Annual Activity Requirements</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryStat label="Conversations" value={activityTargets.totals.conversations} />
          <SummaryStat label="Appointments" value={activityTargets.totals.appointments} />
          <SummaryStat label="Agreements" value={activityTargets.totals.agreements} />
          <SummaryStat label="Contracts" value={activityTargets.totals.contracts} />
          <SummaryStat label="Closings" value={activityTargets.totals.closings} />
        </CardContent>
      </Card>

      <Card className="border-violet-200 bg-violet-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-violet-900">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryStat label="Conversations / Month" value={`${monthlyBreakdown.conversations}`} />
          <SummaryStat label="Appointments / Month" value={`${monthlyBreakdown.appointments}`} />
          <SummaryStat label="Agreements / Month" value={`${monthlyBreakdown.agreements}`} />
          <SummaryStat label="Contracts / Month" value={`${monthlyBreakdown.contracts}`} />
          <SummaryStat label="Closings / Month" value={`${monthlyBreakdown.closings}`} />
        </CardContent>
      </Card>
    </div>
  );
}
