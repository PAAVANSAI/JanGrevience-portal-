import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, { ...options, maxAge: 60 * 60 })
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, { ...options, maxAge: 60 * 60 })
          );
        },
      },
      cookieOptions: {
        maxAge: 60 * 60, // 1 hour
      }
    }
  );

  // IMPORTANT: DO NOT REMOVE. This refreshes the user's session and must
  // happen before any route protection checks.
  // Optimization: Only call getUser() if an auth cookie exists to avoid slow network requests for logged-out users.
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  
  let user = null;
  if (hasAuthCookie) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  // Auth routes — logged-in users should be redirected to their dashboard
  const authRoutes = ["/login", "/register", "/forgot-password", "/verify-email"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Protected routes — logged-out users should be redirected to login.
  const protectedRoutes = ["/onboarding", "/profile", "/citizen", "/officer", "/admin", "/department-admin", "/grievances", "/settings", "/notifications", "/appeals"];
  const isProtectedRoute = protectedRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + "/")
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is logged in, fetch their profile for role-based routing and access control
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active, full_name, phone")
      .eq("id", user.id)
      .single();

    if (profile) {
      // Check if account is deactivated
      if (profile.is_active === false) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "Your account has been deactivated.");
        return NextResponse.redirect(url);
      }

      // Determine the user's correct dashboard path
      const role = profile.role;
      let dashboardPath = "/citizen";
      if (!profile.full_name || !profile.phone) {
        dashboardPath = "/onboarding";
      } else if (role === "OFFICER") {
        dashboardPath = "/officer";
      } else if (role === "DEPT_ADMIN") {
        dashboardPath = "/department-admin";
      } else if (role === "SUPER_ADMIN") {
        dashboardPath = "/admin";
      }

      // Redirect logged-in users away from auth routes to their dashboard
      if (isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = dashboardPath;
        return NextResponse.redirect(url);
      }

      // Role-based route protection
      const path = request.nextUrl.pathname;

      if (path.startsWith("/admin") && role !== "SUPER_ADMIN") {
        const url = request.nextUrl.clone();
        url.pathname = dashboardPath;
        return NextResponse.redirect(url);
      }

      if (path.startsWith("/department-admin") && role !== "DEPT_ADMIN" && role !== "SUPER_ADMIN") {
        const url = request.nextUrl.clone();
        url.pathname = dashboardPath;
        return NextResponse.redirect(url);
      }

      if (path.startsWith("/officer") && role !== "OFFICER" && role !== "DEPT_ADMIN" && role !== "SUPER_ADMIN") {
        const url = request.nextUrl.clone();
        url.pathname = dashboardPath;
        return NextResponse.redirect(url);
      }

      // Citizen dashboard is only for CITIZEN role users
      if (path.startsWith("/citizen") && role !== "CITIZEN") {
        const url = request.nextUrl.clone();
        url.pathname = dashboardPath;
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
