"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { CertificateData } from "@/types/certificate";
import { format } from "date-fns";

interface CertificateTemplateProps {
  certificate: CertificateData;
  className?: string;
}

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ certificate, className = "" }, ref) => {
    const formattedDate = format(
      new Date(certificate.completionDate),
      "MMMM dd, yyyy"
    );

    const formattedIssuedDate = format(
      new Date(certificate.issuedAt),
      "MMMM dd, yyyy"
    );

    return (
      <div
        ref={ref}
        className={`relative w-[900px] h-[636px] overflow-hidden ${className}`}
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Elegant Border Frame */}
        <div className="absolute inset-0 p-3">
          <div 
            className="absolute inset-3 border-[3px] rounded-sm" 
            style={{ borderColor: "rgba(217, 119, 6, 0.8)" }}
          />
          <div 
            className="absolute inset-5 border rounded-sm" 
            style={{ borderColor: "rgba(245, 158, 11, 0.5)" }}
          />
        </div>

        {/* Corner Decorations */}
        <div 
          className="absolute top-6 left-6 w-16 h-16 border-l-4 border-t-4 rounded-tl-lg" 
          style={{ borderColor: "rgba(217, 119, 6, 0.7)" }}
        />
        <div 
          className="absolute top-6 right-6 w-16 h-16 border-r-4 border-t-4 rounded-tr-lg" 
          style={{ borderColor: "rgba(217, 119, 6, 0.7)" }}
        />
        <div 
          className="absolute bottom-6 left-6 w-16 h-16 border-l-4 border-b-4 rounded-bl-lg" 
          style={{ borderColor: "rgba(217, 119, 6, 0.7)" }}
        />
        <div 
          className="absolute bottom-6 right-6 w-16 h-16 border-r-4 border-b-4 rounded-br-lg" 
          style={{ borderColor: "rgba(217, 119, 6, 0.7)" }}
        />

        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Main Content */}
        <div className="relative h-full flex flex-col items-center justify-between py-10 px-16">
          {/* Header Section */}
          <div className="text-center space-y-2">
            {/* Logo & Brand */}
            <div className="flex items-center justify-center gap-4 mb-2">
              {/* Golden Logo Container */}
              <div 
                className="relative w-16 h-16 rounded-full overflow-hidden shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFD700 50%, #DAA520 75%, #FFD700 100%)",
                  padding: "3px",
                }}
              >
                <div 
                  className="relative w-full h-full rounded-full overflow-hidden"
                  style={{ backgroundColor: "#ffffff" }}
                >
                  <Image
                    src="/unf_logo.jpeg"
                    alt="Unfiltered IITians Logo"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold tracking-wide" style={{ color: "#1f2937" }}>
                  Divyanshu <span style={{ color: "#7c3aed" }}>Darshna</span>
                </h2>
                <p className="text-xs tracking-widest uppercase" style={{ color: "#6b7280" }}>
                  Unfiltered IITians
                </p>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="pt-2">
              <p 
                className="text-sm tracking-[0.3em] uppercase font-medium"
                style={{
                  background: "linear-gradient(135deg, #B8860B 0%, #FFD700 50%, #B8860B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Certificate of Completion
              </p>
              <div 
                className="w-32 h-0.5 mx-auto mt-2"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)",
                }}
              />
            </div>
          </div>

          {/* Main Body */}
          <div className="text-center space-y-6 flex-1 flex flex-col justify-center max-w-2xl">
            <p className="text-base tracking-wide" style={{ color: "#4b5563" }}>
              This is to certify that
            </p>

            {/* Student Name */}
            <div className="relative py-3">
              <h1 className="text-4xl font-bold tracking-wide capitalize" style={{ color: "#1f2937" }}>
                {certificate.studentName}
              </h1>
              <div 
                className="absolute bottom-0 left-1/2 w-64 h-px" 
                style={{ 
                  transform: "translateX(-50%)",
                  background: "linear-gradient(to right, transparent, #9ca3af, transparent)" 
                }} 
              />
            </div>

            <p className="text-base tracking-wide" style={{ color: "#4b5563" }}>
              has successfully completed the course
            </p>

            {/* Course Name */}
            <div className="py-2">
              <h2 className="text-2xl font-semibold tracking-wide" style={{ color: "#7c3aed" }}>
                {certificate.courseName}
              </h2>
              <p className="text-sm mt-2" style={{ color: "#6b7280" }}>
                Duration: {certificate.durationMonths}{" "}
                {certificate.durationMonths === 1 ? "month" : "months"}
              </p>
            </div>

            <p className="text-sm tracking-wide" style={{ color: "#4b5563" }}>
              Completed on{" "}
              <span className="font-semibold" style={{ color: "#1f2937" }}>{formattedDate}</span>
            </p>
          </div>

          {/* Footer Section */}
          <div className="w-full">
            {/* Signature Section */}
            <div className="flex justify-between items-end px-8 mb-6">
              <div className="text-center">
                <div className="w-48 mb-2" style={{ borderBottom: "1px solid #9ca3af" }} />
                <p className="text-xs uppercase tracking-widest" style={{ color: "#9ca3af" }}>
                  Date of Issue
                </p>
                <p className="text-sm font-medium mt-1" style={{ color: "#374151" }}>
                  {formattedIssuedDate}
                </p>
              </div>

              <div className="text-center">
                {/* Signature Placeholder */}
                <div className="w-48 h-12 flex items-end justify-center">
                  <p
                    className="text-2xl italic"
                    style={{ fontFamily: "'Brush Script MT', cursive", color: "#374151" }}
                  >
                    {certificate.instructorName}
                  </p>
                </div>
                <div className="w-48 mb-2" style={{ borderBottom: "1px solid #9ca3af" }} />
                <p className="text-sm font-semibold" style={{ color: "#1f2937" }}>
                  {certificate.instructorName}
                </p>
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  {certificate.instructorDesignation}
                </p>
              </div>
            </div>

            {/* Certificate ID with golden accent */}
            <div className="text-center pt-3" style={{ borderTop: "1px solid #e5e7eb" }}>
              <p className="text-xs tracking-widest" style={{ color: "#9ca3af" }}>
                Certificate ID:{" "}
                <span 
                  className="font-mono font-medium"
                  style={{
                    background: "linear-gradient(135deg, #B8860B 0%, #DAA520 50%, #B8860B 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {certificate.certificateId}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
          <div className="relative w-96 h-96">
            <Image
              src="/unf_logo.jpeg"
              alt="Watermark"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Golden seal/badge in bottom right */}
        <div 
          className="absolute bottom-16 right-16 w-20 h-20 rounded-full flex items-center justify-center opacity-90"
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFD700 50%, #DAA520 75%, #FFD700 100%)",
            boxShadow: "0 4px 15px rgba(218, 165, 32, 0.4)",
          }}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #FFFACD 0%, #FFD700 50%, #FFFACD 100%)",
              border: "2px solid #B8860B",
            }}
          >
            <div className="text-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B8860B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 mx-auto"
              >
                <path d="M12 15l-2 5l4-2l4 2l-2-5" />
                <circle cx="12" cy="9" r="6" />
              </svg>
              <p 
                className="text-[8px] font-bold tracking-wider mt-0.5"
                style={{ color: "#B8860B" }}
              >
                VERIFIED
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificateTemplate.displayName = "CertificateTemplate";

export default CertificateTemplate;
