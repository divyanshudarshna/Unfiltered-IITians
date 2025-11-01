# 📧 Email Templates Usage Guide

Complete guide for using the email service with all available templates and integration examples.

---

## 🚀 Quick Start

### Import the Email Service
```typescript
import { sendEmail } from '@/lib/email';
```

### Basic Usage Pattern
```typescript
await sendEmail({
  to: 'user@example.com',
  template: 'template_name',
  data: {
    // template-specific data
  }
});
```

---

## 📬 Available Email Templates

### 1. Welcome Email (`welcome`)
**When to Use:** New user registration

**Required Data:**
- `userName` (optional but recommended)

**Example Integration:**
```typescript
// After user registration
import { sendEmail } from '@/lib/email';

// In your registration API route
export async function POST(req: Request) {
  // ... create user logic ...
  
  // Send welcome email (non-blocking)
  sendEmail({
    to: newUser.email,
    template: 'welcome',
    data: {
      userName: newUser.name || 'Student',
    },
  }).catch(err => console.error('Failed to send welcome email:', err));
  
  return NextResponse.json({ user: newUser });
}
```

**Test Syntax:**
```typescript
// Test welcome email
await sendEmail({
  to: 'test@example.com',
  template: 'welcome',
  data: {
    userName: 'John Doe',
  }
});
```

**What User Receives:**
- Personalized welcome message
- Platform overview with highlights
- "Go to Dashboard" button (links to `/john/dashboard`)
- "Browse Courses" button (links to `/courses`)
- Branding: "Unfiltered IITians by Divyanshu Darshna"

---

### 2. Course Purchase Email (`course_purchase`)
**When to Use:** After successful course purchase

**Required Data:**
- `userName` (optional but recommended)
- `courseName` (required)
- `purchaseAmount` (optional)

**Example Integration:**
```typescript
// In your course purchase API route
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  const { userId, courseId } = await req.json();
  
  // Process purchase...
  const purchase = await createCoursePurchase(userId, courseId);
  const user = await getUser(userId);
  const course = await getCourse(courseId);
  
  // Send confirmation email
  sendEmail({
    to: user.email,
    template: 'course_purchase',
    data: {
      userName: user.name,
      courseName: course.title,
      purchaseAmount: course.price,
    },
  }).catch(err => console.error('Failed to send email:', err));
  
  return NextResponse.json({ success: true, purchase });
}
```

**Test Syntax:**
```typescript
// Test course purchase email
await sendEmail({
  to: 'test@example.com',
  template: 'course_purchase',
  data: {
    userName: 'John Doe',
    courseName: 'Advanced Mathematics for JEE',
    purchaseAmount: '1999',
  }
});
```

**What User Receives:**
- Congratulations message
- Purchase details (course name, amount, date, lifetime access)
- "Access Your Course" button (links to `/my-courses`)
- "Go to Dashboard" button (links to `/john/dashboard`)
- Footer links to website and courses page

---

### 3. Mock Test Purchase Email (`mock_purchase`)
**When to Use:** After mock test purchase

**Required Data:**
- `userName` (optional but recommended)
- `mockName` (required)
- `purchaseAmount` (optional)

**Example Integration:**
```typescript
// In your mock purchase API route
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  const { userId, mockId } = await req.json();
  
  // Process purchase...
  const purchase = await createMockPurchase(userId, mockId);
  const user = await getUser(userId);
  const mock = await getMock(mockId);
  
  // Send confirmation email
  sendEmail({
    to: user.email,
    template: 'mock_purchase',
    data: {
      userName: user.name,
      mockName: mock.title,
      purchaseAmount: mock.price,
    },
  }).catch(err => console.error('Failed to send email:', err));
  
  return NextResponse.json({ success: true, purchase });
}
```

**Test Syntax:**
```typescript
// Test mock purchase email
await sendEmail({
  to: 'test@example.com',
  template: 'mock_purchase',
  data: {
    userName: 'John Doe',
    mockName: 'JEE Advanced Mock Test - Full Syllabus',
    purchaseAmount: '499',
  }
});
```

