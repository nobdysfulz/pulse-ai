import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SignIn, useUser } from '@clerk/clerk-react';

export default function Login() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, isLoaded, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SignIn 
        routing="path" 
        path="/login"
        signUpUrl="/signup"
        afterSignInUrl="/dashboard"
      />
    </div>
  );
}
