// app/(main)/certificate/[id]/page.tsx
// Public certificate view page - allows viewing and downloading certificate by ID

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CertificateViewClient from "./CertificateViewClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificatePage({ params }: PageProps) {
  const { id } = await params;

  // Fetch certificate by certificateId (the public ID like UNF-2024-XXXXXXXX)
  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [
        { certificateId: id },
        { id: id },
      ],
    },
    include: {
      course: {
        select: {
          durationMonths: true,
          courseType: true,
        },
      },
    },
  });

  if (!certificate) {
    notFound();
  }

  const certificateData = {
    id: certificate.id,
    certificateId: certificate.certificateId,
    studentName: certificate.studentName,
    courseName: certificate.courseName,
    courseType: certificate.course.courseType as "COMPETITIVE" | "SKILLS" | "WORKSHOP",
    completionDate: certificate.completionDate.toISOString(),
    issuedAt: certificate.issuedAt.toISOString(),
    durationMonths: certificate.course.durationMonths || 1,
    instructorName: "Divyanshu Darshna",
    instructorDesignation: "Founder & Instructor",
    companyName: "Unfiltered IITians",
  };

  return <CertificateViewClient certificate={certificateData} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [
        { certificateId: id },
        { id: id },
      ],
    },
  });

  if (!certificate) {
    return {
      title: "Certificate Not Found",
    };
  }

  return {
    title: `Certificate - ${certificate.studentName} | Unfiltered IITians`,
    description: `Certificate of completion for ${certificate.courseName} awarded to ${certificate.studentName}`,
    openGraph: {
      title: `Certificate of Completion - ${certificate.courseName}`,
      description: `Awarded to ${certificate.studentName} by Unfiltered IITians`,
    },
  };
}