**What User Receives:**
- Purchase confirmation
- Mock test details (name, amount, date)
- Pro tips for taking the test
- "Start Mock Test" button (links to `/mocks`)
- "Go to Dashboard" button (links to `/john/dashboard`)

---

### 4. Guidance Session Email (`guidance_session`)
**When to Use:** After booking a guidance session

**Required Data:**
- `userName` (optional but recommended)
- `sessionDate` (optional but recommended)
- `sessionTime` (optional but recommended)
- `purchaseAmount` (optional)

**Example Integration:**
```typescript
// In your guidance booking API route
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  const { userId, sessionDate, sessionTime } = await req.json();
  
  // Create booking...
  const booking = await createGuidanceBooking(userId, sessionDate, sessionTime);
  const user = await getUser(userId);
  
  // Format date nicely
  const formattedDate = new Date(sessionDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  // Send confirmation email
  sendEmail({
    to: user.email,
    template: 'guidance_session',
    data: {
      userName: user.name,
      sessionDate: formattedDate,
      sessionTime: sessionTime,
      purchaseAmount: '999',
    },
  }).catch(err => console.error('Failed to send email:', err));
  
  return NextResponse.json({ success: true, booking });
}
```

**Test Syntax:**
```typescript
// Test guidance session email
await sendEmail({
  to: 'test@example.com',
  template: 'guidance_session',
  data: {
    userName: 'John Doe',
    sessionDate: 'January 15, 2025',
    sessionTime: '5:00 PM IST',
    purchaseAmount: '999',
  }
});
```

**What User Receives:**
- Booking confirmation
- Session details (date, time, amount paid)
- Important reminders (join early, prepare questions, etc.)
- "View Dashboard" button (links to `/john/dashboard`)
- "Browse More Sessions" button (links to `/guidance`)

---

### 5. Subscription Email (`subscription`)
**When to Use:** After subscription activation

**Required Data:**
- `userName` (optional but recommended)
- `additionalInfo` (optional - for extra details)

**Example Integration:**
```typescript
// In your subscription activation route
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  const { userId, planId } = await req.json();
  
  // Activate subscription...
  const subscription = await activateSubscription(userId, planId);
  const user = await getUser(userId);
  
  // Send activation email
  sendEmail({
    to: user.email,
    template: 'subscription',
    data: {
      userName: user.name,
      additionalInfo: 'Your subscription is valid for 12 months and includes access to all premium features.',
    },
  }).catch(err => console.error('Failed to send email:', err));
  
  return NextResponse.json({ success: true, subscription });
}
```

**Test Syntax:**
```typescript
// Test subscription email
await sendEmail({
  to: 'test@example.com',
  template: 'subscription',
  data: {
    userName: 'John Doe',
    additionalInfo: 'Your annual subscription includes unlimited access to all courses and mock tests.',
  }
});
```

**What User Receives:**
- Activation confirmation
- List of premium benefits
- Additional info (if provided)
- "Go to Dashboard" button (links to `/john/dashboard`)
- "Explore Courses" button (links to `/courses`)

---

### 6. Custom Email (`custom`)
**When to Use:** For any custom notification or message

**Required Data:**
- `customSubject` (required)
- `customHtml` (required)

