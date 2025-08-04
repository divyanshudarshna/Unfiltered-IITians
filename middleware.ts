import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define all public routes that should never trigger auth redirects
const isPublicRoute = createRouteMatcher([
  '/',                   // Home page - always public
  '/about',              // About page - always public
  '/courses(.*)',        // Course listings
  '/blog(.*)',           // Blog posts
  '/api/webhooks/clerk', // Clerk webhook
  '/contact',
  '/youtube'
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

  // For all other routes, require authentication
  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|_static|_vercel|[^.]*\\..*).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};