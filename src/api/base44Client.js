import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion } = appParams;

// Create a client with authentication not enforced at client level
// Note: Individual pages/components should check authentication using base44.auth.me()
// This allows public pages to exist while protecting authenticated routes
// TODO: Consider implementing route guards for better security
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false
});