**Example Integration:**
```typescript
// For custom notifications
import { sendEmail } from '@/lib/email';

export async function sendCustomNotification(userEmail: string, message: string) {
  await sendEmail({
    to: userEmail,
    customSubject: 'Important Update from Unfiltered IITians',
    customHtml: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hello!</h2>
        <p>${message}</p>
        <p>Best regards,<br><strong>Team Unfiltered IITians</strong></p>
      </div>
    `,
  });
}
```

**Test Syntax:**
```typescript
// Test custom email
await sendEmail({
  to: 'test@example.com',
  customSubject: 'New Feature Announcement',
  customHtml: `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Exciting News!</h2>
        <p>We've just launched a new feature...</p>
        <a href="https://yourdomain.com" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Learn More</a>
      </body>
    </html>
  `,
});
```

---

## 🔧 Advanced Usage

### Using the API Endpoint
You can also send emails via the API endpoint:

**Endpoint:** `POST /api/email/send`

**Request Body:**
```json
{
  "to": "user@example.com",
  "template": "course_purchase",
  "data": {
    "userName": "John Doe",
    "courseName": "Advanced Mathematics",
    "purchaseAmount": "1999"
  }
}
```

**Example with Fetch:**
```typescript
// Send email via API
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: user.email,
    template: 'welcome',
    data: {
      userName: user.name,
    },
  }),
});

const result = await response.json();
if (result.success) {
  console.log('Email sent!', result.messageId);
}
```

---

## 📊 All Template Data Fields

### EmailData Interface
```typescript
interface EmailData {
  userName?: string;           // User's full name (e.g., "John Doe")
  courseName?: string;         // Course title
  mockName?: string;           // Mock test name
  sessionDate?: string;        // Formatted date string
  sessionTime?: string;        // Time with timezone
  purchaseAmount?: string;     // Price as string (e.g., "1999")
  additionalInfo?: string;     // Any extra information
}
```

---

## 🎯 Best Practices

### 1. Always Use Async/Await with Error Handling
```typescript
// ✅ GOOD - Non-blocking with error handling
sendEmail({
  to: user.email,
  template: 'welcome',
  data: { userName: user.name }
}).catch(err => console.error('Email failed:', err));

// ❌ BAD - Blocks execution
await sendEmail({ ... });
```

### 2. Don't Throw Errors on Email Failure
```typescript
// ✅ GOOD - Log error, don't break flow
sendEmail({ ... }).catch(err => {
  console.error('Failed to send email:', err);
  // Continue with the rest of the code
});

// ❌ BAD - Breaks user flow if email fails
try {
  await sendEmail({ ... });
} catch (err) {
  throw new Error('Purchase failed'); // Don't do this!
}
```

### 3. Provide Meaningful User Names
```typescript
// ✅ GOOD
data: {
  userName: user.name || user.firstName || 'Student'
}

// ❌ BAD
data: {
  userName: user.id // Wrong!
}
```

### 4. Format Dates Properly
```typescript
// ✅ GOOD
const formattedDate = new Date(sessionDate).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

data: {
  sessionDate: formattedDate // "January 15, 2025"
}

