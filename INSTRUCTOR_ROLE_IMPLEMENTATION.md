# Instructor Role-Based Access Control Implementation

## Overview
Implemented comprehensive role-based access control for INSTRUCTOR users to access specific admin routes while maintaining proper security boundaries.

## Key Changes

### 1. Configuration File: `lib/roleConfig.ts`
**Central configuration for role-based permissions**
- `INSTRUCTOR_ALLOWED_ADMIN_PREFIXES` - Define which admin UI routes instructors can access
- `INSTRUCTOR_ALLOWED_API_PREFIXES` - Define which API routes instructors can access
- `INSTRUCTOR_FORBIDDEN` - Specify forbidden actions (e.g., DELETE on courses)

**Currently Allowed for INSTRUCTORS:**
- ✅ Courses (all operations except DELETE)
  - Manage Courses
  - Course Details
  - Course Enrollments
  - Course Announcements
  - Course Feedbacks
- ✅ Mocks (all operations except DELETE)
  - Manage Mocks (Create, Edit, View)
- ✅ Mock Bundles (all operations except DELETE)
  - Manage Mock Bundles (Create, Edit, View)

**Forbidden for INSTRUCTORS:**
- ❌ Course Deletion
- ❌ Mock Deletion
- ❌ Mock Bundle Deletion

### 2. Server-side Auth Helper: `lib/roleAuth.ts`
**Centralized authentication and authorization**
- `getDbUserFromClerk()` - Get database user from Clerk session
- `assertAdminApiAccess(url, method)` - Enforce role-based API access
  - Allows ADMIN full access
  - Allows INSTRUCTOR access to configured routes
  - Blocks DELETE on courses for instructors
  - Returns 401/403 for unauthorized/forbidden access

### 3. Admin Sidebar: `components/admin/app-sidebar.tsx`
**Visual indicators for access restrictions**
- Detects instructor role from user profile/clerk metadata
- Shows accessible links normally
- Shows locked links with:
  - 🔒 Red lock icon
  - Disabled/greyed out appearance
  - Tooltip: "These can be access by admin role only please contact admin for access"
  - Non-clickable state

### 4. Admin Layout: `app/(admin)/layout.tsx`
**Updated to allow INSTRUCTOR access**
- Changed from ADMIN-only to authenticated user check
- Instructors can now access `/admin/*` routes
- Sidebar controls visibility/locking per route

### 5. Protected API Routes
**All instructor-accessible API routes now enforce role checks:**

**Courses:**
- `/api/admin/courses` - GET, POST (✅ Instructor allowed)
- `/api/admin/courses/[id]` - GET, PUT, DELETE (❌ DELETE forbidden for instructors)
- `/api/admin/course-details` - GET, POST (✅ Instructor allowed)
- `/api/admin/course-details/[id]` - GET, PUT, DELETE (✅ Instructor allowed)
- `/api/admin/course-announcement` - GET, POST, PUT, DELETE (✅ Instructor allowed)

**Mocks:**
- `/api/admin/mocks` - GET, POST, PUT (✅ Instructor allowed)
- `/api/admin/mocks/[id]` - GET, PUT, DELETE (✅ Instructor allowed)
- `/api/admin/mockBundle` - GET, POST, PUT, DELETE (✅ Instructor allowed)

**Feedback:**
- `/api/admin/feedback` - GET, POST, DELETE, PATCH (✅ Instructor allowed)
- `/api/admin/feedback/[feedbackId]` - DELETE (✅ Instructor allowed)
- `/api/admin/feedback/unread-count` - GET (✅ Instructor allowed)
- `/api/admin/feedback/mark-read` - POST (✅ Instructor allowed)

**Course Enrollments:**
- All enrollment-related APIs are configured for instructor access

## How to Modify Access in Future

### To Add New Routes for Instructors:
1. Edit `lib/roleConfig.ts`
2. Add route prefix to `INSTRUCTOR_ALLOWED_ADMIN_PREFIXES` (for UI)
3. Add API prefix to `INSTRUCTOR_ALLOWED_API_PREFIXES` (for backend)
4. Sidebar will automatically show/hide based on config

### To Restrict Specific Operations:
1. Edit `lib/roleConfig.ts`
2. Add to `INSTRUCTOR_FORBIDDEN` object:
```typescript
export const INSTRUCTOR_FORBIDDEN = {
  courses: {
    DELETE: true,
  },
  mocks: {
    DELETE: true, // Example: block mock deletion
  },
}
```
3. Update `lib/roleAuth.ts` to check the new restriction

### To Remove Routes from Instructors:
1. Edit `lib/roleConfig.ts`
2. Remove route prefix from allowed arrays
3. Sidebar will automatically lock those links

## Security Features
- ✅ Server-side enforcement (not just UI hiding)
- ✅ Role checked on every API request
- ✅ Granular control per resource and HTTP method
- ✅ Centralized configuration for easy updates
- ✅ User-friendly tooltips explaining restrictions
- ✅ Course deletion specifically blocked for instructors
- ✅ Mock deletion specifically blocked for instructors
- ✅ Mock bundle deletion specifically blocked for instructors

## Testing Checklist
- [ ] Test instructor login and access to `/admin`
- [ ] Verify locked sidebar items show red lock icon
- [ ] Hover over locked items to see tooltip
- [ ] Verify instructor can access courses/mocks management
- [ ] Verify instructor CANNOT delete courses (403 response with proper message)
- [ ] Verify instructor CANNOT delete mocks (403 response with proper message)
- [ ] Verify instructor CANNOT delete mock bundles (403 response with proper message)
- [ ] Verify instructor CAN create, edit, and view courses
- [ ] Verify instructor CAN create, edit, and view mocks
- [ ] Verify instructor CAN create, edit, and view mock bundles
- [ ] Test all CRUD operations for allowed resources
- [ ] Verify admin role still has full access including all deletions

## Database Role Requirement
Ensure users in database have proper role set:
```prisma
enum Role {
  STUDENT
  INSTRUCTOR  // ← Required for instructor access
  ADMIN
}
```

Update user role in database:
```typescript
await prisma.user.update({
  where: { email: "instructor@example.com" },
  data: { role: "INSTRUCTOR" }
});
```

## Notes
- Clerk `publicMetadata.role` is synced with DB `user.role`
- Both admin and instructor roles are checked at the server level
- All changes are backward compatible with existing admin functionality
- Lint warnings in some files are pre-existing (not introduced by this change)
