
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Trash2, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const DetailItem = ({ label, value }) => (
  <div>
    <label className="text-xs text-[#64748B]">{label}</label>
    <p className="text-sm text-[#1E293B] font-normal">{value || 'N/A'}</p>
  </div>
);

export default function CallDetailSidebar({ log, onBack, onDelete }) {
  const [activeTab, setActiveTab] = useState('details');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const transcript = useMemo(() => {
    // 1. Try `log.transcript` first
    if (log.transcript) {
        try {
            const parsed = JSON.parse(log.transcript);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            console.warn("Could not parse log.transcript", e);
        }
    }

    // 2. Fallback to checking `log.metadata`
    if (log.metadata) {
        try {
            const metadata = JSON.parse(log.metadata);
            // Check for transcript within raw webhook data nested in metadata
            const rawData = metadata.elevenlabs_transcription_raw_webhook_data || metadata.raw_webhook_data;
            const nestedTranscript = rawData?.data?.transcript;

            if (Array.isArray(nestedTranscript) && nestedTranscript.length > 0) {
                return nestedTranscript;
            }
        } catch(e) {
            console.warn("Could not parse transcript from log.metadata", e);
        }
    }
    
    // 3. Return empty array if not found
    return [];
  }, [log.transcript, log.metadata]);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (log.analysis) {
          try {
            setAnalysis(JSON.parse(log.analysis));
          } catch {setAnalysis({ error: "Could not parse analysis JSON." });}
        }
        if (log.formData) {
          try {
            const parsedData = JSON.parse(log.formData);
            // Handle different possible keys for address
            const address = parsedData.property_address || parsedData.address || parsedData.meetingAddress;
            setFormData({ ...parsedData, address });
          } catch {setFormData({ error: "Could not parse form data." });}
        }

        if (log.recordingUrl) {
          setAudioLoading(true);
          try {
            const { data } = await base44.functions.invoke('getSignedAudioUrl', { file_uri: log.recordingUrl });
            if (data.signed_url) {
              setAudioUrl(data.signed_url);
            }
          } catch (e) {
            console.error("Failed to get signed audio URL", e);
            setAudioUrl(null);
          } finally {
            setAudioLoading(false);
          }
        }

      } catch (e) {
        console.error("Error fetching details", e);
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
        if (log.contactPhone) {
            setHistoryLoading(true);
            try {
                const historyLogs = await base44.entities.CallLog.filter({ contactPhone: log.contactPhone }, '-created_date');
                setHistory(historyLogs);
            } catch (e) {
                console.error("Failed to fetch call history", e);
                setHistory([]);
            } finally {
                setHistoryLoading(false);
            }
        }
    };

    fetchDetails();
    fetchHistory();
  }, [log]);

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '0m 0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const handleDelete = async () => {
    try {
      const { CallLog } = await import('@/api/entities');
      await CallLog.delete(log.id);
      toast.success("Call log deleted.");
      onDelete();
      if (onBack) onBack();
    } catch (e) {
      toast.error("Failed to delete call log.");
      console.error(e);
    }
  };
  
  const downloadTranscript = () => {
    if (!transcript || transcript.length === 0) {
      toast.error("No transcript available to download.");
      return;
    }
    
    let transcriptText = `Call Transcript\n`;
    transcriptText += `Contact: ${log.prospectFirstName || 'Unknown'} ${log.prospectLastName || ''}\n`;
    transcriptText += `Date: ${format(new Date(log.created_date), 'yyyy-MM-dd hh:mm a')}\n\n`;
    
    transcript.forEach(item => {
      const speaker = item.role === 'user' ? (log.prospectFirstName || 'Client') : 'Agent';
      transcriptText += `${speaker}:\n${item.message}\n\n`;
    });
    
    const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transcript_${log.id}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transcript downloaded.");
  };

  const renderDetailsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[#1E293B] mb-3">Prospect Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="First Name" value={log.prospectFirstName} />
          <DetailItem label="Last Name" value={log.prospectLastName} />
          <DetailItem label="Phone Number" value={log.contactPhone} />
          <DetailItem label="Email" value={formData.email} />
          <DetailItem label="Property Address" value={formData.address} />
          <DetailItem label="Active Buyer" value={formData.activeBuyer ? 'Yes' : 'No'} />
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold text-[#1E293B] mb-3">Call Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Duration" value={formatDuration(log.duration)} />
          <DetailItem label="Call Type" value={formData.call_type || 'N/A'} />
          <DetailItem label="Source" value={formData.lead_source || formData.source || (log.campaignName === 'Single Call' ? 'Single Call' : 'CSV Upload')} />
        </div>
      </div>
       {log.status === 'appointment_set' &&
    <div>
          <h3 className="text-base font-semibold text-[#1E293B] mb-3">Appointment Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Date" value={analysis?.appointmentDate} />
            <DetailItem label="Time" value={analysis?.appointmentTime} />
            <DetailItem label="Location" value={analysis?.appointmentLocation || 'Virtual'} />
          </div>
        </div>
    }
    </div>
  );

  const renderTranscriptTab = () => {
    return (
      <div className="space-y-4">
         <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-[#1E293B]">Conversation Transcript</h3>
            <Button variant="ghost" size="icon" onClick={downloadTranscript}><Download className="w-4 h-4 text-[#475569]" /></Button>
         </div>
         <div className="space-y-3 text-sm max-h-[500px] overflow-y-auto pr-2">
          {transcript.length > 0 ? transcript.map((item, index) =>
          <div key={index} className="flex flex-col">
              <span className="font-semibold capitalize text-[#64748B] text-xs mb-1">{item.role === 'user' ? (log.prospectFirstName || 'Client') : 'Agent'}</span>
              <p className="p-3 rounded-lg bg-gray-50 text-gray-800">{item.message}</p>
            </div>
          ) : <p className="text-center text-xs text-gray-500 py-4">No transcript available for this call.</p>}
        </div>
      </div>);

  };

  const renderRecordingTab = () =>
  <div className="space-y-4">
      <h3 className="text-base font-semibold text-[#1E293B]">Call Recording</h3>
      {audioLoading ?
    <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading recording...
        </div> :
    audioUrl ?
    <audio controls className="w-full h-10" src={audioUrl} /> :

    <p className="text-sm text-gray-500">No recording available for this call.</p>
    }
    </div>;


  const renderHistoryTab = () => {
      if (historyLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" /></div>;
      }
      if (history.length <= 1) { // Show message if only the current call exists
          return (
              <div className="text-center py-10">
                  <p className="mt-4 text-sm text-gray-500">No other calls found for this contact.</p>
              </div>
          );
      }
      return (
        <div className="space-y-3">
             {history.map(call => (
                <div key={call.id} className="border p-3 rounded-lg bg-gray-50 text-sm">
                    <p className="font-medium text-gray-800">{format(new Date(call.created_date), 'MMM dd, yyyy - hh:mm a')}</p>
                    <p className="text-xs text-gray-600 capitalize">Status: {call.status?.replace(/_/g, ' ') || 'N/A'}</p>
                    <p className="text-xs text-gray-600">Duration: {formatDuration(call.duration)}</p>
                </div>
            ))}
        </div>
      );
  }


  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" /></div>;
  }

  const getStatusBadge = (status) => {
     switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'appointment_set': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-[#1E293B]">{log.prospectFirstName} {log.prospectLastName}</h2>
          <Badge className={`${getStatusBadge(log.status)} mt-1`}>{log.status?.replace(/_/g, ' ')}</Badge>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-6 text-sm">
        <button onClick={() => setActiveTab('details')} className={`pb-2 border-b-2 ${activeTab === 'details' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-[#64748B]'}`}>Details</button>
        <button onClick={() => setActiveTab('transcript')} className={`pb-2 border-b-2 ${activeTab === 'transcript' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-[#64748B]'}`}>Transcript</button>
        <button onClick={() => setActiveTab('recording')} className={`pb-2 border-b-2 ${activeTab === 'recording' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-[#64748B]'}`}>Recording</button>
        <button onClick={() => setActiveTab('history')} className={`pb-2 border-b-2 ${activeTab === 'history' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-[#64748B]'}`}>History</button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 mb-6">
        {activeTab === 'details' && renderDetailsTab()}
        {activeTab === 'transcript' && renderTranscriptTab()}
        {activeTab === 'recording' && renderRecordingTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>

      <div className="mt-auto pt-6 border-t border-gray-200">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive-outline" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" /> Delete Call Log
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the call log and its recording. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
