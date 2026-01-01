import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function onRequest(context) {
  try {
    const {
      request, // same as existing Worker API
      env, // same as existing Worker API
      params, // if filename includes [id] or [[path]]
      waitUntil, // same as ctx.waitUntil in existing Worker API
      next, // used for middleware or to fetch assets
      data, // arbitrary space for passing data between middlewares
    } = context
    
    // Get the response from the next handler
    const response = await next()
    
    // Clone the response to add security headers
    const newResponse = new Response(response.body, response)
    
    // Add security headers
    newResponse.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.stripe.com; " +
      "frame-src 'self' https://js.stripe.com; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'none'; " +
      "upgrade-insecure-requests;"
    )
    
    newResponse.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
    
    newResponse.headers.set('X-Frame-Options', 'DENY')
    newResponse.headers.set('X-Content-Type-Options', 'nosniff')
    newResponse.headers.set('X-XSS-Protection', '1; mode=block')
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Remove server information
    newResponse.headers.delete('Server')
    newResponse.headers.delete('X-Powered-By')
    
    return newResponse
  } catch (err) {
    // Log the error for debugging but don't expose details to client
    console.error('Middleware error:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}