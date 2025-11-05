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
 * Alternative: Decode and validate JWT manually using Jose library
 * This is a backup approach if Clerk API verification has issues
 */
export async function validateClerkTokenWithJose(token: string): Promise<string> {
  try {
    const CLERK_SECRET_KEY = Deno.env.get('CLERK_SECRET_KEY');
    
    if (!CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY not configured');
    }

    // Import jose for JWT verification
    const { jwtVerify, createRemoteJWKSet } = await import('https://deno.land/x/jose@v5.2.0/index.ts');
    
    // Clerk uses RSA keys - fetch JWKS from Clerk
    const JWKS = createRemoteJWKSet(new URL('https://api.clerk.com/v1/jwks'));
    
    // Verify the JWT
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'https://clerk.com',
    });

    const userId = payload.sub;
    
    if (!userId) {
      throw new Error('No sub claim in JWT');
    }

    console.log('[clerkAuth] ✓ Token validated (jose) for user:', userId);
    return userId;

  } catch (error) {
    console.error('[clerkAuth] Jose validation error:', error);
    throw new Error(
      error instanceof Error 
        ? `JWT validation failed: ${error.message}` 
        : 'JWT validation failed'
    );
  }
}
