import React from 'react';
import { Phone, CheckCircle2, XCircle, Clock } from 'lucide-react';

const MetricItem = ({ icon, label, value, color }) => {
  const Icon = icon;
  return (
    <div className="bg-[#ffffff] pt-2 pr-4 pb-2 pl-4 rounded-lg flex items-center border border-[#E2E8F0]">
      <div>
        <p className="text-slate-950 text-sm">{label}</p>
        <p className="text-[#1E293B] text-xl font-medium">{value}</p>
      </div>
    </div>
  );
};

export default function CallMetrics({ callLogs }) {
  const metrics = React.useMemo(() => {
    if (!callLogs || callLogs.length === 0) {
      return { total: 0, completed: 0, failed: 0, appointment_set: 0, avgDuration: 0 };
    }

    const completed = callLogs.filter((log) => log.status === 'completed' || log.status === 'appointment_set').length;
    const failed = callLogs.filter((log) => log.status === 'failed').length;
    const appointment_set = callLogs.filter((log) => log.status === 'appointment_set').length;
    const totalDuration = callLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const avgDuration = callLogs.length > 0 ? Math.round(totalDuration / callLogs.length) : 0;

    return {
      total: callLogs.length,
      completed,
      failed,
      appointment_set,
      avgDuration
    };
  }, [callLogs]);

  return (
    <div className="space-y-4">
      <MetricItem
        icon={Phone}
        label="Total Calls"
        value={metrics.total}
        color="text-[#7C3AED]"
      />

      <MetricItem
        icon={CheckCircle2}
        label="Completed"
        value={metrics.completed}
        color="text-[#22C55E]"
      />

      <MetricItem
        icon={CheckCircle2}
        label="Appointments Set"
        value={metrics.appointment_set}
        color="text-[#3B82F6]"
      />

      <MetricItem
        icon={XCircle}
        label="Failed"
        value={metrics.failed}
        color="text-[#EF4444]"
      />

      <MetricItem
        icon={Clock}
        label="Avg. Duration"
        value={`${Math.floor(metrics.avgDuration / 60)}:${(metrics.avgDuration % 60).toString().padStart(2, '0')}`}
        color="text-[#F59E0B]"
      />
    </div>
  );
}