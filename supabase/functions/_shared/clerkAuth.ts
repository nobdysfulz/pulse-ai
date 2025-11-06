/**
 * Clerk JWT validation helper for edge functions
 * This replaces unsafe JWT decoding with proper verification
 */

interface ClerkJWTPayload {
  sub: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

/**
 * Validates a Clerk JWT token and returns the user ID
 * @param token - The JWT token from Authorization header
 * @returns The validated user ID (sub claim)
 * @throws Error if token is invalid or expired
 */
export async function validateClerkToken(token: string): Promise<string> {
  try {
    const CLERK_SECRET_KEY = Deno.env.get('CLERK_SECRET_KEY');
    
    if (!CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY not configured');
    }

    // Verify JWT using Clerk's verification endpoint
    const response = await fetch('https://api.clerk.com/v1/sessions/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[clerkAuth] Verification failed:', errorText);
      throw new Error(`JWT verification failed: ${response.status}`);
    }

    const data = await response.json();
    const userId = data.user_id;

    if (!userId) {
      throw new Error('No user_id in verified token');
    }

    console.log('[clerkAuth] ✓ Token validated for user:', userId);
    return userId;

  } catch (error) {
    console.error('[clerkAuth] Validation error:', error);
    throw new Error(
      error instanceof Error 
        ? `JWT validation failed: ${error.message}` 
        : 'JWT validation failed'
    );
  }
}

/**
 * Validate JWT using Jose with RSA256 and Clerk's JWKS endpoint
 * This is the correct validation method for Clerk JWTs
 */
export async function validateClerkTokenWithJose(token: string): Promise<string> {
  try {
    const CLERK_PUBLISHABLE_KEY = Deno.env.get('VITE_CLERK_PUBLISHABLE_KEY');
    
    if (!CLERK_PUBLISHABLE_KEY) {
      throw new Error('VITE_CLERK_PUBLISHABLE_KEY environment variable is required');
    }

    // Extract frontend API domain from publishable key
    // Format: pk_test_<base64_encoded_domain> or pk_live_<base64_encoded_domain>
    const keyParts = CLERK_PUBLISHABLE_KEY.split('_');
    if (keyParts.length < 3) {
      throw new Error('Invalid CLERK_PUBLISHABLE_KEY format');
    }
    
    // Decode the base64 domain
    const base64Domain = keyParts.slice(2).join('_');
    const domainBytes = Uint8Array.from(atob(base64Domain), c => c.charCodeAt(0));
    const frontendApi = new TextDecoder().decode(domainBytes);
    
    const jwksUrl = `https://${frontendApi}/.well-known/jwks.json`;
    
    console.log('🔐 DEBUG - Frontend API:', frontendApi);
    console.log('🔐 DEBUG - JWKS URL:', jwksUrl);
    console.log('🔐 DEBUG - Token being validated:', token.substring(0, 50) + '...');

    // Import jose for JWT verification
    const { jwtVerify, createRemoteJWKSet } = await import('https://deno.land/x/jose@v5.2.0/index.ts');
    
    // Create JWKS getter that fetches Clerk's public keys
    const JWKS = createRemoteJWKSet(new URL(jwksUrl));
    
    // Verify JWT using RSA256 (Clerk's algorithm)
    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ['RS256'],
    });

    const userId = payload.sub;
    
    if (!userId) {
      throw new Error('No sub claim in JWT');
    }

    console.log('[clerkAuth] ✓ Token validated (RSA256) for user:', userId);
    return userId;

  } catch (error) {
    console.error('[clerkAuth] JWT validation failed:', error);
    throw new Error(
      error instanceof Error 
        ? `JWT validation failed: ${error.message}` 
        : 'JWT validation failed'
    );
  }
}
