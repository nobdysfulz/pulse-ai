
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { UserMarketConfig } from '@/api/entities';
import { AgentConfig } from '@/api/entities';
import { UserOnboarding } from '@/api/entities';
import { LegalDocument } from '@/api/entities'; // Added import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Phone, User as UserIcon, Calendar, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { googleCalendarAuth } from '@/api/functions';
import { twilioActions } from '@/api/functions';
import { finalizeAgentOnboarding } from '@/api/functions'; // Added import

const StepIndicator = ({ currentStep }) => {
    const steps = ["Agent Details", "Calendar", "Phone Number", "Disclosure"];
    return (
        <div className="flex justify-center items-center space-x-4 mb-8">
            {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index < currentStep ? 'bg-pink-600 text-white' : index === currentStep ? 'bg-pink-600 text-white border-2 border-pink-300' : 'bg-slate-200 text-slate-500'}`}>
                        {index < currentStep ? <CheckCircle size={16} /> : index + 1}
                    </div>
                    <span className={`ml-2 ${index === currentStep ? 'font-bold text-pink-700' : 'text-slate-600'}`}>{step}</span>
                    {index < steps.length - 1 && <div className="ml-4 h-0.5 w-16 bg-slate-200"></div>}
                </div>
            ))}
        </div>
    );
};

export default function AgentOnboardingPage() {
    const [user, setUser] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Step 1 State
    const [agentDetails, setAgentDetails] = useState({
        firstName: '',
        lastName: '',
        brokerage: '',
        phone: '',
        area: '',
    });

    // Step 2 State
    const [calendarConnected, setCalendarConnected] = useState(false);
    
    // Step 3 State
    const [areaCode, setAreaCode] = useState('');
    const [availableNumbers, setAvailableNumbers] = useState([]);
    const [selectedNumber, setSelectedNumber] = useState('');
    
    // Step 4 State
    const [disclosureText, setDisclosureText] = useState('');
    const [fullNameInput, setFullNameInput] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isLicensed, setIsLicensed] = useState(false);
    const [assumeLiability, setAssumeLiability] = useState(false);
    const [refundPolicy, setRefundPolicy] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            try {
                const userData = await User.me();
                setUser(userData);
                setAgentDetails({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    brokerage: userData.brokerage || '',
                    phone: userData.phone || '',
                });

                const [marketConfigs, agentConfigs, disclosureDocs] = await Promise.all([
                    UserMarketConfig.filter({ userId: userData.id }),
                    AgentConfig.filter({ userId: userData.id }),
                    LegalDocument.filter({ documentType: 'agent_onboarding_terms' })
                ]);
                
                const disclosureDoc = disclosureDocs.length > 0 ? disclosureDocs[0] : null;

                if (disclosureDoc) {
                    setDisclosureText(disclosureDoc.content);
                } else {
                    setDisclosureText('Terms and Conditions are not available at this moment. Please contact support.');
                    toast.error("Could not load legal terms.");
                }

                if (marketConfigs.length > 0) {
                    setAgentDetails(prev => ({...prev, area: marketConfigs[0].primaryTerritory}));
                    const firstZip = marketConfigs[0].zipCodes?.[0];
                    if (firstZip && firstZip.length >= 3) {
                        setAreaCode(firstZip.substring(0,3));
                    }
                }
                if (agentConfigs.length > 0) {
                    if(agentConfigs[0].twilioPhoneNumber) setSelectedNumber(agentConfigs[0].twilioPhoneNumber);
                    if(agentConfigs[0].googleRefreshToken) setCalendarConnected(true);
                }

                const queryParams = new URLSearchParams(location.search);
                const code = queryParams.get('code');
                if (code) {
                    setStep(2);
                    setSaving(true);
                    toast.info("Connecting to Google Calendar...");
                    await googleCalendarAuth({ action: 'handleCallback', payload: { code } });
                    setCalendarConnected(true);
                    toast.success("Google Calendar connected successfully!");
                    navigate('/AgentOnboarding', { replace: true });
                }

            } catch (e) {
                console.error("Initialization error:", e);
                toast.error("Failed to load user data. Please refresh.");
            } finally {
                setLoading(false);
            }
        };
        initialize();
    }, [location.search, navigate]);
    
    const handleSaveAgentDetails = async () => {
        setSaving(true);
        try {
            await User.updateMyUserData({
                firstName: agentDetails.firstName,
                lastName: agentDetails.lastName,
                brokerage: agentDetails.brokerage,
                phone: agentDetails.phone
            });
            const [marketConfig] = await UserMarketConfig.filter({userId: user.id});
            if(marketConfig) {
                 await UserMarketConfig.update(marketConfig.id, { primaryTerritory: agentDetails.area });
            } else {
                 await UserMarketConfig.create({ userId: user.id, primaryTerritory: agentDetails.area });
            }
            toast.success("Agent details saved!");
            setStep(2);
        } catch (e) {
            console.error("Save agent details error:", e);
            toast.error("Failed to save details.");
        } finally {
            setSaving(false);
        }
    }
    
    const handleConnectCalendar = async () => {
        setSaving(true);
        try {
            const { data } = await googleCalendarAuth({ action: 'getAuthUrl' });
            window.location.href = data.authUrl;
        } catch (e) {
            console.error("Connect calendar error:", e);
            toast.error("Could not initiate Google Calendar connection.");
            setSaving(false);
        }
    };
    
    const handleSearchNumbers = async () => {
        if (!areaCode || areaCode.length !== 3) {
            toast.warning("Please enter a valid 3-digit area code.");
            return;
        }
        setSaving(true);
        setAvailableNumbers([]);
        setSelectedNumber('');
        try {
            const { data } = await twilioActions({ action: 'searchNumbers', payload: { areaCode } });
            setAvailableNumbers(data.numbers || []);
            if(data.numbers?.length > 0) {
                toast.success(`${data.numbers.length} local numbers found.`);
            } else {
                toast.warning("No numbers found for that area code. Please try another.");
            }
        } catch (e) {
            console.error("Search numbers error:", e);
            toast.error("Failed to search for numbers.");
        } finally {
            setSaving(false);
        }
    }

    const handlePurchaseNumber = async () => {
        if (!selectedNumber) {
            toast.warning("Please select a number to purchase.");
            return;
        }
        setSaving(true);
        try {
            const response = await twilioActions({ action: 'purchaseNumber', payload: { numberToPurchase: selectedNumber } });
            
            if (response.data?.success && response.data?.elevenLabsTwilioNumberId) {
                toast.success(`Successfully acquired number: ${selectedNumber}`);
                setStep(4);
            } else {
                throw new Error("Failed to properly configure the phone number. Missing ElevenLabs ID.");
            }
        } catch (e) {
            console.error("Purchase number error:", e);
            toast.error("Failed to purchase number. Please try again or contact support.");
        } finally {
            setSaving(false);
        }
    }
    
    const handleCompleteOnboarding = async () => {
        setIsFinishing(true);
        try {
            // Call the new centralized finalizeAgentOnboarding function
            const { data, error } = await finalizeAgentOnboarding();

            if (error || !data.success) {
                throw new Error(data.error || 'Failed to finalize onboarding.');
            }

            toast.success("Setup complete! Your AI Agent is now active.");
            navigate('/Agents');
        } catch(e) {
            console.error("Onboarding completion error:", e);
            toast.error("Something went wrong.", {
                description: "Could not finalize your agent setup. Please try again or contact support."
            });
        } finally {
            setIsFinishing(false);
        }
    }
    
    const isDisclosureComplete = 
        fullNameInput.trim().toLowerCase() === user?.full_name.trim().toLowerCase() &&
        agreeTerms &&
        isLicensed &&
        assumeLiability &&
        refundPolicy;

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold mb-2">Set Up Your AI Agent</h1>
            <p className="text-slate-600 mb-8">Let's get you set up in a few quick steps.</p>
            
            <StepIndicator currentStep={step - 1} />

            <Card className="w-full max-w-2xl shadow">
                <CardContent className="p-8">
                    {step === 1 && (
                        <div>
                             <h2 className="text-2xl font-semibold mb-4">Step 1: Personalize Your AI Agent</h2>
                             <p className="text-slate-500 mb-6">Confirm these details. Your AI will use them when calling prospects.</p>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1"><Label>First Name</Label><Input value={agentDetails.firstName} onChange={e => setAgentDetails({...agentDetails, firstName: e.target.value})} /></div>
                                <div className="space-y-1"><Label>Last Name</Label><Input value={agentDetails.lastName} onChange={e => setAgentDetails({...agentDetails, lastName: e.target.value})} /></div>
                                <div className="space-y-1"><Label>Brokerage</Label><Input value={agentDetails.brokerage} onChange={e => setAgentDetails({...agentDetails, brokerage: e.target.value})} /></div>
                                <div className="space-y-1"><Label>Your Phone</Label><Input value={agentDetails.phone} onChange={e => setAgentDetails({...agentDetails, phone: e.target.value})} /></div>
                                <div className="md:col-span-2 space-y-1"><Label>Primary Market Area</Label><Input value={agentDetails.area} onChange={e => setAgentDetails({...agentDetails, area: e.target.value})} /></div>
                             </div>
                             <p className="text-sm text-slate-500 mt-4">Example: "Hi, I'm calling from {agentDetails.brokerage || '[Brokerage]'} about your home at..."</p>
                             <Button onClick={handleSaveAgentDetails} disabled={saving} className="w-full mt-8 bg-pink-600 hover:bg-pink-700">
                                 {saving ? <Loader2 className="animate-spin" /> : "Save & Continue"}
                             </Button>
                        </div>
                    )}
                     {step === 2 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-4">Step 2: Connect Your Calendar</h2>
                            <p className="text-slate-500 mb-6">Allow your AI to book appointments directly into your calendar.</p>
                            {!calendarConnected ? (
                                <Button onClick={handleConnectCalendar} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                                    {saving ? <Loader2 className="animate-spin" /> : <><Calendar className="mr-2" /> Connect Google Calendar</>}
                                </Button>
                            ) : (
                                <div className="p-4 bg-green-100 text-green-800 rounded-md flex items-center justify-center">
                                    <CheckCircle className="mr-2" /> Calendar Connected!
                                </div>
                            )}
                             <Button onClick={() => setStep(3)} className="w-full mt-8 bg-pink-600 hover:bg-pink-700">Continue</Button>
                        </div>
                    )}
                    {step === 3 && (
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">Step 3: Get Your Phone Number</h2>
                            <p className="text-slate-500 mb-6">Your AI agent needs a dedicated local phone number to make calls from. Enter an area code to begin.</p>
                            <div className="flex items-start gap-2">
                                <Input 
                                    value={areaCode} 
                                    onChange={e => setAreaCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter Area Code (e.g. 512)" 
                                    maxLength="3" 
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                                <Button onClick={handleSearchNumbers} disabled={saving || areaCode.length !== 3}>
                                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : "Search"}
                                </Button>
                            </div>
                            
                             {availableNumbers.length > 0 && (
                                <div className="mt-6">
                                     <Label className="font-semibold">Select a Number</Label>
                                     <RadioGroup value={selectedNumber} onValueChange={setSelectedNumber} className="mt-2 space-y-2">
                                         {availableNumbers.map(num => (
                                             <div key={num} className="flex items-center space-x-3 p-3 border rounded-md bg-white">
                                                 <RadioGroupItem value={num} id={num} />
                                                 <Label htmlFor={num} className="font-mono text-base">{num}</Label>
                                             </div>
                                         ))}
                                     </RadioGroup>
                                 </div>
                             )}
                            <Button onClick={handlePurchaseNumber} disabled={saving || !selectedNumber} className="w-full mt-8 bg-pink-600 hover:bg-pink-700">
                                {saving ? <Loader2 className="animate-spin" /> : "Continue"}
                            </Button>
                        </div>
                    )}
                     {step === 4 && (
                        <div>
                            <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2"><FileText /> Step 4: Terms of Use</h2>
                            <p className="text-slate-500 mb-4">Please read and accept the terms to activate your AI Agent.</p>
                            <div className="h-48 overflow-y-auto border rounded-md p-4 bg-slate-50 text-sm text-slate-700 space-y-4">
                               {disclosureText ? disclosureText.split('\n').map((line, i) => <p key={i}>{line}</p>) : <Loader2 className="animate-spin mx-auto" />}
                            </div>
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="agreeTerms" checked={agreeTerms} onCheckedChange={setAgreeTerms} />
                                    <Label htmlFor="agreeTerms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        I have read, understood, and agree to these Terms and Conditions
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="isLicensed" checked={isLicensed} onCheckedChange={setIsLicensed} />
                                    <Label htmlFor="isLicensed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        I confirm that I am a licensed real estate professional
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="assumeLiability" checked={assumeLiability} onCheckedChange={setAssumeLiability} />
                                    <Label htmlFor="assumeLiability" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        I understand that I assume all liability for my use of this Feature
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="refundPolicy" checked={refundPolicy} onCheckedChange={setRefundPolicy} />
                                    <Label htmlFor="refundPolicy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        I understand that I have 48 hours from today to request a full refund if I disagree with these terms
                                    </Label>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Label htmlFor="fullName">Type your full name to agree: <span className="font-bold">{user?.full_name}</span></Label>
                                    <Input id="fullName" value={fullNameInput} onChange={e => setFullNameInput(e.target.value)} placeholder="Type your full name..." />
                                </div>
                            </div>
                            <Button onClick={handleCompleteOnboarding} disabled={!isDisclosureComplete || isFinishing} className="w-full mt-8 bg-pink-600 hover:bg-pink-700">
                               {isFinishing ? <Loader2 className="animate-spin" /> : "Finish & Activate Agent"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
