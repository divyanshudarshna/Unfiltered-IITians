import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// GET a specific material
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    const material = await prisma.material.findUnique({
      where: { id: params.id },
      include: {
        subject: true,
      },
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material' },
      { status: 500 }
    );
  }
}

// PUT update a material
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  
    const body = await request.json();
    const {
      title,
      slug,
      content,
      pdfUrl,
      youtubeLink,
      tags,
      order,
      published,
      subjectId,
    } = body;

    // Check if material exists
    const existingMaterial = await prisma.material.findUnique({
      where: { id: params.id },
    });

    if (!existingMaterial) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Handle slug uniqueness if it's being changed
    let uniqueSlug = slug || existingMaterial.slug;
    if (slug && slug !== existingMaterial.slug) {
      let counter = 1;
      const baseSlug = slug;
      while (await prisma.material.findUnique({ 
        where: { slug: uniqueSlug, NOT: { id: params.id } } 
      })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const material = await prisma.material.update({
      where: { id: params.id },
      data: {
        title,
        slug: uniqueSlug,
        content,
        pdfUrl,
        youtubeLink,
        tags: tags || [],
        order: order || 0,
        published: published !== undefined ? published : existingMaterial.published,
        subjectId,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    );
  }
}

// DELETE a material
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  

    // Check if material exists
    const existingMaterial = await prisma.material.findUnique({
      where: { id: params.id },
    });

    if (!existingMaterial) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    await prisma.material.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    );
  }
}