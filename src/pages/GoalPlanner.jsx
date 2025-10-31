
import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, BarChart3, DollarSign, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { UserContext } from "../components/context/UserContext";
import ProductionPlannerModal from '../components/goal-planner/ProductionPlannerModal';
import { toast } from "sonner";

const PlanCard = ({ plan, onNavigate }) =>
    <Card className={cn("flex flex-col justify-between hover:shadow-lg transition-shadow rounded-xl overflow-hidden", plan.isComingSoon && "bg-slate-50")}>
        <div>
            <div className={cn("h-32 flex items-center justify-center", plan.bgColor || 'bg-slate-100')}>
                <plan.icon className={cn("w-12 h-12", plan.iconColor || 'text-slate-500')} />
            </div>
            <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-slate-600 mb-4">{plan.description}</p>
                {plan.features &&
                    <div className="space-y-2">
                        {plan.features.map((feature, index) =>
                            <div key={index} className="flex items-center gap-2 text-sm text-slate-700">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>{feature}</span>
                            </div>
                        )}
                    </div>
                }
            </CardContent>
        </div>
        <div className="p-6 pt-0">
            {plan.isComingSoon ?
                <Button className="w-full" variant="outline" disabled>
                    Coming Soon
                </Button> :

                <Button
                    className={cn("w-full", !plan.completed && "bg-pink-600 hover:bg-pink-700 text-white")}
                    variant={plan.completed ? 'outline' : 'default'}
                    onClick={() => onNavigate(plan)}>

                    {plan.completed ? 'Edit Plan' : 'New Plan'}
                </Button>
            }
        </div>
    </Card>;


export default function GoalPlanner() {
    const { user, refreshUserData } = useContext(UserContext);
    const navigate = useNavigate();
    const [activePlan, setActivePlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProductionPlanner, setShowProductionPlanner] = useState(false);

    const loadActivePlan = async () => {
        setLoading(true);
        try {
            // Fetch the most recent business plan for the current user
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                setActivePlan(null);
                return;
            }

            const { data: plans, error } = await supabase
                .from('business_plans')
                .select('*')
                .eq('user_id', authUser.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            setActivePlan(plans && plans.length > 0 ? plans[0] : null);
        } catch (error) {
            console.error('Error loading business plan:', error);
            toast.error('Failed to load business plan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadActivePlan();
        }
    }, [user]);

    const handleProductionPlannerClose = () => {
        setShowProductionPlanner(false);
        loadActivePlan(); // Single call to refresh active plan status
    };

    const planCards = [
        {
            name: 'SuccessIndex Assessment',
            description: 'Discover your strengths and opportunities for growth.',
            icon: Target,
            page: 'SuccessIndex',
            completed: false, // Assuming SuccessIndex is not 'completed' in the same way as a business plan
            isComingSoon: false,
            bgColor: 'bg-purple-100',
            iconColor: 'text-purple-600'
        },
        {
            name: '12-Month Production Plan', // Updated name from outline
            description: 'Design your annual production goals and breakdown', // Updated description from outline
            icon: BarChart3, // Updated icon to BarChart3
            page: 'ProductionPlanner',
            completed: !!activePlan, // True if an active plan exists
            isComingSoon: false, // This plan is available
            bgColor: 'bg-sky-100',
            iconColor: 'text-sky-600'
        },
        {
            name: 'Content Plan',
            description: 'Map out your content strategy for the upcoming quarter.',
            icon: TrendingUp, // Updated icon from Calendar to TrendingUp
            page: 'ContentStudio',
            completed: false,
            isComingSoon: true,
            bgColor: 'bg-slate-100',
            iconColor: 'text-slate-400'
        },
        {
            name: 'Advanced Business Plan',
            description: 'Dive deeper into financials, marketing, and team structure.',
            icon: DollarSign, // Updated icon from Briefcase to DollarSign
            page: 'ComingSoon', // Placeholder page for coming soon items
            completed: false,
            isComingSoon: true,
            bgColor: 'bg-slate-100',
            iconColor: 'text-slate-400'
        }
    ];

    const handleCardClick = (plan) => {
        if (loading) {
            toast.info('Loading plan status, please wait...');
            return;
        }

        if (plan.isComingSoon) {
            toast.info('This feature is coming soon!');
            return;
        }

        if (plan.page === "ProductionPlanner") {
            setShowProductionPlanner(true);
        } else if (plan.page) {
            navigate(createPageUrl(plan.page));
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 text-center">Achieve Your Goals</h1>
            </header>

            {loading ? (
                <div className="text-center text-slate-500">Loading plans...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {planCards.map((plan) =>
                        <PlanCard key={plan.name} plan={plan} onNavigate={handleCardClick} />
                    )}
                </div>
            )}


            <ProductionPlannerModal
                isOpen={showProductionPlanner}
                onClose={handleProductionPlannerClose}
                existingPlan={activePlan} />

        </div>
    );
}
