"use client";

import { useState } from "react";
import { Award, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import CertificateModal from "./CertificateModal";
import { CertificateData } from "@/types/certificate";
import { toast } from "sonner";

interface CertificateButtonProps {
  courseId: string;
  courseName: string;
  courseType: "COMPETITIVE" | "SKILLS" | "WORKSHOP";
  progress: number;
  durationMonths: number;
  existingCertificate?: CertificateData | null;
}

export default function CertificateButton({
  courseId,
  courseName,
  courseType,
  progress,
  durationMonths,
  existingCertificate,
}: CertificateButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(
    existingCertificate || null
  );

  // Only SKILLS courses are eligible for certificates
  const isSkillsCourse = courseType === "SKILLS";
  const isCompleted = progress >= 100;
  const isEligible = isSkillsCourse && isCompleted;

  const handleClick = async () => {
    if (!isEligible) return;

    // If certificate already exists, just open the modal
    if (certificate) {
      setIsModalOpen(true);
      return;
    }

    // Generate new certificate
    setIsLoading(true);
    try {
      const response = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate certificate");
      }

      // Set the certificate data
      const certData: CertificateData = {
        id: data.certificate.id,
        certificateId: data.certificate.certificateId,
        studentName: data.certificate.studentName,
        courseName: data.certificate.courseName,
        courseType: courseType,
        completionDate: data.certificate.completionDate,
        issuedAt: data.certificate.issuedAt,
        durationMonths: durationMonths,
        instructorName: "Divyanshu Darshna",
        instructorDesignation: "Founder & Instructor",
        companyName: "Unfiltered IITians",
      };

      setCertificate(certData);
      setIsModalOpen(true);
      toast.success("Certificate generated successfully!");
    } catch (error: any) {
      console.error("Certificate generation error:", error);
      toast.error(error.message || "Failed to generate certificate");
    } finally {
      setIsLoading(false);
    }
  };

  // If not a skills course, show nothing
  if (!isSkillsCourse) {
    return null;
  }

  return (
    <>
      <div className="w-full">
        {isEligible ? (
          // Eligible state - with animated border gradient
          <HoverBorderGradient
            containerClassName="rounded-full w-full"
            className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-background dark:bg-background"
            as="button"
            onClick={handleClick}
            duration={1.5}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Award className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-sm font-medium text-foreground">
              {isLoading
                ? "Getting your certificate..."
                : certificate
                ? "View Certificate"
                : "Get Certificate"}
            </span>
          </HoverBorderGradient>
        ) : (
          // Locked state - static button with red lock, no animation
          <button
            disabled
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-full",
              "bg-muted/30 border border-border/50",
              "cursor-not-allowed"
            )}
          >
            <Lock className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </button>
        )}
      </div>

      {/* Certificate Modal */}
      {certificate && (
        <CertificateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          certificate={certificate}
          courseId={courseId}
        />
      )}
    </>
  );
}
