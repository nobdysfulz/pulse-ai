import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68a795970202102129f19983", 
  requiresAuth: true // Ensure authentication is required for all operations
});
