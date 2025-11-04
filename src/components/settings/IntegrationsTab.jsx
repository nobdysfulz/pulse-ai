
import React, { useState, useEffect, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { UserContext } from '@/components/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingIndicator, { InlineLoadingIndicator } from '../ui/LoadingIndicator';

export default function IntegrationsTab({ onUpdate, user }) {
  const { agentConfig, refreshUserData } = useContext(UserContext);
  const [isGoogleWorkspaceConnected, setIsGoogleWorkspaceConnected] = useState(false);
  const [isLoftyConnected, setIsLoftyConnected] = useState(false);
  const [isFubConnected, setIsFubConnected] = useState(false);
  const [loftyConnection, setLoftyConnection] = useState(null);
  const [fubConnection, setFubConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGoogleWorkspaceConnecting, setIsGoogleWorkspaceConnecting] = useState(false);
  const [isGoogleWorkspaceDisconnecting, setIsGoogleWorkspaceDisconnecting] = useState(false);
  const [isLoftyConnecting, setIsLoftyConnecting] = useState(false);
  const [isLoftyDisconnecting, setIsLoftyDisconnecting] = useState(false);
  const [isFubConnecting, setIsFubConnecting] = useState(false);
  const [isFubDisconnecting, setIsFubDisconnecting] = useState(false);

  // New state for additional integrations
  const [isMicrosoftConnected, setIsMicrosoftConnected] = useState(false);
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [isMicrosoftConnecting, setIsMicrosoftConnecting] = useState(false);
  const [isFacebookConnecting, setIsFacebookConnecting] = useState(false);
  const [isInstagramConnecting, setIsInstagramConnecting] = useState(false);
  const [isLinkedInConnecting, setIsLinkedInConnecting] = useState(false);
  const [isZoomConnected, setIsZoomConnected] = useState(false);
  const [isZoomConnecting, setIsZoomConnecting] = useState(false);

  // Lofty API Key states
  const [showLoftyForm, setShowLoftyForm] = useState(false);
  const [loftyApiKey, setLoftyApiKey] = useState('');
  const [showLoftyApiKey, setShowLoftyApiKey] = useState(false);

  // FUB API Key states
  const [showFubForm, setShowFubForm] = useState(false);
  const [fubApiKey, setFubApiKey] = useState('');
  const [showFubApiKey, setShowFubApiKey] = useState(false);

  // Extracted function to check external service connections
  const checkExternalServiceConnections = async () => {
    if (!user || !user.id) return;

    try {
      const { data: connections, error } = await supabase
        .from('external_service_connections')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;

      const zoomConn = (connections || []).find((c) => c.service_name === 'zoom' && c.connection_status === 'connected');
      setIsZoomConnected(!!zoomConn);

      const microsoftConn = (connections || []).find((c) => c.service_name === 'microsoft_365' && c.connection_status === 'connected');
      setIsMicrosoftConnected(!!microsoftConn);

      const facebookConn = (connections || []).find((c) => c.service_name === 'facebook' && c.connection_status === 'connected');
      setIsFacebookConnected(!!facebookConn);

      const instagramConn = (connections || []).find((c) => c.service_name === 'instagram' && c.connection_status === 'connected');
      setIsInstagramConnected(!!instagramConn);

      const linkedinConn = (connections || []).find((c) => c.service_name === 'linkedin' && c.connection_status === 'connected');
      setIsLinkedInConnected(!!linkedinConn);

      // NEW: Check for Google Workspace connection
      const googleWorkspaceConn = (connections || []).find((c) => c.service_name === 'google_workspace' && c.connection_status === 'connected');
      setIsGoogleWorkspaceConnected(!!googleWorkspaceConn);
    } catch (error) {
      console.error("Failed to load integration connections:", error);
    }
  };

  useEffect(() => {
    const loadIntegrationStatus = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      // Check Lofty connection status
      try {
        const { data: loftyConnections, error } = await supabase
          .from('crm_connections')
          .select('*')
          .eq('provider', 'lofty')
          .eq('user_id', user.id);
        
        if (error) throw error;
        if (loftyConnections && loftyConnections.length > 0) {
          setLoftyConnection(loftyConnections[0]);
          setIsLoftyConnected(loftyConnections[0].connection_status === 'connected');
        }
      } catch (error) {
        console.error("Failed to load Lofty connection status:", error);
      }

      // Check Follow Up Boss connection status
      try {
        const { data: fubConnections, error } = await supabase
          .from('crm_connections')
          .select('*')
          .eq('provider', 'follow_up_boss')
          .eq('user_id', user.id);
        
        if (error) throw error;
        if (fubConnections && fubConnections.length > 0) {
          setFubConnection(fubConnections[0]);
          setIsFubConnected(fubConnections[0].connection_status === 'connected');
        }
      } catch (error) {
        console.error("Failed to load Follow Up Boss connection status:", error);
      }

      // Check external service connections
      await checkExternalServiceConnections();

      setLoading(false);
    };

    loadIntegrationStatus();
  }, [agentConfig, user]);

  // Listen for messages from OAuth popups
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data === 'google-workspace-auth-success') {
        toast.success("Google Workspace connected successfully!");
        setIsGoogleWorkspaceConnecting(false);
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections(); // Refresh all external services to ensure Google Workspace status is updated
      } else if (event.data === 'google-workspace-auth-failure') {
        toast.error("Failed to connect Google Workspace. Please try again.");
        setIsGoogleWorkspaceConnecting(false);
      } else if (event.data === 'zoom-auth-success') {
        toast.success("Zoom connected successfully!");
        setIsZoomConnecting(false);
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections(); // Refresh all external services to ensure Zoom status is updated
      } else if (event.data === 'zoom-auth-failure') {
        toast.error("Failed to connect Zoom. Please try again.");
        setIsZoomConnecting(false);
      } else if (event.data === 'microsoft-auth-success') {
        toast.success("Microsoft 365 connected successfully!");
        setIsMicrosoftConnecting(false);
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections(); // Refresh
      } else if (event.data === 'microsoft-auth-failure') {
        toast.error("Failed to connect Microsoft 365. Please try again.");
        setIsMicrosoftConnecting(false);
      } else if (event.data === 'facebook-auth-success') {
        toast.success("Facebook connected successfully!");
        setIsFacebookConnecting(false);
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections(); // Refresh
      } else if (event.data === 'facebook-auth-failure') {
        toast.error("Failed to connect Facebook. Please try again.");
        setIsFacebookConnecting(false);
      } else if (event.data === 'instagram-auth-success') {
        toast.success("Instagram connected successfully!");
        setIsInstagramConnecting(false);
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections(); // Refresh
      } else if (event.data === 'instagram-auth-failure') {
        toast.error("Failed to connect Instagram. Please try again.");
        setIsInstagramConnecting(false);
      } else if (event.data === 'linkedin-auth-success') {
        toast.success("LinkedIn connected successfully!");
        setIsLinkedInConnecting(false);
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections(); // Refresh
      } else if (event.data === 'linkedin-auth-failure') {
        toast.error("Failed to connect LinkedIn. Please try again.");
        setIsLinkedInConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onUpdate, user]); // Added 'user' to dependencies as checkExternalServiceConnections uses user.id

  const handleConnectGoogleWorkspace = async () => {
    setIsGoogleWorkspaceConnecting(true);
    try {
      toast.info('OAuth integrations are not yet implemented');
      setIsGoogleWorkspaceConnecting(false);
      return;
      /* OAuth implementation pending
      const { data } = await supabase.functions.invoke('initiateGoogleWorkspaceOAuth');
      const popup = window.open(data.authUrl, 'googleWorkspaceAuth', 'width=600,height=700');
      */

      if (!popup || popup.closed) {
        toast.error("Popup was blocked. Please allow popups for this site.");
        setIsGoogleWorkspaceConnecting(false);
        return;
      }
    } catch (e) {
      console.error("Connect Google Workspace error:", e);
      toast.error("Could not initiate Google Workspace connection.");
      setIsGoogleWorkspaceConnecting(false);
    }
  };

  const handleDisconnectGoogleWorkspace = async () => {
    if (!user || !user.id) {
      toast.error("User information not available to disconnect Google Workspace.");
      return;
    }

    setIsGoogleWorkspaceDisconnecting(true);
    try {
      const { data: connections, error } = await supabase
        .from('external_service_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_name', 'google_workspace');
      
      if (error) throw error;

      if (connections && connections.length > 0) {
        await supabase
          .from('external_service_connections')
          .update({ connection_status: 'disconnected' })
          .eq('id', connections[0].id);
        
        setIsGoogleWorkspaceConnected(false);
        toast.success("Google Workspace has been disconnected.");
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections(); // Refresh status after disconnect
      }
    } catch (e) {
      console.error("Disconnect Google Workspace error:", e);
      toast.error("Failed to disconnect Google Workspace.");
    } finally {
      setIsGoogleWorkspaceDisconnecting(false);
    }
  };

  const handleConnectMicrosoft = async () => {
    setIsMicrosoftConnecting(true);
    try {
      const { data } = await supabase.functions.invoke('initiateMicrosoftOAuth');
      const popup = window.open(data.authUrl, 'microsoftAuth', 'width=600,height=700');

      if (!popup || popup.closed) {
        toast.error("Popup was blocked. Please allow popups for this site.");
        setIsMicrosoftConnecting(false);
        return;
      }
    } catch (e) {
      console.error("Connect Microsoft error:", e);
      toast.error("Could not initiate Microsoft 365 connection.");
      setIsMicrosoftConnecting(false);
    }
  };

  const handleDisconnectMicrosoft = async () => {
    if (!user || !user.id) {
      toast.error("User information not available to disconnect Microsoft 365.");
      return;
    }

    try {
      const { data: connections, error } = await supabase
        .from('external_service_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_name', 'microsoft_365');
      
      if (error) throw error;

      if (connections && connections.length > 0) {
        await supabase
          .from('external_service_connections')
          .update({ connection_status: 'disconnected' })
          .eq('id', connections[0].id);
        
        setIsMicrosoftConnected(false);
        toast.success("Microsoft 365 has been disconnected.");
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections();
      }
    } catch (e) {
      console.error("Disconnect Microsoft error:", e);
      toast.error("Failed to disconnect Microsoft 365.");
    }
  };

  const handleConnectFacebook = async () => {
    setIsFacebookConnecting(true);
    try {
      const { data } = await supabase.functions.invoke('initiateMetaOAuth', {
        body: { service: 'facebook' }
      });
      const popup = window.open(data.authUrl, 'facebookAuth', 'width=600,height=700');

      if (!popup || popup.closed) {
        toast.error("Popup was blocked. Please allow popups for this site.");
        setIsFacebookConnecting(false);
        return;
      }
    } catch (e) {
      console.error("Connect Facebook error:", e);
      toast.error("Could not initiate Facebook connection.");
      setIsFacebookConnecting(false);
    }
  };

  const handleDisconnectFacebook = async () => {
    if (!user || !user.id) {
      toast.error("User information not available to disconnect Facebook.");
      return;
    }

    try {
      const { data: connections, error } = await supabase
        .from('external_service_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_name', 'facebook');
      
      if (error) throw error;

      if (connections && connections.length > 0) {
        await supabase
          .from('external_service_connections')
          .update({ connection_status: 'disconnected' })
          .eq('id', connections[0].id);
        
        setIsFacebookConnected(false);
        toast.success("Facebook has been disconnected.");
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections();
      }
    } catch (e) {
      console.error("Disconnect Facebook error:", e);
      toast.error("Failed to disconnect Facebook.");
    }
  };

  const handleConnectInstagram = async () => {
    setIsInstagramConnecting(true);
    try {
      const { data } = await supabase.functions.invoke('initiateMetaOAuth', {
        body: { service: 'instagram' }
      });
      const popup = window.open(data.authUrl, 'instagramAuth', 'width=600,height=700');

      if (!popup || popup.closed) {
        toast.error("Popup was blocked. Please allow popups for this site.");
        setIsInstagramConnecting(false);
        return;
      }
    } catch (e) {
      console.error("Connect Instagram error:", e);
      toast.error("Could not initiate Instagram connection.");
      setIsInstagramConnecting(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    if (!user || !user.id) {
      toast.error("User information not available to disconnect Instagram.");
      return;
    }

    try {
      const { data: connections, error } = await supabase
        .from('external_service_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_name', 'instagram');
      
      if (error) throw error;

      if (connections && connections.length > 0) {
        await supabase
          .from('external_service_connections')
          .update({ connection_status: 'disconnected' })
          .eq('id', connections[0].id);
        
        setIsInstagramConnected(false);
        toast.success("Instagram has been disconnected.");
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections();
      }
    } catch (e) {
      console.error("Disconnect Instagram error:", e);
      toast.error("Failed to disconnect Instagram.");
    }
  };

  const handleConnectLinkedIn = async () => {
    setIsLinkedInConnecting(true);
    try {
      const { data } = await supabase.functions.invoke('initiateLinkedInOAuth');
      const popup = window.open(data.authUrl, 'linkedinAuth', 'width=600,height=700');

      if (!popup || popup.closed) {
        toast.error("Popup was blocked. Please allow popups for this site.");
        setIsLinkedInConnecting(false);
        return;
      }
    } catch (e) {
      console.error("Connect LinkedIn error:", e);
      toast.error("Could not initiate LinkedIn connection.");
      setIsLinkedInConnecting(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    if (!user || !user.id) {
      toast.error("User information not available to disconnect LinkedIn.");
      return;
    }

    try {
      const { data: connections, error } = await supabase
        .from('external_service_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_name', 'linkedin');
      
      if (error) throw error;

      if (connections && connections.length > 0) {
        await supabase
          .from('external_service_connections')
          .update({ connection_status: 'disconnected' })
          .eq('id', connections[0].id);
        
        setIsLinkedInConnected(false);
        toast.success("LinkedIn has been disconnected.");
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections();
      }
    } catch (e) {
      console.error("Disconnect LinkedIn error:", e);
      toast.error("Failed to disconnect LinkedIn.");
    }
  };

  const handleConnectZoom = async () => {
    setIsZoomConnecting(true);
    try {
      const { data } = await supabase.functions.invoke('initiateZoomOAuth');
      const popup = window.open(data.authUrl, 'zoomAuth', 'width=600,height=700');

      if (!popup || popup.closed) {
        toast.error("Popup was blocked. Please allow popups for this site.");
        setIsZoomConnecting(false);
        return;
      }
    } catch (e) {
      console.error("Connect Zoom error:", e);
      toast.error("Could not initiate Zoom connection.");
      setIsZoomConnecting(false);
    }
  };

  const handleDisconnectZoom = async () => {
    if (!user || !user.id) {
      toast.error("User information not available to disconnect Zoom.");
      return;
    }

    try {
      const { data: connections, error } = await supabase
        .from('external_service_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_name', 'zoom');
      
      if (error) throw error;

      if (connections && connections.length > 0) {
        await supabase
          .from('external_service_connections')
          .update({ connection_status: 'disconnected' })
          .eq('id', connections[0].id);
        
        setIsZoomConnected(false);
        toast.success("Zoom has been disconnected.");
        if (onUpdate) await onUpdate();
        await checkExternalServiceConnections();
      }
    } catch (e) {
      console.error("Disconnect Zoom error:", e);
      toast.error("Failed to disconnect Zoom.");
    }
  };

  const handleConnectLofty = async () => {
    if (!loftyApiKey.trim()) {
      toast.error("Please enter your Lofty API key");
      return;
    }

    setIsLoftyConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('loftyAuth', {
        body: {
          apiKey: loftyApiKey
        }
      });

      if (error) {
        toast.error("Failed to connect to Lofty CRM", { description: error.message });
        setIsLoftyConnecting(false);
        return;
      }

      if (data && data.success) {
        setIsLoftyConnected(true);
        setShowLoftyForm(false);
        setLoftyApiKey('');
        toast.success("Lofty CRM connected successfully!");

        const { data: connections } = await supabase
          .from('crm_connections')
          .select('*')
          .eq('provider', 'lofty')
          .eq('user_id', user.id);
        
        if (connections && connections.length > 0) {
          setLoftyConnection(connections[0]);
        }

        if (onUpdate) await onUpdate();
      } else {
        toast.error(data?.error || "Failed to connect to Lofty CRM");
      }
    } catch (e) {
      console.error("Lofty connection error:", e);
      toast.error("Could not connect to Lofty CRM. Please check your API key.");
    } finally {
      setIsLoftyConnecting(false);
    }
  };

  const handleDisconnectLofty = async () => {
    if (!user || !user.id) {
      toast.error("User information not available");
      return;
    }

    setIsLoftyDisconnecting(true);
    try {
      const { data: connections, error } = await supabase
        .from('crm_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'lofty');
      
      if (error) throw error;

      if (connections && connections.length > 0) {
        await supabase
          .from('crm_connections')
          .update({ connection_status: 'disconnected' })
          .eq('id', connections[0].id);
        
        setIsLoftyConnected(false);
        setLoftyConnection(null);
        toast.success("Lofty CRM has been disconnected.");
        if (onUpdate) await onUpdate();
      }
    } catch (e) {
      console.error("Disconnect Lofty error:", e);
      toast.error("Failed to disconnect Lofty CRM.");
    } finally {
      setIsLoftyDisconnecting(false);
    }
  };

  const handleConnectFub = async () => {
    if (!fubApiKey.trim()) {
      toast.error("Please enter your Follow Up Boss API key");
      return;
    }

    setIsFubConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('followUpBossAuth', {
        body: {
          action: 'connect',
          apiKey: fubApiKey
        }
      });

      if (error) {
        toast.error("Failed to connect to Follow Up Boss", { description: error.message });
        return;
      }

      if (data?.success) {
        setIsFubConnected(true);
        setShowFubForm(false);
        setFubApiKey('');
        toast.success("Follow Up Boss connected successfully!");

        const { data: connections } = await supabase
          .from('crm_connections')
          .select('*')
          .eq('provider', 'follow_up_boss')
          .eq('user_id', user.id);

        if (connections && connections.length > 0) {
          setFubConnection(connections[0]);
        }

        if (onUpdate) await onUpdate();
      } else {
        toast.error(data?.error || "Failed to connect to Follow Up Boss");
      }
    } catch (e) {
      console.error("Follow Up Boss connection error:", e);
      toast.error("Could not connect to Follow Up Boss. Please check your API key.");
    } finally {
      setIsFubConnecting(false);
    }
  };

  const handleDisconnectFub = async () => {
    setIsFubDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('followUpBossAuth', {
        body: { action: 'disconnect' }
      });

      if (error) {
        throw error;
      }

      setIsFubConnected(false);
      setFubConnection(null);
      toast.success(data?.message || "Follow Up Boss has been disconnected.");

      if (onUpdate) await onUpdate();
    } catch (e) {
      toast.error("Failed to disconnect Follow Up Boss.");
    } finally {
      setIsFubDisconnecting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><LoadingIndicator text="Loading integrations..." size="md" /></div>;
  }

  if (!user) {
    return (
      <Card className="border-0 bg-white">
        <CardContent className="p-6">
          <p className="text-[#64748B]">Loading user information...</p>
        </CardContent>
      </Card>);

  }

  return (
    <Card className="border-0 bg-white">
            <CardHeader>
                <CardTitle className="font-semibold tracking-tight text-lg flex items-center gap-2">Integrations</CardTitle>
                <CardDescription>
                    Connect your favorite tools to supercharge your workflow. <a href="https://pwru.app/policies/privacypolicy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">How Your Information Is Used</a>
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
                {/* Email & Productivity */}
                <div className="border-b pb-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">Email & Productivity</h3>
                    
                    {/* Google Workspace */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-white mb-3">
                        <div className="flex items-center gap-4">
                            <img src="/images/integrations/google-workspace.png" alt="Google Workspace" className="w-8 h-8" />
                            <div>
                                <h3 className="font-semibold">Google Workspace</h3>
                                <p className="text-sm text-slate-500">Send emails, schedule meetings, create documents, manage calendar</p>
                            </div>
                        </div>
                        {isGoogleWorkspaceConnected ?
            <div className="flex items-center gap-2">
                                 <span className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" /> Connected
                                 </span>
                                 <Button variant="outline" size="sm" onClick={handleDisconnectGoogleWorkspace} disabled={isGoogleWorkspaceDisconnecting}>
                                    {isGoogleWorkspaceDisconnecting ? <InlineLoadingIndicator text="Disconnecting" /> : 'Disconnect'}
                                </Button>
                            </div> :
            <Button onClick={handleConnectGoogleWorkspace} disabled={isGoogleWorkspaceConnecting} className="bg-blue-600 hover:bg-blue-700">
                                {isGoogleWorkspaceConnecting ? <InlineLoadingIndicator text="" /> : null}
                                Connect
                            </Button>
            }
                    </div>

                    {/* Microsoft 365 */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex items-center gap-4">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png" alt="Microsoft 365" className="w-8 h-8" />
                            <div>
                                <h3 className="font-semibold">Microsoft 365</h3>
                                <p className="text-sm text-slate-500">Send emails, schedule meetings, create documents, manage calendar</p>
                            </div>
                        </div>
                        {isMicrosoftConnected ?
            <div className="flex items-center gap-2">
                                 <span className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" /> Connected
                                 </span>
                                 <Button variant="outline" size="sm" onClick={handleDisconnectMicrosoft}>
                                    Disconnect
                                </Button>
                            </div> :
            <Button onClick={handleConnectMicrosoft} disabled={isMicrosoftConnecting} className="bg-blue-600 hover:bg-blue-700">
                                {isMicrosoftConnecting ? <InlineLoadingIndicator text="" /> : null}
                                Connect
                            </Button>
            }
                    </div>
                </div>

                {/* Video Conferencing */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3">Video Conferencing</h3>
                  
                  {/* Zoom */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                    <div className="flex items-center gap-4">
                      <img src="/images/integrations/zoom.png" alt="Zoom" className="w-8 h-8" />
                      <div>
                        <h3 className="font-semibold">Zoom</h3>
                        <p className="text-sm text-slate-500">Join meetings for notes, auto-create meeting links</p>
                      </div>
                    </div>
                    {isZoomConnected ?
            <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" /> Connected
                        </span>
                        <Button variant="outline" size="sm" onClick={handleDisconnectZoom}>
                          Disconnect
                        </Button>
                      </div> :

            <Button onClick={handleConnectZoom} disabled={isZoomConnecting} className="bg-blue-600 hover:bg-blue-700">
                        {isZoomConnecting ? <InlineLoadingIndicator text="" /> : null}
                        Connect
                      </Button>
            }
                  </div>
                </div>

                {/* Social Media */}
                <div className="border-b pb-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">Social Media</h3>
                    
                    {/* Facebook */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-white mb-3">
                        <div className="flex items-center gap-4">
                            <img src="/images/integrations/facebook.png" alt="Facebook" className="w-8 h-8" />
                            <div>
                                <h3 className="font-semibold">Facebook</h3>
                                <p className="text-sm text-slate-500">Auto-post content, schedule posts, analyze performance</p>
                            </div>
                        </div>
                        {isFacebookConnected ?
            <div className="flex items-center gap-2">
                                 <span className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" /> Connected
                                 </span>
                                 <Button variant="outline" size="sm" onClick={handleDisconnectFacebook}>
                                    Disconnect
                                </Button>
                            </div> :
            <Button onClick={handleConnectFacebook} disabled={isFacebookConnecting} className="bg-blue-600 hover:bg-blue-700">
                                {isFacebookConnecting ? <InlineLoadingIndicator text="" /> : null}
                                Connect
                            </Button>
            }
                    </div>

                    {/* Instagram */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-white mb-3">
                        <div className="flex items-center gap-4">
                            <img src="/images/integrations/instagram.png" alt="Instagram" className="w-8 h-8" />
                            <div>
                                <h3 className="font-semibold">Instagram</h3>
                                <p className="text-sm text-slate-500">Auto-post content, schedule posts, analyze engagement</p>
                            </div>
                        </div>
                        {isInstagramConnected ?
            <div className="flex items-center gap-2">
                                 <span className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" /> Connected
                                 </span>
                                 <Button variant="outline" size="sm" onClick={handleDisconnectInstagram}>
                                    Disconnect
                                </Button>
                            </div> :
            <Button onClick={handleConnectInstagram} disabled={isInstagramConnecting} className="bg-blue-600 hover:bg-blue-700">
                                {isInstagramConnecting ? <InlineLoadingIndicator text="" /> : null}
                                Connect
                            </Button>
            }
                    </div>

                    {/* LinkedIn */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex items-center gap-4">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" className="w-8 h-8" />
                            <div>
                                <h3 className="font-semibold">LinkedIn</h3>
                                <p className="text-sm text-slate-500">Auto-post professional content, schedule articles</p>
                            </div>
                        </div>
                        {isLinkedInConnected ?
            <div className="flex items-center gap-2">
                                 <span className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" /> Connected
                                 </span>
                                 <Button variant="outline" size="sm" onClick={handleDisconnectLinkedIn}>
                                    Disconnect
                                </Button>
                            </div> :
            <Button onClick={handleConnectLinkedIn} disabled={isLinkedInConnecting} className="bg-blue-600 hover:bg-blue-700">
                                {isLinkedInConnecting ? <InlineLoadingIndicator text="" /> : null}
                                Connect
                            </Button>
            }
                    </div>
                </div>

                {/* CRM */}
                <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">CRM</h3>
                    
                    {/* Lofty */}
                    <div className="p-4 border rounded-lg bg-white mb-3">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <img src="/images/integrations/lofty.png" alt="Lofty Logo" className="w-8 h-8" />
                                <div>
                                    <h3 className="font-semibold">Lofty CRM</h3>
                                    <p className="text-sm text-slate-500">Auto-log calls, sync lead data, update deal status</p>
                                </div>
                            </div>
                            {isLoftyConnected ?
              <div className="flex items-center gap-2">
                                     <span className="flex items-center gap-1 text-sm text-green-600">
                                        <CheckCircle className="w-4 h-4" /> Connected
                                     </span>
                                     <Button variant="outline" size="sm" onClick={handleDisconnectLofty} disabled={isLoftyDisconnecting}>
                                        {isLoftyDisconnecting ? <InlineLoadingIndicator text="Disconnecting" /> : 'Disconnect'}
                                    </Button>
                                </div> :
              <Button onClick={() => setShowLoftyForm(!showLoftyForm)} className="bg-blue-600 hover:bg-blue-700">
                                    Connect
                                </Button>
              }
                        </div>

                        {showLoftyForm && !isLoftyConnected &&
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="lofty-api-key" className="text-sm font-semibold">Lofty API Key</Label>
                                        <div className="relative mt-1">
                                            <Input
                      id="lofty-api-key"
                      type={showLoftyApiKey ? "text" : "password"}
                      value={loftyApiKey}
                      onChange={(e) => setLoftyApiKey(e.target.value)}
                      placeholder="Enter your Lofty API key"
                      className="pr-10" />

                                            <button
                      type="button"
                      onClick={() => setShowLoftyApiKey(!showLoftyApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">

                                                {showLoftyApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Get your API key from Lofty Settings → Integrations → API Access.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                    onClick={handleConnectLofty}
                    disabled={isLoftyConnecting || !loftyApiKey.trim()}
                    className="bg-blue-600 hover:bg-blue-700">

                                            {isLoftyConnecting ? <InlineLoadingIndicator text="" /> : null}
                                            Connect Lofty
                                        </Button>
                                        <Button
                    variant="outline"
                    onClick={() => {
                      setShowLoftyForm(false);
                      setLoftyApiKey('');
                    }}>

                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
            }
                    </div>

                    {/* Follow Up Boss */}
                    <div className="p-4 border rounded-lg bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <img src="/images/integrations/followupboss.png" alt="Follow Up Boss Logo" className="w-8 h-8" />
                                <div>
                                    <h3 className="font-semibold">Follow Up Boss</h3>
                                    <p className="text-sm text-slate-500">Auto-log calls, sync lead data, update deal status</p>
                                </div>
                            </div>
                            {isFubConnected ?
              <div className="flex items-center gap-2">
                                     <span className="flex items-center gap-1 text-sm text-green-600">
                                        <CheckCircle className="w-4 h-4" /> Connected
                                     </span>
                                     <Button variant="outline" size="sm" onClick={handleDisconnectFub} disabled={isFubDisconnecting}>
                                        {isFubDisconnecting ? <InlineLoadingIndicator text="Disconnecting" /> : 'Disconnect'}
                                    </Button>
                                </div> :
              <Button onClick={() => setShowFubForm(!showFubForm)} className="bg-blue-600 hover:bg-blue-700">
                                    Connect
                                </Button>
              }
                        </div>

                        {showFubForm && !isFubConnected &&
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="fub-api-key" className="text-sm font-semibold">Follow Up Boss API Key</Label>
                                        <div className="relative mt-1">
                                            <Input
                      id="fub-api-key"
                      type={showFubApiKey ? "text" : "password"}
                      value={fubApiKey}
                      onChange={(e) => setFubApiKey(e.target.value)}
                      placeholder="Enter your Follow Up Boss API key"
                      className="pr-10" />

                                            <button
                      type="button"
                      onClick={() => setShowFubApiKey(!showFubApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">

                                                {showFubApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Get your API key from Follow Up Boss Settings → API Keys.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                    onClick={handleConnectFub}
                    disabled={isFubConnecting || !fubApiKey.trim()}
                    className="bg-blue-600 hover:bg-blue-700">

                                            {isFubConnecting ? <InlineLoadingIndicator text="" /> : null}
                                            Connect Follow Up Boss
                                        </Button>
                                        <Button
                    variant="outline"
                    onClick={() => {
                      setShowFubForm(false);
                      setFubApiKey('');
                    }}>

                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
            }
                    </div>
                </div>
            </CardContent>
        </Card>);

}
