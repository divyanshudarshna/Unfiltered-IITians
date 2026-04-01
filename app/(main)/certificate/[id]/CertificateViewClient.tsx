"use client";

import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Download, Loader2, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import CertificateTemplate from "@/components/certificate/CertificateTemplate";
import { CertificateData } from "@/types/certificate";

interface CertificateViewClientProps {
  certificate: CertificateData;
}

export default function CertificateViewClient({ certificate }: CertificateViewClientProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!certificateRef.current) return;

    setIsDownloading(true);
    try {
      const imgData = await toPng(certificateRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
      pdf.save(`certificate-${certificate.certificateId}.pdf`);

      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      
      // Fallback to PNG download
      try {
        if (!certificateRef.current) throw error;
        
        const fallbackPng = await toPng(certificateRef.current, {
          cacheBust: true,
          pixelRatio: 1,
          backgroundColor: "#ffffff",
        });

        const link = document.createElement("a");
        link.href = fallbackPng;
        link.download = `certificate-${certificate.certificateId}.png`;
        link.click();
        toast.success("Downloaded as image. You can print it as PDF.");
      } catch (fallbackError) {
        console.error("Download fallback error:", fallbackError);
        toast.error("Failed to download certificate");
      }
    } finally {
      setIsDownloading(false);
    }
  }, [certificate.certificateId]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Certificate of Completion
          </h1>
          <p className="text-slate-400">
            Awarded to <span className="text-purple-400 font-semibold">{certificate.studentName}</span>
          </p>
        </div>

        {/* Certificate Preview */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
          <div className="overflow-auto flex justify-center">
            <div className="transform scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 origin-top">
              <CertificateTemplate ref={certificateRef} certificate={certificate} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Download PDF
              </>
            )}
          </Button>

          <Button
            onClick={handleShare}
            size="lg"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5 mr-2" />
                Share Link
              </>
            )}
          </Button>
        </div>

        {/* Certificate Info */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>
            Certificate ID: <span className="font-mono text-slate-400">{certificate.certificateId}</span>
          </p>
          <p className="mt-2">
            Issued by <span className="text-purple-400">Unfiltered IITians</span>
          </p>
        </div>
      </div>
    </div>
  );
}
