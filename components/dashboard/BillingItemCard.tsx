"use client";

import { useState } from "react";
import { Download, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
// @ts-ignore - jsPDF types
import jsPDF from "jspdf";
// @ts-ignore - autoTable types  
import autoTable from "jspdf-autotable";

interface BillingItem {
  id: string;
  type: "subscription" | "session";
  itemType: string;
  itemTitle: string;
  itemDescription: string;
  orderId: string;
  paymentId: string;
  originalPrice: number;
  actualAmountPaid: number;
  discountApplied: number;
  couponCode: string | null;
  paidAt: Date | null;
  expiresAt: Date | null;
  isExpired: boolean;
  duration?: number;
}

interface BillingItemCardProps {
  item: BillingItem;
}

export function BillingItemCard({ item }: BillingItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    
    try {
      // Fetch receipt data
      const response = await fetch(`/api/billing/receipt/${item.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch receipt data");
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to generate receipt");
      }

      const receipt = data.receipt;

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // ============ HEADER SECTION ============
      // Purple gradient background
      doc.setFillColor(104, 29, 205); // #681dcd
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Company Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("UNFILTERED IITIANS", 20, 22);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(230, 230, 230);
      doc.text("by Divyanshu Darshna | www.divyanshudarshna.com", 20, 29);
      
      // PAYMENT RECEIPT label
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PAYMENT RECEIPT", pageWidth - 20, 20, { align: "right" });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(240, 240, 240);
      doc.text("Official Transaction Record", pageWidth - 20, 27, { align: "right" });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // ============ RECEIPT INFO SECTION ============
      let yPos = 60;
      
      // Receipt Number Box
      doc.setFillColor(249, 250, 251); // Gray-50
      doc.roundedRect(20, yPos, 80, 20, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128); // Gray-500
      doc.text("Receipt Number", 25, yPos + 7);
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(receipt.receiptNumber, 25, yPos + 15);
      
      // Date Box
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(110, yPos, 80, 20, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text("Issue Date", 115, yPos + 7);
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(receipt.paidAt ? format(new Date(receipt.paidAt), "dd MMM yyyy") : "N/A", 115, yPos + 15);
      
      yPos += 30;
      
      // ============ CUSTOMER & ORDER DETAILS ============
      // Customer Details Column
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229); // Primary color
      doc.text("BILLED TO", 20, yPos);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      yPos += 8;
      doc.text(receipt.customerName, 20, yPos);
      yPos += 6;
      doc.setTextColor(75, 85, 99); // Gray-600
      doc.text(receipt.customerEmail, 20, yPos);
      yPos += 6;
      doc.text(receipt.customerPhone, 20, yPos);
      
      // Order Details Column
      let orderYPos = 90;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text("ORDER DETAILS", 120, orderYPos);
      
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      orderYPos += 8;
      doc.text("Order ID:", 120, orderYPos);
      doc.setTextColor(0, 0, 0);
      doc.text(receipt.orderId, 145, orderYPos);
      
      orderYPos += 6;
      doc.setTextColor(107, 114, 128);
      doc.text("Payment ID:", 120, orderYPos);
      doc.setTextColor(0, 0, 0);
      doc.text(receipt.paymentId, 145, orderYPos);
      
      // Add Purchase Date
      orderYPos += 6;
      doc.setTextColor(107, 114, 128);
      doc.text("Purchase Date:", 120, orderYPos);
      doc.setTextColor(0, 0, 0);
      doc.text(receipt.paidAt ? format(new Date(receipt.paidAt), "dd MMM yyyy, HH:mm") : "N/A", 145, orderYPos);
      
      // Add Expiry Date if available
      if (receipt.expiresAt) {
        orderYPos += 6;
        doc.setTextColor(107, 114, 128);
        doc.text("Valid Until:", 120, orderYPos);
        const isExpired = new Date(receipt.expiresAt) < new Date();
        doc.setTextColor(isExpired ? 220 : 34, isExpired ? 38 : 197, isExpired ? 38 : 94); // Red or Green
        doc.setFont("helvetica", "bold");
        doc.text(format(new Date(receipt.expiresAt), "dd MMM yyyy"), 145, orderYPos);
      }
      
      yPos = Math.max(yPos, orderYPos) + 15;
      
      // ============ ITEM DETAILS TABLE ============
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Type', 'Price']],
        body: [
          [
            receipt.itemTitle,
            receipt.itemType,
            `Rs ${receipt.originalPrice.toFixed(2)}`
          ]
        ],
        theme: 'grid',
        headStyles: { 
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 50 },
          2: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 20, right: 20 }
      });

      // ============ PRICING BREAKDOWN ============
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      const summaryX = pageWidth - 70;
      let summaryY = finalY;
      
      // Subtotal
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99);
      doc.text("Subtotal:", summaryX, summaryY);
      doc.setTextColor(0, 0, 0);
      doc.text(`Rs ${receipt.originalPrice.toFixed(2)}`, pageWidth - 20, summaryY, { align: "right" });
      
      // Discount (if applicable)
      if (receipt.discountApplied > 0) {
        summaryY += 7;
        doc.setTextColor(75, 85, 99);
        doc.text(`Discount${receipt.couponCode ? ` (${receipt.couponCode})` : ''}:`, summaryX, summaryY);
        doc.setTextColor(34, 197, 94); // Green
        doc.setFont("helvetica", "bold");
        doc.text(`- Rs ${receipt.discountApplied.toFixed(2)}`, pageWidth - 20, summaryY, { align: "right" });
      }
      
      // Separator line
      summaryY += 5;
      doc.setDrawColor(229, 231, 235); // Gray-200
      doc.setLineWidth(0.5);
      doc.line(summaryX, summaryY, pageWidth - 20, summaryY);
      
      // Total Amount
      summaryY += 8;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Total Paid:", summaryX, summaryY);
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229); // Primary color
      doc.text(`Rs ${receipt.actualAmountPaid.toFixed(2)}`, pageWidth - 20, summaryY, { align: "right" });
      
      // ============ ADDITIONAL INFO BOX ============
      summaryY += 15;
      if (summaryY < pageHeight - 60) {
        doc.setFillColor(254, 243, 199); // Amber-100
        doc.roundedRect(20, summaryY, pageWidth - 40, 28, 2, 2, 'F');
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(146, 64, 14); // Amber-800
        doc.text("Important Information", 25, summaryY + 8);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 53, 15); // Amber-900
        doc.text("This is an official payment receipt from UnFiltered IITians", 27, summaryY + 14);
        doc.text("Please keep this receipt for your records", 27, summaryY + 19);
        if (receipt.expiresAt) {
          doc.text(`Access valid until ${format(new Date(receipt.expiresAt), "dd MMMM yyyy")}`, 27, summaryY + 24);
        }
      }
      
      // ============ FOOTER ============
      const footerY = pageHeight - 25;
      
      // Separator line
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(20, footerY, pageWidth - 20, footerY);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text("Thank you for your purchase!", pageWidth / 2, footerY + 7, { align: "center" });
      doc.text("For support, contact: support@unfilteredIITians.com | Visit: www.unfilteredIITians.com", pageWidth / 2, footerY + 12, { align: "center" });
      
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(`Generated on ${format(new Date(), "dd MMM yyyy 'at' HH:mm")}`, pageWidth / 2, footerY + 17, { align: "center" });

      // Save the PDF
      doc.save(`Receipt-${receipt.receiptNumber}.pdf`);
      
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert("Failed to download receipt. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden transition-all hover:shadow-md">
      {/* Card Header */}
      <div className="p-4 bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{item.itemTitle}</h3>
              {item.isExpired ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                  <XCircle className="w-3 h-3" />
                  Expired
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{item.itemType}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Paid: {item.paidAt ? format(new Date(item.paidAt), "PP") : "N/A"}
              </span>
              {item.expiresAt && (
                <span className="text-muted-foreground">
                  Expires: {format(new Date(item.expiresAt), "PP")}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              {item.discountApplied > 0 && (
                <p className="text-sm text-muted-foreground line-through">
                  ₹{item.originalPrice.toFixed(2)}
                </p>
              )}
              <p className="text-xl font-bold">₹{item.actualAmountPaid.toFixed(2)}</p>
            </div>
            
            <button
              onClick={handleDownloadReceipt}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Generating..." : "Receipt"}
            </button>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              Hide Details <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Show Details <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 bg-muted/30 border-t border-border space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Order ID</p>
              <p className="text-sm font-mono">{item.orderId}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground mb-1">Payment ID</p>
              <p className="text-sm font-mono">{item.paymentId}</p>
            </div>
            
            {item.couponCode && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Coupon Applied</p>
                <p className="text-sm font-semibold text-green-600">{item.couponCode}</p>
              </div>
            )}
            
            {item.discountApplied > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Discount</p>
                <p className="text-sm font-semibold text-green-600">
                  -₹{item.discountApplied.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {item.itemDescription && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{item.itemDescription}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
