import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { Parser } from 'json2csv';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
  
 

    const subscriptions = await prisma.newsletter.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Convert to CSV
    const fields = ['email', 'createdAt', 'updatedAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(subscriptions);

    // Create response with CSV file
    const response = new NextResponse(csv);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', 'attachment; filename="newsletter-subscriptions.csv"');
    
    return response;
  } catch (error) {
    console.error('Export newsletter error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}