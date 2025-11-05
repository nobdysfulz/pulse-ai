import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SignUp, useUser } from '@clerk/clerk-react';

export default function Signup() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/onboarding');
    }
  }, [isSignedIn, isLoaded, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SignUp 
        routing="path" 
        path="/signup"
        signInUrl="/login"
        afterSignUpUrl="/onboarding"
      />
    </div>
  );
}
