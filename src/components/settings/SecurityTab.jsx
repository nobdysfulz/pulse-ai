import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SecurityTab() {
    const { user } = useContext(UserContext);

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            toast.success("You have been signed out.");
        } catch (error) {
            console.error("Sign out failed:", error);
            toast.error("Sign out failed. Please try again.");
        }
    };

    const handleDeleteAccount = () => {
        // For safety, we should not allow users to delete their own accounts directly.
        // This should be a support request.
        toast.info("To delete your account, please contact support through the chat widget.");
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
                <CardContent>
                     <p className="text-sm text-slate-600 mb-4">Permanently delete your account and all associated data. This action is irreversible.</p>
                     <Button variant="destructive" onClick={handleDeleteAccount}>Request Account Deletion</Button>
                </CardContent>
            </Card>
        </div>
    );
}