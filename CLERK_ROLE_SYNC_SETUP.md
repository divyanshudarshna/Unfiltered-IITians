# 2-Way Clerk Role Sync Setup Guide

This guide explains how to set up 2-way synchronization between your database and Clerk for user roles.

## Overview

The system now supports:
1. **Database → Clerk**: When you update a user's role in the admin panel, it automatically updates in Clerk's dashboard
2. **Clerk → Database**: When you update a user's role in Clerk's dashboard, it automatically updates in your database

## Setup Instructions

### 1. Configure Clerk Webhook Secret

Add the following environment variable to your `.env` file:

```env
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

To get your webhook secret:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Webhooks** in the left sidebar
4. Click **Add Endpoint**
5. Set the endpoint URL to: `https://your-domain.com/api/webhooks/clerk`
6. Select the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
7. Copy the **Signing Secret** and add it to your `.env` as `CLERK_WEBHOOK_SECRET`

### 2. Ensure CLERK_SECRET_KEY is Set

Make sure you have your Clerk Secret Key in `.env`:

```env
CLERK_SECRET_KEY=sk_test_or_live_key_here
```

### 3. How It Works

#### Database → Clerk Sync
When an admin updates a user's role in the admin panel:
1. The role is updated in your database
2. The system makes an API call to Clerk to update the user's `public_metadata.role`
3. The role is now visible in Clerk's dashboard under the user's public metadata

#### Clerk → Database Sync
When you update a user's role in Clerk's dashboard:
1. Update the user's `public_metadata` in Clerk dashboard:
   ```json
   {
     "role": "ADMIN"
   }
   ```
2. Clerk sends a webhook to your application
3. The webhook handler updates the role in your database
4. The change is reflected in your admin panel

## Setting a User's Role in Clerk Dashboard

### Method 1: Via Public Metadata (Recommended)
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users**
3. Select the user you want to update
4. Scroll to **Public metadata** section
5. Click **Edit**
6. Add or update the role:
   ```json
   {
     "role": "ADMIN"
   }
   ```
7. Click **Save**
8. The webhook will automatically sync this to your database

### Method 2: Via Admin Panel (Recommended for Bulk Operations)
1. Go to your admin panel at `/admin/users`
2. Click the three-dot menu on a user row
3. Click "Update Role"
4. Select the new role (STUDENT, INSTRUCTOR, or ADMIN)
5. The role is updated in both database and Clerk

## Valid Role Values

- `STUDENT` - Regular student user (default)
- `INSTRUCTOR` - Instructor/mentor user
- `ADMIN` - Administrator with full access

## Verifying the Sync

### Check Database → Clerk Sync
1. Update a user's role in admin panel
2. Go to Clerk Dashboard → Users → Select user
3. Check Public metadata - should show the updated role

### Check Clerk → Database Sync
1. Update role in Clerk Dashboard public metadata
2. Go to your admin panel users page
3. The role should be updated within a few seconds

## Role Statistics

The admin dashboard automatically counts users by role from your database:
- Total Users
- Admin Count
- Instructor Count  
- Student Count

These counts are automatically updated when roles change in either direction.

## Troubleshooting

### Webhook Not Working
1. Check that `CLERK_WEBHOOK_SECRET` is correctly set in `.env`
2. Verify webhook endpoint is accessible: `https://your-domain.com/api/webhooks/clerk`
3. Check Clerk Dashboard → Webhooks → Your endpoint → Recent attempts
4. Look for error messages in your application logs

### Role Not Syncing to Clerk
1. Check that `CLERK_SECRET_KEY` is correctly set in `.env`
2. Check application logs for error messages when updating role
3. Verify the API call to Clerk succeeded (check console logs)

### Role Not Syncing from Clerk
1. Verify webhook is properly configured in Clerk Dashboard
2. Check that the webhook secret matches your `.env` file
3. Look for webhook delivery attempts in Clerk Dashboard
4. Check your application logs for webhook processing errors

## Security Notes

- Only admins can update user roles through the admin panel
- Webhook endpoint is protected by signature verification
- All role changes are logged in application console
- Failed syncs don't block the primary operation (database or Clerk update)

## API Endpoints

- **Update Role**: `PATCH /api/admin/users/[userId]`
  - Updates role in database and syncs to Clerk
- **Webhook Handler**: `POST /api/webhooks/clerk`
  - Receives updates from Clerk and syncs to database

## Example: Making a User an Admin

### Via Admin Panel (Easiest):
1. Login as admin
2. Go to `/admin/users`
3. Find the user
4. Click three dots → Update Role → Select "ADMIN"

### Via Clerk Dashboard:
1. Go to Clerk Dashboard
2. Users → Select user
3. Public metadata → Edit
4. Add: `{ "role": "ADMIN" }`
5. Save (will auto-sync to database)

## Initial Setup for Existing Users

If you have existing users in Clerk without roles set:
1. They will default to "STUDENT" role
2. You can bulk update via admin panel or Clerk dashboard
3. The sync will work immediately once configured

---

**Note**: Make sure to redeploy your application after adding the webhook endpoint and environment variables.
