import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import useCredits from '../credits/useCredits';

export default function ReferralCard() {
    const { userCredits, loading } = useCredits();

    // Only show if user has 5 or fewer credits
    if (loading) return null;
    if (!userCredits || userCredits.creditsRemaining > 5) return null;

    return (
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                    <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm text-slate-900 mb-1">
                        Running Low on Credits?
                    </h3>
                    <p className="text-xs text-slate-600 mb-3">
                        Invite colleagues and earn 5 bonus credits for each person who joins!
                    </p>
                    <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                        <Link to={createPageUrl('Settings?tab=referrals')}>
                            Start Referring
                        </Link>
                    </Button>
                </div>
            </div>
        </Card>
    );
}