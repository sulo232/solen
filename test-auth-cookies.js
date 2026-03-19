// Test script to check how @supabase/ssr parses cookies
const { createServerClient } = require("@supabase/ssr");

// Simulate the EXACT cookie the user has in their browser
const cookieValue = 'base64-eyJhY2Nlc3NfdG9rZW4iOiJ0ZXN0IiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjk5OTk5OTk5OTksInJlZnJlc2hfdG9rZW4iOiJ0ZXN0X3JlZnJlc2giLCJ1c2VyIjp7ImlkIjoiMzc4Y2FiMzctYzA2YS00ODZmLWEzZTgtYWU1MzY2OTFkZTg5In19';
const cookieName = 'sb-tocfnsmxmdxkrcmjzzdw-auth-token';

// Also test with chunked name
const chunkedName = 'sb-tocfnsmxmdxkrcmjzzdw-auth-token.0';

const mockCookies = [
  { name: cookieName, value: cookieValue },
  { name: 'NEXT_LOCALE', value: 'de' },
];

const mockCookiesChunked = [
  { name: chunkedName, value: cookieValue },
  { name: 'NEXT_LOCALE', value: 'de' },
];

console.log("=== @supabase/ssr Cookie Parsing Test ===\n");
console.log("Testing with cookie name:", cookieName);

// Create the server client exactly like middleware does
const supabase = createServerClient(
  "https://tocfnsmxmdxkrcmjzzdw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvY2Zuc214bWR4a3JjbWp6emR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3ODA4OTcsImV4cCI6MjA4ODM1Njg5N30.8J2qPNlDW48UhCnPQSOigHQOV_uOxJtoXWmMW1LUaTc",
  {
    cookies: {
      getAll() {
        console.log("  [getAll called] returning:", mockCookies.map(c => c.name));
        return mockCookies;
      },
      setAll(cookiesToSet) {
        console.log("  [setAll called] setting:", cookiesToSet.map(c => c.name));
      },
    },
  }
);

async function test() {
  console.log("\n--- Testing getSession() with NON-chunked cookie name ---");
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log("  session exists:", !!data.session);
    if (data.session) {
      console.log("  user id:", data.session.user?.id ?? "null");
      console.log("  access_token prefix:", data.session.access_token?.substring(0, 20) ?? "null");
    }
    if (error) console.log("  error:", error.message);
  } catch (e) {
    console.log("  EXCEPTION:", e.message);
  }

  // Now test with chunked name
  console.log("\n--- Testing getSession() with CHUNKED cookie name (.0) ---");
  const supabase2 = createServerClient(
    "https://tocfnsmxmdxkrcmjzzdw.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvY2Zuc214bWR4a3JjbWp6emR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3ODA4OTcsImV4cCI6MjA4ODM1Njg5N30.8J2qPNlDW48UhCnPQSOigHQOV_uOxJtoXWmMW1LUaTc",
    {
      cookies: {
        getAll() {
          console.log("  [getAll called] returning:", mockCookiesChunked.map(c => c.name));
          return mockCookiesChunked;
        },
        setAll(cookiesToSet) {
          console.log("  [setAll called] setting:", cookiesToSet.map(c => c.name));
        },
      },
    }
  );
  
  try {
    const { data, error } = await supabase2.auth.getSession();
    console.log("  session exists:", !!data.session);
    if (data.session) {
      console.log("  user id:", data.session.user?.id ?? "null");
      console.log("  access_token prefix:", data.session.access_token?.substring(0, 20) ?? "null");
    }
    if (error) console.log("  error:", error.message);
  } catch (e) {
    console.log("  EXCEPTION:", e.message);
  }
}

test().catch(console.error);
