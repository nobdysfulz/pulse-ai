import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import LoadingIndicator from '../components/ui/LoadingIndicator';

export default function GoogleWorkspaceAuthConfirmation() {
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Completing Google Workspace connection...');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');
                const error = urlParams.get('error');

                if (error) {
                    setStatus('error');
                    setMessage('Authorization was denied or cancelled.');
                    if (window.opener) {
                        window.opener.postMessage('google-workspace-auth-failure', window.location.origin);
                    }
                    setTimeout(() => window.close(), 3000);
                    return;
                }

                if (!code || !state) {
                    setStatus('error');
                    setMessage('Missing authorization code or state.');
                    if (window.opener) {
                        window.opener.postMessage('google-workspace-auth-failure', window.location.origin);
                    }
                    setTimeout(() => window.close(), 3000);
                    return;
                }

                // Call the backend to complete the OAuth flow
                const { data } = await base44.functions.invoke('handleGoogleWorkspaceCallback', {
                    code,
                    state
                });

                if (data.success) {
                    setStatus('success');
                    setMessage('Google Workspace connected successfully!');
                    if (window.opener) {
                        window.opener.postMessage('google-workspace-auth-success', window.location.origin);
                    }
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Failed to complete connection.');
                    if (window.opener) {
                        window.opener.postMessage('google-workspace-auth-failure', window.location.origin);
                    }
                }

                setTimeout(() => window.close(), 2000);

            } catch (error) {
                console.error('Error in Google Workspace callback:', error);
                setStatus('error');
                setMessage('An error occurred during connection.');
                if (window.opener) {
                    window.opener.postMessage('google-workspace-auth-failure', window.location.origin);
                }
                setTimeout(() => window.close(), 3000);
            }
        };

        handleCallback();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                {status === 'processing' && <LoadingIndicator text={message} size="lg" />}
                {status === 'success' && (
                    <div>
                        <div className="text-green-600 text-6xl mb-4">✓</div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{message}</h2>
                        <p className="text-gray-600">This window will close automatically...</p>
                    </div>
                )}
                {status === 'error' && (
                    <div>
                        <div className="text-red-600 text-6xl mb-4">✗</div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{message}</h2>
                        <p className="text-gray-600">This window will close automatically...</p>
                    </div>
                )}
            </div>
        </div>
    );
}