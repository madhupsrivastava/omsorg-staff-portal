import { createClient } from "@supabase/supabase-js";

// Server-side client (uses service role for admin operations in API routes)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Never expose this to browser
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Browser client (uses anon key, respects RLS)
let browserClient;
export function createBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return browserClient;
}

// Verify JWT and return user + role — use in every API route
export async function requireAuth(req, allowedRoles = []) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return { error: "Unauthorised", status: 401 };

  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: "Invalid token", status: 401 };

  // Get role from users table
  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.active) return { error: "Account inactive", status: 403 };

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return { error: "Insufficient permissions", status: 403 };
  }

  return { user: { ...user, ...profile } };
}

// Verify family user has access to a specific client
export async function requireFamilyAccess(userId, clientId) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("family_client_access")
    .select("id")
    .eq("user_id", userId)
    .eq("client_id", clientId)
    .single();
  return !!data;
}
