import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function Step1AgentInfo({ planData, setPlanData }) {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

    return (
        <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-2">Agent Information</h2>
            <p className="text-gray-500 mb-8">Let's start with your high-level goals for the year.</p>

            <div className="space-y-6 text-left">
                <div className="space-y-2">
                    <Label htmlFor="planYear">Plan Year</Label>
                    <Select
                        value={planData.planYear.toString()}
                        onValueChange={(value) => setPlanData({ ...planData, planYear: parseInt(value) })}
                    >
                        <SelectTrigger id="planYear">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="netIncomeGoal">Net Income Goal</Label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                        <Input
                            id="netIncomeGoal"
                            type="number"
                            value={planData.netIncomeGoal}
                            onChange={(e) => setPlanData({ ...planData, netIncomeGoal: parseFloat(e.target.value) || 0 })}
                            placeholder="70000"
                            className="pl-7"
                        />
                    </div>
                </div>
            </div>

            <Card className="mt-12 bg-gray-50 border-gray-200 text-left">
                <CardContent className="p-6">
                    <h4 className="font-semibold mb-2">Legal Disclaimer</h4>
                    <p className="text-xs text-gray-600">
                        This tool is for educational and planning purposes only. Power Unit Coaching LLC makes no guarantees regarding future income. Actual results depend on effort, market conditions, experience, and execution. By proceeding, you agree that Power Unit Coaching LLC is not liable for financial outcomes including income loss or missed goals.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}