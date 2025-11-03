
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, CheckCircle, AlertCircle, Wrench } from 'lucide-react';
import { AgentConfig, UserAgentSubscription } from '@/api/entities';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function AdminUserRepair() {
    const [searchEmail, setSearchEmail] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [agentConfig, setAgentConfig] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [elevenLabsNumberId, setElevenLabsNumberId] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isRepairing, setIsRepairing] = useState(false);
    const [repairResult, setRepairResult] = useState(null);

    const handleSearch = async () => {
        if (!searchEmail.trim()) {
            toast.error("Please enter an email address");
            return;
        }

        setIsSearching(true);
        setRepairResult(null);
        setSelectedUser(null);
        setAgentConfig(null);
        setSubscription(null);
        setPhoneNumber('');
        setElevenLabsNumberId('');

        try {
            // Use adminOperations function to fetch users
            const { data, error } = await supabase.functions.invoke('adminOperations', {
                body: { operation: 'getAllUsers', limit: 1000 }
            });
            if (error) throw error;
            
            if (!data || !data.users) {
                toast.error("Failed to load users");
                return;
            }

            const users = data.users;
            const user = users.find(u => u.email.toLowerCase() === searchEmail.toLowerCase());

            if (!user) {
                toast.error("User not found");
                return;
            }

            setSelectedUser(user);

            // Load agent config
            const configs = await AgentConfig.filter({ userId: user.id });
            setAgentConfig(configs.length > 0 ? configs[0] : null);
            
            if (configs.length > 0) {
                setPhoneNumber(configs[0].twilioPhoneNumber || '');
                setElevenLabsNumberId(configs[0].elevenLabsTwilioNumberId || '');
            }

            // Load subscription
            const subs = await UserAgentSubscription.filter({ userId: user.id });
            setSubscription(subs.length > 0 ? subs[0] : null);

            toast.success(`Loaded data for ${user.full_name || user.email}`);
        } catch (error) {
            console.error("Search error:", error);
            toast.error(`Failed to search user: ${error.message}`);
        } finally {
            setIsSearching(false);
        }
    };

    const handleRepair = async () => {
        if (!selectedUser) {
            toast.error("No user selected");
            return;
        }

        if (!phoneNumber.trim()) {
            toast.error("Please enter a phone number");
            return;
        }

        if (!elevenLabsNumberId.trim()) {
            toast.error("Please enter an ElevenLabs Number ID");
            return;
        }

        setIsRepairing(true);
        setRepairResult(null);

        try {
            const { data, error } = await supabase.functions.invoke('adminOperations', {
                body: {
                    operation: 'repairAgentConfig',
                    userEmail: selectedUser.email,
                    twilioPhoneNumber: phoneNumber.trim(),
                    elevenLabsTwilioNumberId: elevenLabsNumberId.trim()
                }
            });
            if (error) throw error;

            if (data.success) {
                setRepairResult({
                    success: true,
                    message: data.message,
                    details: data.details
                });
                toast.success("User configuration repaired successfully!");
                
                // Reload the config
                const configs = await AgentConfig.filter({ userId: selectedUser.id });
                setAgentConfig(configs.length > 0 ? configs[0] : null);
            } else {
                setRepairResult({
                    success: false,
                    message: data.message || "Repair failed",
                    details: data.details
                });
                toast.error(data.message || "Repair failed");
            }
        } catch (error) {
            console.error("Repair error:", error);
            setRepairResult({
                success: false,
                message: "An error occurred during repair",
                details: error.message
            });
            toast.error("Failed to repair configuration");
        } finally {
            setIsRepairing(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="w-5 h-5" />
                        Manual User Configuration Repair
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Search Section */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>User Email</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button onClick={handleSearch} disabled={isSearching}>
                                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* User Info Display */}
                        {selectedUser && (
                            <Alert>
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <div><strong>Name:</strong> {selectedUser.full_name || 'N/A'}</div>
                                        <div><strong>Email:</strong> {selectedUser.email}</div>
                                        <div><strong>User ID:</strong> {selectedUser.id}</div>
                                        <div>
                                            <strong>Has Config:</strong> {agentConfig ? 
                                                <span className="text-green-600">Yes (ID: {agentConfig.id})</span> : 
                                                <span className="text-red-600">No</span>
                                            }
                                        </div>
                                        <div>
                                            <strong>Has Subscription:</strong> {subscription ? 
                                                <span className="text-green-600">Yes ({subscription.planType})</span> : 
                                                <span className="text-red-600">No</span>
                                            }
                                        </div>
                                        {agentConfig && (
                                            <>
                                                <div><strong>Current Phone:</strong> {agentConfig.twilioPhoneNumber || 'None'}</div>
                                                <div><strong>Current EL Number ID:</strong> {agentConfig.elevenLabsTwilioNumberId || 'None'}</div>
                                            </>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Configuration Section */}
                    {selectedUser && (
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-semibold">Manual Configuration</h3>
                            
                            <div className="space-y-2">
                                <Label>Twilio Phone Number</Label>
                                <Input
                                    placeholder="+12345678900"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                                <p className="text-xs text-slate-500">Format: +1XXXXXXXXXX</p>
                            </div>

                            <div className="space-y-2">
                                <Label>ElevenLabs Twilio Number ID</Label>
                                <Input
                                    placeholder="Get from ElevenLabs dashboard"
                                    value={elevenLabsNumberId}
                                    onChange={(e) => setElevenLabsNumberId(e.target.value)}
                                />
                                <p className="text-xs text-slate-500">The ID from ElevenLabs Phone Numbers page</p>
                            </div>

                            <Button 
                                onClick={handleRepair} 
                                disabled={isRepairing || !phoneNumber.trim() || !elevenLabsNumberId.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {isRepairing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Repairing Configuration...
                                    </>
                                ) : (
                                    <>
                                        <Wrench className="w-4 h-4 mr-2" />
                                        Repair Configuration
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Result Display */}
                    {repairResult && (
                        <Alert className={repairResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
                            {repairResult.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                            <AlertDescription>
                                <div className="space-y-2">
                                    <div className="font-semibold">{repairResult.message}</div>
                                    {repairResult.details && (
                                        <pre className="text-xs bg-white p-2 rounded overflow-auto">
                                            {JSON.stringify(repairResult.details, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
