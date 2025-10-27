
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import BrainIcon from '@/components/ui/BrainIcon';
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";

const getBarColor = (score, maxScore = 20) => {
  const percentage = score / maxScore * 100;
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

const PulseLegend = ({ data }) => {
  const legendItems = [
  { label: 'P', value: data.planningAdherence, name: 'Planning' },
  { label: 'U', value: data.urgencyManagement, name: 'Urgency' },
  { label: 'L', value: data.leadEngagement, name: 'Lead Engagement' },
  { label: 'S', value: data.systemsUtilization, name: 'Systems' },
  { label: 'E', value: data.executionConsistency, name: 'Execution' }];


  return (
    <div className="w-full max-w-sm mx-auto mt-6 space-y-3">
             {legendItems.map((item) =>
      <div key={item.label} className="grid grid-cols-12 items-center gap-2">
                    <p className="text-slate-950 text-xs font-bold col-span-1">{item.label}</p>
                    <div className="col-span-11">
                        <Progress value={item.value / 20 * 100} indicatorClassName={getBarColor(item.value)} />
                    </div>
                </div>
      )}
        </div>);

};

const PulseGauge = ({ score = 0, trend = 0 }) => {
  const size = 280;
  const strokeWidth = 24;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = Math.PI * radius; // Semi-circle circumference

  const scorePercentage = Math.min(100, Math.max(0, score));
  const offset = circumference - scorePercentage / 100 * circumference;

  const angleInDegrees = 180 - scorePercentage * 1.8;
  const angleInRadians = angleInDegrees * (Math.PI / 180);

  const indicatorX = size / 2 + radius * Math.cos(angleInRadians);
  // Corrected Y-coordinate calculation for an upward-facing arc
  const indicatorY = size / 2 - radius * Math.sin(angleInRadians);

  const trendText = trend !== 0 ? `${trend > 0 ? '+' : ''}${trend} pts` : "No change";

  // Corrected path `d` attribute with sweep-flag=1 to draw the arc upwards
  const arcPathD = `M ${strokeWidth / 2},${size / 2} A ${radius},${radius} 0 0 1 ${size - strokeWidth / 2},${size / 2}`;

  return (
    <div className="relative w-full h-[160px] flex items-center justify-center">
            <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 -${strokeWidth / 2} ${size} ${size / 2 + strokeWidth}`} className="absolute bottom-0 overflow-visible">
                 <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="50%" stopColor="#facc15" />
                        <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                </defs>
                
                {/* Background Arc */}
                <path
          d={arcPathD}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round" />


                {/* Foreground/Score Arc */}
                 <path
          d={arcPathD}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }} />

                
                {/* Indicator Dot - now with correct dynamic positioning */}
                <circle cx={indicatorX} cy={indicatorY} r="5" fill="#1e293b" style={{ transition: 'all 0.5s ease-out' }} />
            </svg>
            
            {/* Text Content - Lowered for better vertical centering */}
            <div className="absolute flex flex-col items-center justify-center translate-y-4">
                <div className="text-6xl font-bold text-slate-800 tracking-tight">{score}</div>
                <div className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full -mt-1">{trendText}</div>
            </div>

            {/* Labels - Removed the '50' */}
            <div className="text-rose-600 text-xs absolute bottom-1 left-3">0</div>
            <div className="text-green-600 text-xs absolute bottom-1 right-3">100</div>
        </div>);

};


export default function TodayPulse({ pulseData, onConfigClick }) {
  if (!pulseData || pulseData.hasInsufficientData) {
    return (
      <Card className="p-6 text-center border-0 h-full flex flex-col justify-center items-center shadow-lg bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-blue-50/50">
                <BrainIcon className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Activate Your PULSE</h3>
                <p className="text-sm text-slate-600 mb-4">Complete your Agent AI profile to unlock your personalized PULSE score and insights.</p>
                <Button onClick={onConfigClick} className="bg-purple-600 hover:bg-purple-700 text-white">
                    Complete PULSE Setup
                </Button>
            </Card>);

  }

  return (
    <Card className="border-0 shadow-med bg-gradient-to-br from-blue-50/50 to-green-50/50 rounded-xl p-4 md:p-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-slate-800 text-base font-semibold">Your Current PULSE Score</h3>
                <Button variant="ghost" size="icon" onClick={onConfigClick} className="h-8 w-8 text-slate-500">
                    <Settings className="w-5 h-5" />
                </Button>
            </div>
            
            <PulseGauge score={pulseData.overallPulseScore} trend={pulseData.performanceTrend?.change} />

            <PulseLegend data={pulseData} />
        </Card>);

}