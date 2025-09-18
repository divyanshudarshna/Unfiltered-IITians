import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// GET all material categories
export async function GET(request: NextRequest) {
  try {
   

    const categories = await prisma.materialCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching material categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material categories' },
      { status: 500 }
    );
  }
}

// POST create a new material category
export async function POST(request: NextRequest) {
  try {
  
    const body = await request.json();
    const { name, desc } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if category with same name already exists
    const existingCategory = await prisma.materialCategory.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      );
    }

    const category = await prisma.materialCategory.create({
      data: {
        name,
        desc: desc || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating material category:', error);
    return NextResponse.json(
      { error: 'Failed to create material category' },
      { status: 500 }
    );
  }
}