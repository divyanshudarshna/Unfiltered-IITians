# Generalized Coupon Management System

## Overview
A comprehensive, scalable coupon management system that works across different product types (MockBundles, Guidance Sessions, Individual Mocks, Subscriptions, etc.) while maintaining the existing course coupon system separately.

## 📁 Files Created

### 1. Prisma Schema Updates
- **File**: `prisma/schema.prisma`
- **Added Models**:
  - `GeneralCoupon`: Main coupon entity with flexible product type support
  - `GeneralCouponUsage`: Tracks individual coupon usage with detailed metadata
  - Added enums: `ProductType`, `DiscountType`
  - Added relation in `User` model for tracking general coupon usage

### 2. API Endpoints

#### Admin CRUD APIs
- **`/api/admin/general-coupons/route.ts`**: Main CRUD operations (GET, POST)
- **`/api/admin/general-coupons/[id]/route.ts`**: Individual coupon operations (GET, PUT, DELETE)
- **`/api/admin/general-coupons/stats/route.ts`**: Statistics and analytics

#### Public APIs (For Frontend Usage)
- **`/api/general-coupons/validate/route.ts`**: Validate coupon before checkout
- **`/api/general-coupons/apply/route.ts`**: Apply coupon during purchase

### 3. Admin Interface
- **`/app/(admin)/admin/general-coupons/page.tsx`**: Main dashboard with filtering and stats
- **`/app/(admin)/admin/general-coupons/generalCouponsTable.tsx`**: Data table with actions
- **`/app/(admin)/admin/general-coupons/generalCouponForm.tsx`**: Create/edit form

## 🚀 Key Features

### Coupon Configuration
- **Discount Types**: Percentage or Fixed Amount
- **Usage Limits**: Total usage limit + per-user limits
- **Product Targeting**: Specific product types with optional product ID filtering
- **Validity Periods**: Flexible start and end dates
- **Advanced Options**: Minimum order value, maximum discount caps

### Product Types Supported
- `MOCK_BUNDLE`: Mock test bundles
- `GUIDANCE_SESSION`: Individual guidance sessions
- `INDIVIDUAL_MOCK`: Single mock tests
- `SUBSCRIPTION`: Subscription plans
- `OTHER`: Future product types

### Usage Tracking
- Individual usage records with user details
- IP address and user agent for fraud detection
- Original amount, discount applied, and final amount
- Usage history and analytics

### Admin Features
- Create, edit, delete, and view coupons
- Advanced filtering by product type and status
- Real-time statistics and usage analytics
- Bulk operations and search functionality
- Usage history with user details

## 🔧 Usage Examples

### Frontend Integration (Checkout Process)

```typescript
// 1. Validate coupon before applying
const validateResponse = await fetch('/api/general-coupons/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'SAVE20',
    userId: 'user-id',
    productType: 'MOCK_BUNDLE',
    productId: 'bundle-id', // optional
    orderValue: 1000
  })
});

// 2. Apply coupon during purchase
const applyResponse = await fetch('/api/general-coupons/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'SAVE20',
    userId: 'user-id',
    productType: 'MOCK_BUNDLE',
    productId: 'bundle-id',
    orderId: 'order-123',
    originalAmount: 1000,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  })
});
```

### Creating Coupons via API

```typescript
const coupon = await fetch('/api/admin/general-coupons', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'NEWUSER20',
    name: '20% Off for New Users',
    description: 'Welcome discount for first-time customers',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxDiscountAmt: 500,
    minOrderValue: 100,
    usageLimit: 1000,
    userLimit: 1,
    productType: 'MOCK_BUNDLE',
    productIds: [], // empty = applies to all mock bundles
    validFrom: '2025-01-01',
    validTill: '2025-12-31',
    isActive: true
  })
});
```

## 🔄 Next Steps

### Required Actions:
1. **Run Prisma Generate**: `npx prisma generate`
2. **Push Schema to Database**: `npx prisma db push`
3. **Add Navigation**: Link to `/admin/general-coupons` in admin sidebar
4. **Frontend Integration**: Update checkout flows to use new validation/apply APIs

### Integration Points:
- **MockBundle Checkout**: Use `productType: 'MOCK_BUNDLE'`
- **Guidance Sessions**: Use `productType: 'GUIDANCE_SESSION'`
- **Individual Mocks**: Use `productType: 'INDIVIDUAL_MOCK'`
- **Subscriptions**: Use `productType: 'SUBSCRIPTION'`

### Future Enhancements:
- Coupon templates and bulk creation
- A/B testing for coupon effectiveness
- Integration with analytics dashboard
- Email notification for coupon usage
- Auto-expiration warnings for admins

## 🛡️ Security Features
- Input validation and sanitization
- Usage fraud detection (IP/User Agent tracking)
- Atomic transactions for coupon application
- Proper error handling and logging
- Access control (admin-only for management APIs)

This generalized system is completely separate from the existing course coupon system and can be easily extended for new product types in the future.