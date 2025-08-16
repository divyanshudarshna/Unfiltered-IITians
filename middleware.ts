import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';


// Define all public routes that should never trigger auth redirects
const isPublicRoute = createRouteMatcher([
  '/',                   // Home page - always public
  '/about',              // About page - always public
  '/courses(.*)',        // Course listings
  '/blog(.*)',           // Blog posts
  '/api/webhooks/clerk', // Clerk webhook
  '/contact',
  '/youtube',
    // ✅ Temporarily make these APIs public:
  '/api/user/(.*)',
  '/api/mock/(.*)',
  '/api/subscription/(.*)',
  '/api/performance/(.*)',


  // ✅ TEMP: make admin APIs public for testing
  '/api/admin/(.*)',

  // Add other public routes here
]);

// Define auth routes that should only be accessible when explicitly visited
const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',        // Sign-in routes
  '/sign-up(.*)',        // Sign-up routes
]);

export default clerkMiddleware(async (auth, req) => {
  // Never protect public routes
  if (isPublicRoute(req)) {
    return; // Allow access
  }

  // For auth routes, don't protect but let them handle their own logic
  if (isAuthRoute(req)) {
    return; // Allow access without protection
  }

  // NOTE : UNCOMMENT THE LINES BELOW TO ADD ADMIN ROLE CHECKING

  //   if (url.pathname.startsWith("/admin") && role !== "ADMIN") {
  //   url.pathname = "/";
  //   return Response.redirect(url);
  // }

  // For all other routes, require authentication
  await auth.protect();

  // Optional: Add additional role checking for admin routes

   // Optional: Add additional role checking for admin routes

});

export const config = {
  matcher: [
    '/((?!_next|_static|_vercel|[^.]*\\..*).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};


