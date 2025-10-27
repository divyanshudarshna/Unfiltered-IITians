# SEO Metadata Implementation for Unfiltered IITians

This document outlines all the SEO metadata implementations for the frontend (main) pages of the Unfiltered IITians platform.

## Main Layout Metadata
**File:** `app/(main)/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: {
    default: "Unfiltered IITians - Master Competitive Exams",
    template: "%s | Unfiltered IITians"
  },
  description: "Expert guidance from IIT alumni for GATE, CSIR NET, PhD entrance exams. Free resources, mock tests, and comprehensive courses.",
  keywords: [
    "GATE preparation", "CSIR NET coaching", "PhD entrance exam",
    "IIT alumni mentorship", "competitive exam preparation",
    "mock tests", "free study material", "online coaching"
  ],
  authors: [{ name: "Unfiltered IITians Team" }],
  creator: "Unfiltered IITians",
  publisher: "Unfiltered IITians",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Unfiltered IITians",
    title: "Unfiltered IITians - Master Competitive Exams",
    description: "Expert guidance from IIT alumni for GATE, CSIR NET, PhD entrance exams."
  },
  twitter: {
    card: "summary_large_image",
    creator: "@UnfilteredIITians"
  },
  robots: { index: true, follow: true }
}
```

## Individual Page Metadata

### 1. Home Page (`/`)
**File:** `app/(main)/page.tsx`
- **Title:** Uses default from main layout
- **Description:** Expert guidance from IIT alumni for competitive exams
- **Focus:** Main landing page, comprehensive overview

### 2. About Page (`/about`)
**File:** `app/(main)/about/layout.tsx`
- **Title:** "About Divyanshu - IIT PhD Scholar & Expert Mentor"
- **Description:** Meet Divyanshu, PhD scholar at IIT Roorkee, GATE-BT & GATE-XL qualified
- **Keywords:** Divyanshu IIT mentor, PhD scholar IIT Roorkee, GATE qualified teacher
- **Focus:** Personal branding, credentials, expertise

### 3. Courses Page (`/courses`)
**File:** `app/(main)/courses/layout.tsx`
- **Title:** "Courses - GATE, CSIR NET & PhD Exam Preparation"
- **Description:** Comprehensive courses for competitive exams with expert guidance
- **Keywords:** GATE courses online, CSIR NET preparation courses, PhD entrance coaching
- **Focus:** Course offerings, exam preparation

### 4. Mock Tests Page (`/mocks`)
**File:** `app/(main)/mocks/layout.tsx`
- **Title:** "Mock Tests - Practice for GATE, CSIR NET & Competitive Exams"
- **Description:** Practice with authentic mock tests and detailed performance analysis
- **Keywords:** GATE mock tests, CSIR NET practice tests, exam simulation
- **Focus:** Practice tests, performance analysis

### 5. Resources Page (`/resources`)
**File:** `app/(main)/resources/layout.tsx`
- **Title:** "Free Resources - Study Materials for Competitive Exams"
- **Description:** Access free study materials, notes, PDFs, and video tutorials
- **Keywords:** free study materials, GATE free resources, educational resources
- **Focus:** Free content, study materials

### 6. Mock Bundles Page (`/mockBundles`)
**File:** `app/(main)/mockBundles/layout.tsx`
- **Title:** "Mock Bundles - Comprehensive Test Packages"
- **Description:** Complete mock test bundles with detailed analysis and performance tracking
- **Keywords:** mock test bundles, GATE test series, comprehensive mock tests
- **Focus:** Test packages, bundled offerings

### 7. YouTube Page (`/youtube`)
**File:** `app/(main)/youtube/layout.tsx`
- **Title:** "YouTube Channel - Learn with Divyanshu"
- **Description:** Free educational videos for competitive exam preparation
- **Keywords:** educational YouTube channel, GATE preparation videos, free education videos
- **Focus:** Video content, free tutorials

