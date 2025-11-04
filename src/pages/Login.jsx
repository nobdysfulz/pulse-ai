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
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-title mb-2">Welcome Back</h1>
            <p className="text-text-body">Sign in to your account</p>
          </div>

          <SignIn 
            routing="path" 
            path="/login"
            signUpUrl="/signup"
            afterSignInUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none bg-transparent"
              }
            }}
          />

          <div className="mt-6 text-center">
            <p className="text-sm text-text-body">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
