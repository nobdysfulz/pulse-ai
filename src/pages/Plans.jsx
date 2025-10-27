
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { User, UserCredit, UserAgentSubscription } from '@/api/entities';
import { cn } from '@/lib/utils';
import { differenceInDays, endOfMonth } from 'date-fns';

export default function PlansPage() {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState({ used: 0, remaining: 100 });
  const [agentSubscription, setAgentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);

        const [creditData, agentSubData] = await Promise.all([
        UserCredit.filter({ userId: userData.id }),
        UserAgentSubscription.filter({ userId: userData.id })]
        );

        if (creditData.length > 0) {
          setCredits({
            used: creditData[0].creditsUsed || 0,
            remaining: creditData[0].creditsRemaining || 0,
            resetDate: creditData[0].resetDate
          });
        }
        if (agentSubData.length > 0) {
          setAgentSubscription(agentSubData[0]);
        }
      } catch (e) {
        console.error("Failed to fetch user or credit data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const getDaysUntilReset = () => {
    if (credits.resetDate) {
      const days = differenceInDays(new Date(credits.resetDate), new Date());
      return Math.max(0, days);
    }
    const today = new Date();
    const end = endOfMonth(today);
    return differenceInDays(end, today);
  };

  const daysUntilReset = getDaysUntilReset();

  const isCurrentPlan = (planName) => {
    if (!user) return false;
    if (planName === "Free" && user.subscriptionTier === 'Free') return true;
    if (planName === "Accelerator" && user.subscriptionTier === 'Subscriber') return true;
    if (agentSubscription && planName.includes(agentSubscription.planType)) return true;
    return false;
  };

  const allPlans = [
    {
      type: 'subscription',
      name: "Free",
      description: "Get started with basic features",
      price: "$0",
      period: "forever",
      features: ["100 credits/month", "5 basic role-play scenarios", "15 core scripts", "Monthly market updates", "Limited AI conversations"],
      buttonText: "Your Current Plan",
      buttonLink: null
    },
    {
      type: 'subscription',
      name: "Accelerator",
      description: "Everything you need to grow",
      price: "$49",
      period: "per month",
      features: ["UNLIMITED Credits", "20+ advanced scenarios", "48+ proven scripts", "Weekly market alerts", "Unlimited AI coaching", "Training Center access", "Live group coaching"],
      buttonText: "Upgrade Now",
      buttonLink: "https://my.pwru.app/products/pwru-annual?utm_source=PulseIntelligence&utm_medium=plans-page&utm_content=app",
      popular: true
    },
    { 
      type: 'agent', 
      name: "AI Appointment Setter Starter", 
      description: "Start automating your appointments", 
      price: "$397", 
      period: "per month", 
      features: ["200 calling minutes/month", "Overage: $0.45/minute", "Local phone number included", "No contract required", "Cancel anytime"], 
      buttonText: "+ ADD NOW", 
      buttonLink: "https://my.pwru.app/products/seasonal-agent" 
    },
    { 
      type: 'agent', 
      name: "AI Appointment Setter Pro", 
      description: "Scale your appointment setting", 
      price: "$697", 
      period: "per month", 
      features: ["600 calling minutes/month", "Overage: $0.35/minute", "Local phone number included", "No contract required", "Cancel anytime"], 
      buttonText: "+ ADD NOW", 
      buttonLink: "https://my.pwru.app/products/ai-prospecting-agent-600" 
    },
    { 
      type: 'agent', 
      name: "AI Appointment Setter Unlimited", 
      description: "Unlimited appointment capacity", 
      price: "$997", 
      period: "per month", 
      features: ["Unlimited calling minutes/month", "No overage charges", "Local phone number included", "No contract required", "Cancel anytime"], 
      buttonText: "+ ADD NOW", 
      buttonLink: "https://my.pwru.app/products/ai-prospecting-agent-2000" 
    }
  ];


  const subscriptionPlans = allPlans.filter((p) => p.type === 'subscription');
  const agentPlans = allPlans.filter((p) => p.type === 'agent');

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Plans and Pricing</h1>
        </div>

        {/* Subscription Plans Section */}
        <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">Subscription Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto">
              {subscriptionPlans.map((plan, index) => {
              const isCurrent = isCurrentPlan(plan.name);
              return (
                <div key={index} className={cn(
                  "relative bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg transition-all duration-300 flex flex-col",
                  isCurrent ? "opacity-70 ring-2 ring-green-500" : "hover:scale-105",
                  plan.popular && !isCurrent ? 'ring-2 ring-purple-500' : ''
                )}>
                    {plan.popular && !isCurrent &&
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-0.5 rounded-full text-xs font-semibold">
                        Most Popular
                      </div>
                  }
                    
                    <div className="text-center mb-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-1.5">{plan.name}</h3>
                      <p className="text-xs text-slate-600 mb-3 min-h-[32px]">{plan.description}</p>
                      <div className="mb-3">
                        <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                        <div className="text-xs text-slate-500">{plan.period}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 flex-grow">
                      <div className="text-xs font-semibold text-slate-700 mb-1">What's included:</div>
                      {plan.features.map((feature, idx) =>
                    <div key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-slate-600">{feature}</span>
                        </div>
                    )}
                    </div>

                    <div className="mt-auto">
                      {isCurrent ?
                    <Button disabled className="w-full bg-purple-600 text-slate-100 cursor-not-allowed">
                            Your Current Plan
                        </Button> :

                    <Button asChild className={cn(
                      'w-full text-white',
                      plan.popular ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : 'bg-slate-900 hover:bg-slate-800'
                    )}>
                          <a href={plan.buttonLink} target="_blank" rel="noopener noreferrer">
                            {plan.buttonText}
                          </a>
                        </Button>
                    }
                    </div>
                  </div>);

            })}
            </div>
        </section>

        {/* AI Agent Plans Section */}
        <section>
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">AI Appointment Setter Optional Add-on</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {agentPlans.map((plan, index) => {
              const isCurrent = isCurrentPlan(plan.name);
              return (
                <div key={index} className={cn(
                  "relative bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg transition-all duration-300 flex flex-col",
                  isCurrent ? "opacity-70 ring-2 ring-green-500" : "hover:scale-105"
                )}>
                    <div className="text-center mb-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-1.5">{plan.name}</h3>
                      <p className="text-xs text-slate-600 mb-3 min-h-[32px]">{plan.description}</p>
                      <div className="mb-3">
                        <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                        <div className="text-xs text-slate-500">{plan.period}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 flex-grow">
                      <div className="text-xs font-semibold text-slate-700 mb-1">What's included:</div>
                      {plan.features.map((feature, idx) =>
                    <div key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-slate-600">{feature}</span>
                        </div>
                    )}
                    </div>

                    <div className="mt-auto">
                       {isCurrent ?
                    <Button disabled className="w-full bg-slate-300 text-slate-600 cursor-not-allowed">
                            Your Current Plan
                        </Button> :

                    <Button asChild className='w-full bg-slate-400 hover:bg-purple-800 text-white'>
                          <a href={plan.buttonLink} target="_blank" rel="noopener noreferrer">
                            {plan.buttonText}
                          </a>
                        </Button>
                    }
                    </div>
                  </div>);

            })}
            </div>
        </section>

      </div>
    </div>);

}
