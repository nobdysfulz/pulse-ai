import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useClerk } from '@clerk/clerk-react';
import { toast } from 'sonner';

export default function SecurityTab() {
    const { user, setSupportChatOpen } = useContext(UserContext);
    const { signOut } = useClerk();

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success("You have been signed out.");
        } catch (error) {
            console.error("Sign out failed:", error);
            toast.error("Sign out failed. Please try again.");
        }
    };

    const handleDeleteAccount = () => {
        setSupportChatOpen(true);
        toast.info("A support specialist will help you confirm your deletion request.");
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Security & Privacy</h2>
                <p className="text-sm text-[#475569]">Manage your account security and data settings.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Password Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600">
                        Your account is secured via Google Single Sign-On (SSO). To change your password, please update it through your Google account settings.
                    </p>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Sign Out</CardTitle>
                    <CardDescription>Sign out of your PULSE AI account on this device.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
                </CardContent>
            </Card>

            <Card className="border-red-500">
                <CardHeader>
                    <CardTitle className="text-red-600">Delete Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-sm text-slate-600">Permanently delete your account and all associated data. This action is irreversible.</p>
                     <p className="text-xs text-slate-500">Start a support conversation so our team can verify your identity and complete the deletion.</p>
                     <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="destructive" className="flex-1" onClick={handleDeleteAccount}>Chat with Support</Button>
                        <Button variant="outline" className="flex-1" asChild>
                            <a href="mailto:support@pwru.app">Email Support</a>
                        </Button>
                     </div>
                </CardContent>
            </Card>
        </div>
    );
}