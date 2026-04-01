import { NextResponse } from 'next/server';
import { verifyEmailConfig } from '@/lib/email';

export async function GET() {
  try {
    
    
    
    
    const result = await verifyEmailConfig();
    
    return NextResponse.json({
      configured: result.success,
      message: result.message || result.error,
      env: {
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPassword: !!process.env.EMAIL_PASSWORD,
      }
    });
  } catch (error) {
    console.error('❌ Email config check error:', error);
    return NextResponse.json({
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
