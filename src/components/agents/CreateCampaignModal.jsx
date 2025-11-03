
import React, { useState, useContext, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select';
import { Loader2, Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserContext } from '../context/UserContext';

const callTypes = [
    'New Buyer Lead', 
    'New Seller Lead', 
    'Expired Listing', 
    'For Sale By Owner'
];

export default function CreateCampaignModal({ isOpen, onClose, onCampaignStarted }) {
    const { user, marketConfig } = useContext(UserContext);
    const [campaignName, setCampaignName] = useState('');
    const [callType, setCallType] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
        } else {
            toast.warning('Please upload a valid .csv file.');
        }
    };
    
    const handleDownloadTemplate = async () => {
        try {
            const { data } = await supabase.functions.invoke('downloadCampaignTemplate', { body: {} });

            if (data.downloadUrl) {
                // If a signed URL is provided, open it to trigger download
                window.open(data.downloadUrl, '_blank');
            } else if (data.fallbackContent) {
                // If fallback content is provided, create a blob and download it
                const blob = new Blob([data.fallbackContent], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = "PULSE_campaign_template.csv";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                 throw new Error("Invalid response from server.");
            }
        } catch (error) {
            console.error("Error downloading template:", error);
            toast.error("Could not download template. Please try again.");
        }
    };
    
    const parseCSV = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          const lines = text.split(/\r\n|\n/);
          if (lines.length < 2) {
              reject(new Error("CSV must contain a header row and at least one data row."));
              return;
          }
          const headers = lines[0].split(',').map(h => h.trim());
          const contacts = lines.slice(1).map(line => {
            const values = line.split(',');
            if (values.length < headers.length) return null; // Skip empty or malformed lines
            const contact = {};
            headers.forEach((header, index) => {
                const key = header.replace(/\s+/g, '_'); // normalize header
                contact[key] = values[index]?.trim() || '';
            });
            return contact;
          }).filter(Boolean); // Filter out null values
          resolve(contacts);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
      });
    };

    const handleCreateCampaign = async () => {
        if (!campaignName || !callType || !file) {
            toast.warning('Please fill all fields and upload a CSV file.');
            return;
        }
        setIsSubmitting(true);
        try {
            const contacts = await parseCSV(file);
            
            if (!contacts || contacts.length === 0) {
                 toast.error("No valid contacts found in the CSV file.", { description: "Please ensure your CSV is formatted correctly and contains contact data."});
                 setIsSubmitting(false);
                 return;
            }

            const agentData = {
                agent_name: user?.firstName,
                agent_last_name: user?.lastName,
                agent_full_name: user?.full_name,
                brokerage: user?.brokerage,
                area: marketConfig?.primaryTerritory,
                agent_phone: user?.phone
            };

            const { data } = await supabase.functions.invoke('sendContactsToElevenLabs', { body: { contacts, callType, agentData, campaignName } });

            if (data.requiresOnboarding) {
                 toast.error("AI Agent Setup Incomplete", { description: data.error });
            } else {
                 toast.success(`Campaign "${campaignName}" started successfully!`, { description: `${contacts.length} contacts are being called.`});
                 onCampaignStarted();
                 onClose();
            }

        } catch (error) {
            console.error('Error starting campaign:', error);
            const errorMessage = error.response?.data?.error || "Failed to start campaign.";
            toast.error("Campaign Failed", { description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Call Campaign</DialogTitle>
                    <DialogDescription>Upload a list of contacts to start an automated call campaign.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input id="campaign-name" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. 'Expired Listings Q4'" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="call-type">Call Type</Label>
                        <Select onValueChange={setCallType} value={callType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a call type..." />
                            </SelectTrigger>
                            <SelectContent>
                                {callTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Upload Contact List (.csv)</Label>
                        <div 
                            className="flex items-center justify-center w-full p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {file ? (
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <FileText className="w-4 h-4" />
                                    <span>{file.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-2"><X className="w-4 h-4"/></button>
                                </div>
                            ) : (
                                <div className="text-center text-slate-500">
                                    <Upload className="mx-auto w-8 h-8 mb-2"/>
                                    <p className="text-sm">Click to upload or drag & drop</p>
                                </div>
                            )}
                        </div>
                        <Input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                         <Button variant="link" size="sm" onClick={handleDownloadTemplate} className="p-0 h-auto text-xs">Download CSV Template</Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCreateCampaign} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Start Campaign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
