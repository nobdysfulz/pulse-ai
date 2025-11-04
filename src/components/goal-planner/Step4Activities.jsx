import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from './calculations';

const conversionFields = [
  { key: 'conversationToAppointment', label: 'Conversation → Appointment' },
  { key: 'appointmentToAgreement', label: 'Appointment → Agreement' },
  { key: 'agreementToContract', label: 'Agreement → Contract' },
  { key: 'contractToClose', label: 'Contract → Close' },
];

const formatRate = (value) => Math.round((Number(value) || 0) * 100);

const clampRate = (value) => {
  if (!Number.isFinite(value)) return 1;
  return Math.min(99, Math.max(1, value));
};

const FunnelColumn = ({ title, funnel }) => {
  const stages = [
    { label: 'Conversations', value: funnel.conversations },
    { label: 'Appointments', value: funnel.appointments },
    { label: 'Agreements', value: funnel.agreements },
    { label: 'Contracts', value: funnel.contracts },
    { label: 'Closings', value: funnel.closings },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{stage.label}</p>
            <p className="text-xl font-semibold text-slate-900">{stage.value}</p>
            {index < stages.length - 1 && (
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-violet-500" style={{ width: `${Math.max(6, 100 - index * 15)}%` }} />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default function Step4Activities({ planData, setPlanData, activityTargets, dealStructure }) {
  const handleRateChange = (side, key, value) => {
    const numeric = clampRate(Number(value));
    setPlanData((prev) => ({
      ...prev,
      conversionRates: {
        ...(prev.conversionRates || {}),
        [side]: {
          ...(prev.conversionRates?.[side] || {}),
          [key]: numeric / 100,
        },
      },
    }));
  };

  return (
    <div className="space-y-10">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Activity Planning & Conversion Rates</h2>
        <p className="text-sm text-slate-500">
          Adjust your conversion funnel so we can translate production goals into the exact activities you need each month.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Buyer Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversionFields.map((field) => (
              <div key={`buyer-${field.key}`} className="space-y-1">
                <Label>{field.label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={formatRate(planData.conversionRates?.buyer?.[field.key])}
                    onChange={(e) => handleRateChange('buyer', field.key, e.target.value)}
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Listing Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversionFields.map((field) => (
              <div key={`listing-${field.key}`} className="space-y-1">
                <Label>{field.label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={formatRate(planData.conversionRates?.listing?.[field.key])}
                    onChange={(e) => handleRateChange('listing', field.key, e.target.value)}
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FunnelColumn title="Buyer Activity Requirements" funnel={activityTargets.buyer} />
        <FunnelColumn title="Listing Activity Requirements" funnel={activityTargets.listing} />
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-violet-600">Total Conversations</p>
              <p className="text-xl font-semibold text-violet-900">{activityTargets.totals.conversations}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-violet-600">Total Appointments</p>
              <p className="text-xl font-semibold text-violet-900">{activityTargets.totals.appointments}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-violet-600">Total Agreements</p>
              <p className="text-xl font-semibold text-violet-900">{activityTargets.totals.agreements}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-violet-600">Monthly Conversations</p>
              <p className="text-xl font-semibold text-violet-900">{activityTargets.monthly.conversations} / month</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-violet-600">Projected Sales Volume</p>
              <p className="text-lg font-semibold text-violet-900">{formatCurrency(dealStructure.totalSalesVolume)}</p>
              <p className="text-xs text-violet-600">Based on your activity plan and deal structure.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