// ❌ BAD
data: {
  sessionDate: sessionDate // "2025-01-15T00:00:00.000Z"
}
```

---

## 🔍 Complete Integration Examples

### Example 1: Course Purchase Flow
```typescript
// app/api/course/purchase/route.ts
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, courseId, amount } = await req.json();
    
    // 1. Create purchase record
    const purchase = await prisma.coursePurchase.create({
      data: { userId, courseId, amount },
    });
    
    // 2. Get user and course details
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    
    // 3. Send confirmation email (non-blocking)
    if (user && course) {
      sendEmail({
        to: user.email,
        template: 'course_purchase',
        data: {
          userName: user.name,
          courseName: course.title,
          purchaseAmount: amount.toString(),
        },
      }).catch(err => console.error('Failed to send purchase email:', err));
    }
    
    // 4. Return success
    return NextResponse.json({ 
      success: true, 
      purchase,
      message: 'Purchase successful! Check your email for confirmation.' 
    });
    
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 });
  }
}
```

### Example 2: Bulk Email Sending
```typescript
// Send emails to multiple users
async function sendBulkWelcomeEmails(users: User[]) {
  const emailPromises = users.map(user =>
    sendEmail({
      to: user.email,
      template: 'welcome',
      data: { userName: user.name }
    }).catch(err => {
      console.error(`Failed to send to ${user.email}:`, err);
      return { success: false, email: user.email };
    })
  );
  
  const results = await Promise.allSettled(emailPromises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Emails sent: ${successful} success, ${failed} failed`);
}
```

### Example 3: Conditional Email Sending
```typescript
// Send different emails based on user type
async function sendPurchaseEmail(user: User, purchase: Purchase) {
  if (purchase.type === 'course') {
    await sendEmail({
      to: user.email,
      template: 'course_purchase',
      data: {
        userName: user.name,
        courseName: purchase.itemName,
        purchaseAmount: purchase.amount,
      }
    });
  } else if (purchase.type === 'mock') {
    await sendEmail({
      to: user.email,
      template: 'mock_purchase',
      data: {
        userName: user.name,
        mockName: purchase.itemName,
        purchaseAmount: purchase.amount,
      }
    });
  }
}
```

---

## ⚙️ Environment Setup

### Required Environment Variables
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# App URL (optional - auto-detects)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Gmail Setup Steps
1. Enable 2-Factor Authentication: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `EMAIL_PASSWORD`

---

## 🧪 Testing

### Test All Templates
```typescript
// Create a test file: test-emails.ts
import { sendEmail } from '@/lib/email';

const testEmail = 'your-test-email@example.com';

async function testAllTemplates() {
  // Test welcome email
  await sendEmail({
    to: testEmail,
    template: 'welcome',
    data: { userName: 'Test User' }
  });
  
  // Test course purchase
  await sendEmail({
    to: testEmail,
    template: 'course_purchase',
    data: {
      userName: 'Test User',
      courseName: 'Test Course',
      purchaseAmount: '1999'
    }
  });
  
  // Test mock purchase
  await sendEmail({
    to: testEmail,
    template: 'mock_purchase',
    data: {
      userName: 'Test User',
      mockName: 'Test Mock',
      purchaseAmount: '499'
    }
  });
  
  // Test guidance session
  await sendEmail({
    to: testEmail,
    template: 'guidance_session',
    data: {
      userName: 'Test User',
      sessionDate: 'January 15, 2025',
      sessionTime: '5:00 PM IST'
    }
  });
  
  // Test subscription
  await sendEmail({
    to: testEmail,
    template: 'subscription',
    data: { userName: 'Test User' }
  });
  
  console.log('All test emails sent!');
}

testAllTemplates();
```

---

## 📝 Quick Reference

### Template Names
- `welcome` - New user registration
- `course_purchase` - Course purchased
- `mock_purchase` - Mock test purchased
- `guidance_session` - Session booked
- `subscription` - Subscription activated
- `custom` - Custom messages (use `customSubject` + `customHtml`)

### Common Data Fields
- `userName` - User's name (always recommended)
- `courseName` - Course title
- `mockName` - Mock test name
- `sessionDate` - Date string
- `sessionTime` - Time string
- `purchaseAmount` - Price as string
- `additionalInfo` - Extra details

### Email Features
- ✅ Responsive HTML design
- ✅ Dynamic dashboard links (`/${firstName}/dashboard`)
- ✅ Multiple action buttons
- ✅ Branded footer with links
- ✅ Auto-detects environment (local/production)

---

## 🔗 Links in Emails

All emails automatically include:
- **Dashboard**: `/${firstName}/dashboard`
- **Home**: `/`
- **Courses**: `/courses`
- **Mocks**: `/mocks`
- **Guidance**: `/guidance`
- **My Courses**: `/my-courses`

Links automatically work for both local and production environments!

---

## 🎨 Branding

Every email includes:
- **Header**: Gradient background with emoji
- **Body**: "Unfiltered IITians by Divyanshu Darshna"
- **Footer**: Copyright + website links

---

## 💡 Tips

1. **Always handle errors** - Email failures shouldn't break your app
2. **Send async** - Don't block user actions waiting for email delivery
3. **Test in spam folder** - Check if emails are marked as spam
4. **Monitor logs** - Track successful and failed email sends
5. **Format dates** - Use readable date formats for users

---

**Created for:** Unfiltered IITians Platform  
**Last Updated:** November 2, 2025  
**Version:** 1.0