### 8. Success Stories Page (`/success-stories`)
**File:** `app/(main)/success-stories/layout.tsx`
- **Title:** "Success Stories - Student Achievements & Testimonials"
- **Description:** Inspiring success stories from students who cracked competitive exams
- **Keywords:** GATE success stories, student testimonials, competitive exam achievements
- **Focus:** Social proof, testimonials

### 9. FAQs Page (`/faqs`)
**File:** `app/(main)/faqs/layout.tsx`
- **Title:** "FAQs - Frequently Asked Questions"
- **Description:** Find answers to common questions about courses and exam preparation
- **Keywords:** FAQ, course information, exam preparation help
- **Focus:** Support, information

### 10. Contact Page (`/contact`)
**File:** `app/(main)/contact/layout.tsx`
- **Title:** "Contact Us - Get in Touch"
- **Description:** Contact our expert team for course inquiries and personalized assistance
- **Keywords:** contact us, course inquiry, student support
- **Focus:** Communication, support

### 11. Guidance Page (`/guidance`)
**File:** `app/(main)/guidance/layout.tsx`
- **Title:** "Guidance Sessions - Personalized Mentorship"
- **Description:** Book one-on-one guidance sessions with IIT experts
- **Keywords:** guidance sessions, one-on-one mentorship, personal mentor
- **Focus:** Personalized services, mentorship

### 12. My Courses Page (`/my-courses`)
**File:** `app/(main)/my-courses/layout.tsx`
- **Title:** "My Courses - Your Learning Dashboard"
- **Description:** Access your enrolled courses and track your learning progress
- **Keywords:** my courses, student dashboard, course progress
- **Focus:** User dashboard, progress tracking

### 13. Profile Page (`/profile`)
**File:** `app/(main)/profile/layout.tsx`
- **Title:** "Profile - Manage Your Account"
- **Description:** Manage your profile and view your learning achievements
- **Keywords:** user profile, account settings, achievements
- **Focus:** Account management, user settings

### 14. Dashboard Page (`/dashboard`)
**File:** `app/(main)/dashboard/layout.tsx`
- **Title:** "Dashboard - Performance Overview"
- **Description:** View your learning analytics and performance in your personalized dashboard
- **Keywords:** student dashboard, performance analytics, learning progress
- **Focus:** Analytics, performance tracking

## SEO Benefits Implemented

### 1. **Title Optimization**
- Descriptive, keyword-rich titles under 60 characters
- Template structure for consistent branding
- Unique titles for each page

### 2. **Meta Descriptions**
- Compelling descriptions under 160 characters
- Include primary keywords naturally
- Clear value proposition for each page

### 3. **Keywords Strategy**
- Targeted keywords for competitive exam niche
- Long-tail keywords for specific services
- Location and credential-based keywords (IIT, PhD)

### 4. **Open Graph Tags**
- Optimized for social media sharing
- Consistent branding across platforms
- Engaging descriptions for social previews

### 5. **Twitter Cards**
- Large image cards for better engagement
- Platform-specific optimization
- Consistent messaging

### 6. **Technical SEO**
- Proper robots meta tags
- Structured metadata hierarchy
- Mobile-friendly considerations

## Implementation Notes

1. **Layout-based Approach**: Used individual layout files for each route to handle metadata since many pages are client components.

2. **Template Structure**: Main layout uses template for consistent branding across all pages.

3. **Keyword Strategy**: Focused on competitive exam preparation niche with IIT/expert positioning.

4. **User Intent**: Metadata reflects different user intents (learning, practicing, getting support).

5. **Brand Consistency**: All metadata reinforces the "Unfiltered IITians" brand and expertise positioning.

## Future Enhancements

1. **Dynamic Metadata**: Add dynamic metadata for individual course/mock pages
2. **Schema Markup**: Implement structured data for rich snippets
3. **Canonical URLs**: Add canonical tags for duplicate content prevention
4. **Multilingual**: Add language-specific metadata if expanding internationally
5. **Performance**: Monitor Core Web Vitals impact of metadata loading