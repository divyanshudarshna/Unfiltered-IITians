import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

// GET all newsletter subscriptions
export async function GET(request: NextRequest) {
  try {
   
    
   

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [subscriptions, totalCount] = await Promise.all([
      prisma.newsletter.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.newsletter.count(),
    ]);

    return NextResponse.json({
      subscriptions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get newsletter subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a subscription
export async function DELETE(request: NextRequest) {
  try {
    
    
    

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    await prisma.newsletter.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Delete newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}