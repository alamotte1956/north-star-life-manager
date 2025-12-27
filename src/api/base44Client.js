import { createClient } from '@base44/sdk';
<<<<<<< HEAD
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6947dc1f392f53989af97bda", 
  requiresAuth: true // Ensure authentication is required for all operations
=======
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false
>>>>>>> 9de21d4d2f6ac33c914ab8fc7c4a8a81454b6d63
});
