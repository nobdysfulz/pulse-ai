import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LockedFeature({ feature, description }) {
  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardContent className="p-12 text-center">
        <Lock className="w-16 h-16 mx-auto text-purple-600 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{feature} is Locked</h2>
        <p className="text-slate-600 mb-6">
          {description || 'Upgrade your plan to access this premium feature.'}
        </p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link to={createPageUrl('Plans')}>Upgrade Now</Link>
        </Button>
      </CardContent>
    </Card>
  );
}