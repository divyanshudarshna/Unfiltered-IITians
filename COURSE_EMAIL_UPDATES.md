# Course Purchase Email Updates

## Changes Made

### 1. Amount Conversion (Paise to Rupees)
**File:** `app/api/courses/[id]/razorpay/verify/route.ts`

- **Issue:** Amount was stored in paise but displayed in email without conversion
- **Fix:** Convert amount from paise to rupees before sending email
```typescript
const amountInRupees = ((sub.actualAmountPaid || sub.course.price) / 100).toFixed(2);
```

### 2. Course Expiry Calculation
**File:** `app/api/courses/[id]/razorpay/verify/route.ts`

- **Issue:** Email showed "Access: Lifetime" but courses have expiry based on duration
- **Fix:** Calculate expiry date based on course duration
```typescript
const enrollmentExpiresAt = new Date(Date.now() + (sub.course.durationMonths * 30 * 24 * 60 * 60 * 1000));
const expiryDateString = enrollmentExpiresAt.toLocaleDateString('en-IN', { 
  day: 'numeric', 
  month: 'long', 
  year: 'numeric' 
});
```
- Pass expiry date in `additionalInfo` field to email template

### 3. Email Template Updates
**File:** `lib/email.ts`

#### Course Access Link
- **Old:** `${baseUrl}/my-courses`
- **New:** `${baseUrl}/dashboard/courses`

#### Dashboard Button
- **Old:** Dynamic link based on user's first name: `${baseUrl}/${encodedName}/dashboard`
- **New:** `/redirecting` route which automatically handles user routing
```typescript
const dashboardUrl = `${baseUrl}/redirecting`;
```

#### Access Expiry Display
- **Old:** `<p><strong>Access:</strong> Lifetime</p>`
- **New:** `${data.additionalInfo ? `<p><strong>Access Until:</strong> ${data.additionalInfo}</p>` : ''}`

## Email Data Structure

When sending course purchase email, the following data is now passed:

```typescript
{
  userName: user.name || 'Student',
  courseName: sub.course.title,
  purchaseAmount: amountInRupees, // Already converted to rupees with 2 decimal places
  additionalInfo: expiryDateString, // Formatted expiry date (e.g., "2 November, 2026")
}
```

## Benefits

1. **Accurate Amount Display:** Users see the correct amount in rupees (e.g., ₹499.00) instead of paise (e.g., ₹49900)
2. **Clear Expiry Information:** Users know exactly when their course access expires
3. **Simplified Dashboard Navigation:** `/redirecting` automatically handles user-specific routing
4. **Correct Course Access Link:** Direct link to user's enrolled courses page

## Testing

To test the updated email:
1. Make a course purchase
2. Check email for:
   - ✅ Amount displayed in rupees (with decimal points)
   - ✅ "Access Until" date shown (not "Lifetime")
   - ✅ "Access Your Course" button links to `/dashboard/courses`
   - ✅ "Go to Dashboard" button links to `/redirecting`

## Related Files

- `app/api/courses/[id]/razorpay/verify/route.ts` - Payment verification and email trigger
- `lib/email.ts` - Email template generation
- `types/email.ts` - Email data type definitions (additionalInfo field used for expiry)
