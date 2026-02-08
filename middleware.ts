import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';


// Define all public routes that should never trigger auth redirects
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/courses(.*)',
  '/blog(.*)',
  '/contact(.*)', // ✅ Allow all contact routes including /contact/reply
  '/youtube',
  '/guidance(.*)', // ✅ Add this line
  '/privacy-policy(.*)', // ✅ Static route - Privacy Policy
  '/refund-policy(.*)', // ✅ Static route - Refund Policy  
  '/terms-of-service(.*)', // ✅ Static route - Terms of Service
  '/api/webhooks/clerk',
  '/api/user/(.*)',
  '/api/mock/(.*)',
  '/api/subscription/(.*)',
  '/api/performance/(.*)',
  '/api/testimonials(.*)',
  '/api/contact-us(.*)',
  '/api/courses(.*)',
  '/api/sessions(.*)',
  '/api/course-details(.*)',
  '/faq(.*)', // ✅ Add this line
  '/api/faq(.*)', // ✅ Add this to make the API public
  '/mockBundles(.*)', // ✅ Add this to make the API public
  '/resources(.*)',
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


