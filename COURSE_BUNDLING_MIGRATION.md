# Course Bundling Feature - Database Migration Required

## Current Status
The course bundling feature has been implemented but requires a database migration to work properly. The APIs have been temporarily disabled to prevent 500 errors.

## Steps to Complete Migration

### 1. Push Schema to Database
Run this command to create the new tables in your database:
```bash
npx prisma db push
```

### 2. Generate Updated Prisma Client
```bash
npx prisma generate
```

### 3. Re-enable Course Inclusions

After successful migration, you need to uncomment and re-enable the inclusions code in these files:

#### A. `/app/api/admin/courses/route.ts`
- Uncomment the transaction logic in POST method (lines ~35-65)
- Change return from `course` to `result`
- Uncomment `inclusions: true` in GET method

#### B. `/app/api/admin/courses/[id]/route.ts` 
- Uncomment `inclusions: true` in GET method (line 19)
- Uncomment transaction logic in PUT method (lines ~53-85)

#### C. `/app/(admin)/admin/courses/CourseForm.tsx`
- Uncomment fetchInclusionOptions useEffect (lines ~95-115)
- Uncomment inclusions preparation logic (lines ~187-193)

### 4. Test the Feature

After re-enabling:
1. Create a new course with inclusions
2. Verify inclusions are saved
3. Test course updates
4. Test course purchase flow

## Database Schema Added

- **CourseInclusion** table to link courses with mocks/bundles/sessions
- **InclusionType** enum: MOCK_TEST, MOCK_BUNDLE, SESSION
- Course model updated with inclusions relationship

## Revenue Tracking

The system ensures:
- Main course purchase tracks actual amount paid
- Included items have $0 price to prevent double-counting
- Clear audit trail for bundled vs individual purchases

## Troubleshooting

If migration fails:
1. Check database connection
2. Verify MongoDB is running
3. Check for any schema conflicts
4. Use `npx prisma db pull` to see current schema