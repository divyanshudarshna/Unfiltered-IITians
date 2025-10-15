# Revenue Tracking Migration Guide

## ✅ **Schema Changes Applied**

### Updated Subscription Model
```prisma
model Subscription {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  userId          String      @db.ObjectId
  mockTestId      String?     @db.ObjectId
  courseId        String?     @db.ObjectId
  mockBundleId    String?     @db.ObjectId
  razorpayOrderId String
  razorpayPaymentId String?   // ✅ NEW: Store Razorpay payment ID
  paid            Boolean     @default(false)
  actualAmountPaid Int?       // ✅ NEW: Store actual amount paid (in paise)
  originalPrice   Int?        // ✅ NEW: Store original price for reference
  discountApplied Int?        // ✅ NEW: Store discount amount
  couponCode      String?     // ✅ NEW: Store coupon code used
  expiresAt       DateTime?   // Subscription expiry date
  paidAt          DateTime?   // ✅ NEW: When payment was completed
  createdAt       DateTime    @default(now())
  
  // Relations unchanged
  user       User        @relation(fields: [userId], references: [id])
  mockTest   MockTest?   @relation(fields: [mockTestId], references: [id])
  course     Course?     @relation(fields: [courseId], references: [id], onDelete: Cascade)
  mockBundle MockBundle? @relation(fields: [mockBundleId], references: [id])
  couponUsage CouponUsage?
}
```

## 🔧 **API Updates Applied**

### 1. Payment Order API (`/api/payment/order`)
- ✅ Now stores `originalPrice`, `actualAmountPaid`, and `discountApplied` in subscription records
- ✅ Properly calculates bundle discounts and distributes them across individual mock tests
- ✅ Handles both individual and bundle purchases with accurate pricing

### 2. Payment Verification API (`/api/payment/verify`)
- ✅ Now stores `razorpayPaymentId` and `paidAt` timestamp
- ✅ Maintains payment traceability for all transactions

### 3. Course Purchase API (`/api/courses/[id]/razorpay`)
- ✅ Stores original price, actual amount paid, discount applied, and coupon code
- ✅ Tracks course-specific payment details

### 4. Course Verification API (`/api/courses/[id]/razorpay/verify`)
- ✅ Updates payment ID and timestamp on successful verification

### 5. Admin Users API (`/api/admin/users`)
- ✅ Now calculates revenue using `actualAmountPaid` field
- ✅ Includes session enrollment revenue
- ✅ Fallback to old method for legacy records

### 6. Dashboard Stats API (`/api/admin/dashboard-stats`)
- ✅ Uses actual payment amounts for accurate revenue calculation
- ✅ Includes all revenue sources (subscriptions + sessions)

### 7. NEW: Revenue Analytics API (`/api/admin/revenue-analytics`)
- ✅ Detailed revenue breakdown by category
- ✅ Discount impact analysis
- ✅ Monthly revenue trends
- ✅ Transaction counts and metrics

## 📊 **Benefits Achieved**

### Accurate Revenue Tracking
- Real payment amounts stored for each transaction
- Discount tracking shows actual savings provided
- Bundle purchases properly distributed across items
- Coupon usage tracked with specific codes

### Better Analytics
- True revenue per course/mock/bundle
- Discount impact analysis
- Payment trend analysis
- Individual vs bundle performance

### Audit Trail
- Complete payment history with timestamps
- Razorpay payment ID for each transaction
- Original price vs final price tracking
- Coupon code usage tracking

## 🔄 **Migration Process**

### For Existing Records
- Old records without `actualAmountPaid` will use fallback calculation
- New records will have accurate payment tracking
- No data loss during transition

### Database Migration
Run: `npx prisma db push` to apply schema changes

### Testing Checklist
- [ ] Test mock test individual purchase
- [ ] Test mock bundle purchase with discount
- [ ] Test course purchase with coupon
- [ ] Test session enrollment payment
- [ ] Verify admin dashboard shows accurate revenue
- [ ] Check revenue analytics API

## 🎯 **Revenue Sources Now Tracked**

1. **Individual Mock Tests** - Actual amount paid per test
2. **Mock Bundles** - Discounted bundle price distributed across tests
3. **Courses** - Course price with coupon discounts applied
4. **Sessions** - Session enrollment fees
5. **All Discounts** - Bundle discounts, coupon discounts, promotional discounts

## 🔍 **Admin Dashboard Features**

### Enhanced User Management
- Real revenue per user
- Payment history with timestamps
- Discount usage patterns

### Revenue Analytics
- Category-wise revenue breakdown
- Discount impact analysis
- Monthly trends
- Transaction volume metrics

All payment flows now accurately capture and store the actual transaction amounts, providing consistent and reliable revenue tracking across the entire platform.