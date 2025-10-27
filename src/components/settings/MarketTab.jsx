import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MarketConfigForm from '../market/MarketConfigForm';

export default function MarketTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1E293B] mb-1"></h2>
        <p className="text-sm text-[#475569]"></p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Market Configuration</CardTitle>
          <CardDescription>
            This configuration determines what market data is fetched and how your AI agents tailor their insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarketConfigForm />
        </CardContent>
      </Card>
    </div>);

}