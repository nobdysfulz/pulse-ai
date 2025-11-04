
import React, { useState, useEffect, useContext } from "react";
import { UserContext } from '../components/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

const questions = [
  { id: 'experience_level', section: 'Agent Profile', text: "How long have you been an active real estate agent?", type: 'single_select', options: [{ value: "0-6_months", label: "0-6 months (New Agent)"}, { value: "6_months-2_years", label: "6 months - 2 years (Developing)"}, { value: "2-5_years", label: "2-5 years (Experienced)"}, { value: "5-10_years", label: "5-10 years (Veteran)"}, { value: "10_plus_years", label: "10+ years (Master)"}] },
  { id: 'work_commitment', section: 'Agent Profile', text: "What best describes your real estate commitment?", type: 'single_select', options: [{ value: "part_time", label: "Part-time (evenings/weekends)"}, { value: "full_time", label: "Full-time (40+ hours/week)"}, { value: "full_time_plus", label: "Full-time+ (50+ hours/week)"}] },
  { id: 'business_structure', section: 'Agent Profile', text: "What is your current business structure?", type: 'single_select', options: [{ value: "solo_agent", label: "Solo Agent"}, { value: "team_member", label: "Team Member"}, { value: "team_leader", label: "Team Leader/Lead Agent"}, { value: "broker_owner", label: "Broker/Owner"}, { value: "rainmaker", label: "Rainmaker (High-volume solo)"}] },
  
  { id: 'database_size', section: 'Network Assessment', text: "Approximately how many contacts are in your database/phone?", type: 'single_select', options: [{ value: "0-50", label: "0-50 contacts"}, { value: "51-150", label: "51-150 contacts"}, { value: "151-300", label: "151-300 contacts"}, { value: "301-500", label: "301-500 contacts"}, { value: "501-1000", label: "501-1,000 contacts"}, { value: "1000_plus", label: "1,000+ contacts"}] },
  { id: 'sphere_warmth', section: 'Network Assessment', text: "How would you rate your relationship with your database?", type: 'single_select', options: [{ value: "cold", label: "Mostly cold/purchased leads"}, { value: "mixed", label: "Mix of warm and cold contacts"}, { value: "warm", label: "Mostly warm personal connections"}, { value: "hot", label: "Strong personal relationships"}] },

  {
    id: 'previousYearTransactions',
    section: 'Performance History',
    text: 'How many transactions did you close last year?',
    type: 'number',
    condition: (answers) => answers.experience_level !== '0-6_months' && answers.work_commitment !== 'part_time',
    placeholder: 'Enter number of transactions'
  },
  {
    id: 'previousYearVolume',
    section: 'Performance History',
    text: 'What was your total sales volume last year?',
    type: 'number',
    condition: (answers) => answers.experience_level !== '0-6_months' && answers.work_commitment !== 'part_time',
    placeholder: 'Enter dollar amount (e.g., 2500000 for $2.5M)'
  },
  { id: 'average_price_point', section: 'Performance History', text: "What's your typical listing/sale price range?", type: 'single_select', options: [{ value: "under_200k", label: "Under $200K"}, { value: "200k-400k", label: "$200K - $400K"}, { value: "400k-600k", label: "$400K - $600K"}, { value: "600k-1m", label: "$600K - $1M"}, { value: "1m_plus", label: "$1M+"}], condition: (answers) => answers.experience_level && answers.experience_level !== '0-6_months' },
  { id: 'business_consistency', section: 'Performance History', text: "How would you describe the consistency of your business month-to-month?", type: 'single_select', options: [ { value: "very_inconsistent", label: "Very inconsistent (big swings)"}, { value: "somewhat_inconsistent", label: "Somewhat inconsistent"}, { value: "moderately_consistent", label: "Moderately consistent"}, { value: "very_consistent", label: "Very consistent and predictable"}], condition: (answers) => answers.experience_level && answers.experience_level !== '0-6_months' },

  { id: 'biggest_challenges', section: 'Challenges & Goals', text: "What are your biggest current challenges? (Select up to 3)", type: 'multi_select', max: 3, options: [{ value: "lead_generation", label: "Consistent lead generation"}, { value: "time_management", label: "Time management & organization"}, { value: "conversion", label: "Converting leads to clients"}, { value: "market_knowledge", label: "Market knowledge & expertise"}, { value: "technology", label: "Technology & systems"}, { value: "marketing", label: "Marketing & personal branding"}] },
  { id: 'growth_timeline', section: 'Challenges & Goals', text: "What is your primary growth goal for the next 12 months?", type: 'single_select', options: [ { value: "double_production", label: "Double my production" }, { value: "hire_assistant", label: "Hire my first assistant" }, { value: "start_team", label: "Start building a team" }, { value: "systematize", label: "Systematize my current business" }, { value: "increase_profitability", label: "Increase profitability/net income" } ] },
  { id: 'learning_preference', section: 'Challenges & Goals', text: "How do you prefer to learn and improve?", type: 'single_select', options: [ { value: "videos", label: "Watching videos/webinars" }, { value: "reading", label: "Reading books/articles" }, { value: "coaching", label: "One-on-one coaching/mentorship" }, { value: "doing", label: "Learning by doing/trial-and-error" }, { value: "masterminds", label: "Group masterminds/discussion" } ] }
];

const sections = [...new Set(questions.map(q => q.section))];

