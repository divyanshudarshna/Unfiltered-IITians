import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// GET a specific material category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    

    const category = await prisma.materialCategory.findUnique({
      where: { id: params.id },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching material category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material category' },
      { status: 500 }
    );
  }
}

// PUT update a material category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
   

    const body = await request.json();
    const { name, desc } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.materialCategory.findUnique({
      where: { id: params.id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if another category with the same name already exists
    const duplicateCategory = await prisma.materialCategory.findUnique({
      where: { name },
    });

    if (duplicateCategory && duplicateCategory.id !== params.id) {
      return NextResponse.json(
        { error: 'Another category with this name already exists' },
        { status: 409 }
      );
    }

    const category = await prisma.materialCategory.update({
      where: { id: params.id },
      data: {
        name,
        desc: desc || null,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating material category:', error);
    return NextResponse.json(
      { error: 'Failed to update material category' },
      { status: 500 }
    );
  }
}

// DELETE a material category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  

    // Check if category exists
    const existingCategory = await prisma.materialCategory.findUnique({
      where: { id: params.id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if category has materials
    const materialsCount = await prisma.material.count({
      where: { subjectId: params.id },
    });

    if (materialsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with associated materials' },
        { status: 400 }
      );
    }

    await prisma.materialCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting material category:', error);
    return NextResponse.json(
      { error: 'Failed to delete material category' },
      { status: 500 }
    );
  }
}