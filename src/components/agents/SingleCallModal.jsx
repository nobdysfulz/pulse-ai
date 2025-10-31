
import React, { useState, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserContext } from '../context/UserContext';

const callTypes = [
    'New Buyer Lead', 
    'New Seller Lead', 
    'Expired Listing', 
    'For Sale By Owner'
];

const addressRequiredTypes = ['New Seller Lead', 'Expired Listing', 'For Sale By Owner'];

export default function SingleCallModal({ isOpen, onClose, onCallStarted }) {
    const { user, marketConfig } = useContext(UserContext);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [callType, setCallType] = useState('');
    const [address, setAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const validatePhoneNumber = (fullPhone) => {
        // Must start with +1 and be followed by 10 digits
        const phoneRegex = /^\+1\d{10}$/;
        return phoneRegex.test(fullPhone);
    };

    const handleStartCall = async () => {
        const fullPhoneNumber = `+1${phone}`;

        if (!firstName || !phone || !callType) {
            toast.warning('Please provide a first name, phone number, and call type.');
            return;
        }

        if (addressRequiredTypes.includes(callType) && !address) {
            toast.warning("Prospect's address is required for this call type.");
            return;
        }

        if (!validatePhoneNumber(fullPhoneNumber)) {
            toast.error('Invalid Phone Number', { description: 'Please enter a valid 10-digit phone number.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const contacts = [{ 
                firstName, 
                lastName, 
                phone: fullPhoneNumber,
                address: addressRequiredTypes.includes(callType) ? address : undefined
            }];

            const agentData = {
                agent_name: user?.firstName,
                agent_last_name: user?.lastName,
                agent_full_name: user?.full_name,
                brokerage: user?.brokerage,
                area: marketConfig?.primaryTerritory,
                agent_phone: user?.phone
            };

            // TODO: Implement ElevenLabs call initiation
            toast.info('Call initiation feature coming soon!');
            onCallStarted();
            onClose();

        } catch (error) {
            console.error('Error starting single call:', error);
            const errorMessage = error.response?.data?.error || "Failed to initiate call.";
            toast.error("Call Failed", { description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleClose = () => {
        // Reset form on close
        setFirstName('');
        setLastName('');
        setPhone('');
        setCallType('');
        setAddress('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Start a Single Call</DialogTitle>
                    <DialogDescription>Enter a contact's details to initiate a call immediately.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first-name">First Name</Label>
                            <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last-name">Last Name</Label>
                            <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                         <div className="flex h-10 w-full items-center rounded-md border border-border bg-surface px-3 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            <span className="text-text-body mr-1">+1</span>
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => {
                                    const cleaned = e.target.value.replace(/\D/g, '');
                                    if (cleaned.length <= 10) {
                                        setPhone(cleaned);
                                    }
                                }}
                                placeholder="5551234567"
                                className="flex h-10 w-full rounded-md border-input bg-transparent py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-0 p-0 pl-1"
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="call-type-single">Call Type</Label>
                        <Select onValueChange={setCallType} value={callType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a call type..." />
                            </SelectTrigger>
                            <SelectContent>
                                {callTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {addressRequiredTypes.includes(callType) && (
                        <div className="space-y-2">
                            <Label htmlFor="address">Prospect's Address</Label>
                            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Anytown, USA" />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleStartCall} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Start Call'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
