"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Mail, Loader2, CheckCircle, Sparkles, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CertificateTemplate from "./CertificateTemplate";
import { CertificateData } from "@/types/certificate";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateData | null;
  courseId: string;
  onEmailSent?: () => void;
}

// Confetti particle component
const ConfettiParticle = ({ delay, color }: { delay: number; color: string }) => {
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 720 - 360;
  const randomDuration = 2 + Math.random() * 2;

  return (
    <motion.div
      className="absolute w-3 h-3 rounded-sm"
      style={{
        backgroundColor: color,
        left: `${randomX}%`,
        top: "-20px",
      }}
      initial={{ y: 0, rotate: 0, opacity: 1 }}
      animate={{
        y: "100vh",
        rotate: randomRotation,
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: randomDuration,
        delay: delay,
        ease: "easeIn",
      }}
    />
  );
};

// Confetti container
const Confetti = ({ show }: { show: boolean }) => {
  const colors = [
    "#FFD700", // Gold
    "#FF6B6B", // Coral
    "#4ECDC4", // Teal
    "#A855F7", // Purple
    "#3B82F6", // Blue
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#EC4899", // Pink
  ];

  const particles = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      {particles.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          delay={particle.delay}
          color={particle.color}
        />
      ))}
    </div>
  );
};

export default function CertificateModal({
  isOpen,
  onClose,
  certificate,
  courseId,
  onEmailSent,
}: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [scale, setScale] = useState(0.5);

  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen && certificate) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, certificate]);

  // Reset email sent state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmailSent(false);
      setScale(0.5);
    }
  }, [isOpen]);

  // Adjust scale based on window size
  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setScale(0.35);
      } else if (width < 640) {
        setScale(0.45);
      } else if (width < 768) {
        setScale(0.55);
      } else if (width < 1024) {
        setScale(0.65);
      } else {
        setScale(0.75);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 1.2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.3));
  };

  const handleDownload = useCallback(async () => {
    if (!certificateRef.current || !certificate) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [900, 636],
      });

      pdf.addImage(imgData, "PNG", 0, 0, 900, 636);
      pdf.save(`certificate-${certificate.certificateId}.pdf`);

      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download certificate");
    } finally {
      setIsDownloading(false);
    }
  }, [certificate]);

  const handleEmail = useCallback(async () => {
    if (!certificate) return;

    setIsEmailing(true);
    try {
      const response = await fetch("/api/certificates/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateId: certificate.id,
          courseId: courseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setEmailSent(true);
      toast.success("Certificate sent to your email!");
      onEmailSent?.();
    } catch (error: any) {
      console.error("Email error:", error);
      toast.error(error.message || "Failed to send certificate email");
    } finally {
      setIsEmailing(false);
    }
  }, [certificate, courseId, onEmailSent]);

  if (!certificate) return null;

  return (
    <>
      <Confetti show={showConfetti} />
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-5xl h-[90vh] max-h-[90vh] p-0 overflow-hidden bg-gradient-to-br from-background to-muted/50 flex flex-col">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 shrink-0 border-b">
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <Sparkles className="h-5 w-5 sm:h-7 sm:w-7 text-amber-500" />
              </motion.div>
              <span className="text-amber-500 font-bold">
                Congratulations!
              </span>
            </DialogTitle>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              You have successfully completed the course. Here is your certificate!
            </p>
          </DialogHeader>

          {/* Certificate Preview - Scrollable */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              {/* Zoom Controls */}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              {/* Certificate Container with scroll */}
              <div 
                className="overflow-auto w-full flex justify-center pb-4 rounded-lg border shadow-inner"
                style={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.5)", 
                  borderColor: "#e5e7eb" 
                }}
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top center",
                    transition: "transform 0.2s ease-out",
                  }}
                >
                  <CertificateTemplate ref={certificateRef} certificate={certificate} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer Actions - Fixed */}
          <div className="shrink-0 p-4 sm:p-6 pt-3 sm:pt-4 border-t bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center"
            >
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto sm:min-w-[180px]"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    <span className="text-sm sm:text-base">Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-sm sm:text-base">Download PDF</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handleEmail}
                disabled={isEmailing || emailSent}
                size="lg"
                variant={emailSent ? "secondary" : "outline"}
                className="w-full sm:w-auto sm:min-w-[180px] transition-all duration-200"
                style={
                  emailSent
                    ? {
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        color: "#059669",
                        borderColor: "rgba(16, 185, 129, 0.3)",
                      }
                    : undefined
                }
              >
                {isEmailing ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    <span className="text-sm sm:text-base">Sending...</span>
                  </>
                ) : emailSent ? (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-sm sm:text-base">Email Sent!</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-sm sm:text-base">Email Certificate</span>
                  </>
                )}
              </Button>
            </motion.div>

            {/* Certificate Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-xs text-muted-foreground mt-3"
            >
              <p>
                Certificate ID: <span className="font-mono">{certificate.certificateId}</span>
              </p>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
