import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// GET all materials
export async function GET(request: NextRequest) {
  try {
   

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
    const where = categoryId && categoryId !== 'all' ? { subjectId: categoryId } : {};
    
    const materials = await prisma.material.findMany({
      where,
      include: {
        subject: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST create a new material
export async function POST(request: NextRequest) {
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

    // Generate slug from title if not provided
    let generatedSlug = slug;
    if (!generatedSlug) {
      generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    // Ensure slug is unique
    let uniqueSlug = generatedSlug;
    let counter = 1;
    while (await prisma.material.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${generatedSlug}-${counter}`;
      counter++;
    }

    const material = await prisma.material.create({
      data: {
        title,
        slug: uniqueSlug,
        content,
        pdfUrl,
        youtubeLink,
        tags: tags || [],
        order: order || 0,
        published: published !== undefined ? published : true,
        subjectId,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    );
  }
}