import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function SsoLoginPage() {
    const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
    const [message, setMessage] = useState('Authenticating...');
    const navigate = useNavigate();

    useEffect(() => {
        const handleSSOLogin = async () => {
            try {
                // Get token from URL
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');

                if (!token) {
                    setStatus('error');
                    setMessage('No authentication token provided');
                    return;
                }

                setMessage('Validating your credentials...');

                // Validate token with backend
                const response = await supabase.functions.invoke('consumeSSOToken', { body: { token } });

                if (response.data.success) {
                    setStatus('success');
                    setMessage('Authentication successful! Redirecting...');
                    
                    // The backend has validated the user, now we need to trigger Base44's auth
                    // We'll use the email to login
                    const { email } = response.data;
                    
                    // Since Base44 handles auth, we need to programmatically log them in
                    // This will depend on how Base44 auth works - may need to call base44.auth method
                    // For now, redirect to dashboard and let Base44's auth handle it
                    
                    toast.success('Welcome! Redirecting to your dashboard...');
                    
                    setTimeout(() => {
                        window.location.href = createPageUrl('Dashboard');
                    }, 1000);
                } else {
                    setStatus('error');
                    setMessage(response.data.error || 'Authentication failed');
                    toast.error(response.data.error || 'Authentication failed');
                }

            } catch (error) {
                console.error('SSO Login Error:', error);
                setStatus('error');
                setMessage('An error occurred during authentication');
                toast.error('Authentication failed. Please try again.');
            }
        };

        handleSSOLogin();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                {status === 'processing' && (
                    <>
                        <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Signing you in...</h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <button
                            onClick={() => window.location.href = 'https://app.pwru.app'}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Return to Home
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}