export default function IntelligenceSurveyPage() {
  const { user, refreshUserData } = useContext(UserContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelectChange = (questionId, value) => {
    const currentValues = answers[questionId] || [];
    const maxSelections = questions.find(q => q.id === questionId).max;
    if (currentValues.includes(value)) {
      handleAnswerChange(questionId, currentValues.filter(v => v !== value));
    } else if (currentValues.length < maxSelections) {
      handleAnswerChange(questionId, [...currentValues, value]);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, sections.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    // Validation
    if (!answers.experience_level || !answers.work_commitment) {
      toast.error("Please complete all required fields in 'Agent Profile'.");
      return;
    }

    setSubmitting(true);
    try {
      const profileData = {
        user_id: user.id,
        experience_level: answers.experience_level,
        work_commitment: answers.work_commitment,
        business_structure: answers.business_structure,
        database_size: answers.database_size,
        sphere_warmth: answers.sphere_warmth,
        previous_year_transactions: answers.previousYearTransactions ? parseInt(answers.previousYearTransactions) : null,
        previous_year_volume: answers.previousYearVolume ? parseInt(answers.previousYearVolume) : null,
        average_price_point: answers.average_price_point,
        business_consistency: answers.business_consistency,
        biggest_challenges: answers.biggest_challenges || [],
        growth_timeline: answers.growth_timeline,
        learning_preference: answers.learning_preference,
        survey_completed_at: new Date().toISOString()
      };

      // Check if profile already exists
      const { data: existingProfiles } = await supabase
        .from('agent_intelligence_profiles')
        .select('*')
        .eq('user_id', user.id);
      
      if (existingProfiles && existingProfiles.length > 0) {
        // Update existing profile
        await supabase
          .from('agent_intelligence_profiles')
          .update(profileData)
          .eq('user_id', user.id);
      } else {
        // Create new profile
        await supabase
          .from('agent_intelligence_profiles')
          .insert(profileData);
      }

      // Update onboarding status
      const { data: onboardingRecords } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id);
      
      if (onboardingRecords && onboardingRecords.length > 0) {
        await supabase
          .from('user_onboarding')
          .update({
            agent_intelligence_completed: true,
            agent_intelligence_completion_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Create onboarding record if it doesn't exist
        await supabase
          .from('user_onboarding')
          .insert({
            user_id: user.id,
            agent_intelligence_completed: true,
            agent_intelligence_completion_date: new Date().toISOString()
          });
      }

      await refreshUserData();
      toast.success("Intelligence profile saved successfully!");
      
      // Check if user should continue with agent onboarding or go to dashboard
      const isSubscriber = user?.subscriptionTier === 'Subscriber' || user?.subscriptionTier === 'Admin';
      const { data: onboardingData } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (isSubscriber && !onboardingData?.agent_onboarding_completed) {
        setTimeout(() => {
          navigate(createPageUrl('Onboarding') + '?phase=agents');
        }, 1000);
      } else {
        setTimeout(() => {
          navigate(createPageUrl('Dashboard'));
        }, 1000);
      }

    } catch (error) {
      console.error("Error saving intelligence profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentSection = sections[currentStep];
  const sectionQuestions = questions.filter(q => q.section === currentSection && (!q.condition || q.condition(answers)));
  const progress = ((currentStep + 1) / sections.length) * 100;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F8FAFC]">
      <div className="max-w-2xl mx-auto">
        <Card className="w-full shadow-sm">
          <CardHeader>
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-[#1E293B] mt-2">Intelligence Survey</h1>
              <p className="text-[#64748B]">Help us understand your business to provide personalized AI insights.</p>
            </div>
            <Progress value={progress} className="h-2.5" />
            <div className="flex justify-between text-sm font-medium mt-2">
              {sections.map((sec, index) => (
                <span key={sec} className={index <= currentStep ? 'text-[#7C3AED]' : 'text-[#94A3B8]'}>
                  {sec}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent className="min-h-[300px] py-6">
            <h2 className="text-xl font-semibold mb-6 text-center text-[#1E293B]">{currentSection}</h2>
            <div className="space-y-6">
              {sectionQuestions.map(q => (
                <div key={q.id}>
                  <Label className="text-base font-medium text-[#1E293B]">{q.text}</Label>
                  <div className="mt-3">
                    {q.type === 'single_select' && (
                      <RadioGroup value={answers[q.id]} onValueChange={(val) => handleAnswerChange(q.id, val)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map(opt => (
                            <Label 
                              key={opt.value} 
                              className={cn(
                                "flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[#F8FAFC] transition-colors",
                                answers[q.id] === opt.value && "bg-[#7C3AED]/10 border-[#7C3AED]"
                              )}
                            >
                              <RadioGroupItem value={opt.value} id={`${q.id}-${opt.value}`} />
                              <span className="text-sm">{opt.label}</span>
                            </Label>
                          ))}
                        </div>
                      </RadioGroup>
                    )}
                    {q.type === 'multi_select' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map(opt => (
                            <Label 
                              key={opt.value} 
                              className={cn(
                                  "flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[#F8FAFC] transition-colors",
                                  (answers[q.id] || []).includes(opt.value) && "bg-[#7C3AED]/10 border-[#7C3AED]"
                              )}
                             >
                               <Checkbox
                                  checked={(answers[q.id] || []).includes(opt.value)}
                                  onCheckedChange={() => handleMultiSelectChange(q.id, opt.value)}
                                />
                              <span className="text-sm">{opt.label}</span>
                            </Label>
                          ))}
                      </div>
                    )}
                    {q.type === 'number' && (
                      <Input type="number" value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="max-w-xs" placeholder={q.placeholder} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            {currentStep < sections.length - 1 ? (
              <Button onClick={nextStep}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="bg-gradient-to-r from-[#E4018B] to-[#7017C3] hover:opacity-90">
                {submitting ? "Submitting..." : "Complete Assessment"} <Send className="w-4 h-4 ml-2" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
