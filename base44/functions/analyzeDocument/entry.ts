// === Helper Functions for Security ===

// In-memory rate limiter storage
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

/**
 * Checks if the IP address is rate limited.
 * Allows max 10 requests per 60 seconds.
 * @param ip Client IP address
 * @returns true if rate limited, false otherwise
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 60 seconds
  const maxCount = 10;

  const record = rateLimitMap.get(ip);
  if (!record) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (now - record.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return false;
  }

  record.count++;
  if (record.count > maxCount) {
    return true;
  }

  rateLimitMap.set(ip, record);
  return false;
}

/**
 * Validates URL to prevent SSRF.
 * @param urlString URL string to validate
 * @returns true if valid and safe, false otherwise
 */
function validateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Enforce HTTPS
    if (url.protocol !== "https:") {
      return false;
    }

    // Block known local/internal hostnames
    const hostname = url.hostname;
    if (
      hostname === "localhost" ||
      hostname.endsWith(".internal") ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.")
    ) {
      return false;
    }

    // Block private IP ranges
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      const [a, b, c, d] = hostname.split(".").map(Number);
      if (
        a === 127 || // 127.0.0.0/8
        a === 10 || // 10.0.0.0/8
        (a === 192 && b === 168) || // 192.168.0.0/16
        (a === 172 && b >= 16 && b <= 31) // 172.16.0.0/12
      ) {
        return false;
      }
    }

    return true;
  } catch (e) {
    // Invalid URL syntax
    return false;
  }
}

// === End of Helper Functions ===

Deno.serve(async (request) => {
  // Extract client IP from x-forwarded-for header
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = xForwardedFor
    ? xForwardedFor.split(",")[0].trim() // Use leftmost IP
    : "unknown";

  // Apply rate limiting
  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Too many requests" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse request body
  let file_url: string;
  try {
    const body = await request.json();
    file_url = body.file_url;
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate file_url parameter
  if (!file_url || typeof file_url !== "string") {
    return new Response(
      JSON.stringify({ error: "Invalid or missing file_url" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!validateUrl(file_url)) {
    return new Response(
      JSON.stringify({ 
        error: "Invalid file URL. Only HTTPS external URLs are allowed." 
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Proceed with document analysis logic (existing code)
  // e.g., fetch(file_url), process with AI model, etc.
  // For now, return mock success
  return new Response(
    JSON.stringify({ success: true, message: "Document analysis initiated." }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
