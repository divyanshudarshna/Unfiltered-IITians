/* --- Modernized UI (mono theme), logic intact --- */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  Download,
  Eye,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Bookmark,
  Lightbulb,
  Sparkles,
  FlaskConical,
  ClipboardCheck,
} from "lucide-react";
import VideoContent from "./VideoContent";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { cn } from "@/lib/utils";

interface Lecture {
  id: string;
  title: string;
  summary?: string;
  videoUrl?: string;
  youtubeEmbedUrl?: string;
  pdfUrl?: string;
  order: number;
  duration?: number;
  completed?: boolean;
}

interface LectureContentProps {
  lecture: Lecture;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  onMarkComplete: (lectureId: string) => void;
}

export default function LectureContent({
  lecture,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onMarkComplete,
}: LectureContentProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isCompleted, setIsCompleted] = useState(lecture.completed || false);

  const handlePlaybackChange = (playing: boolean) => setIsVideoPlaying(playing);
  const handleVideoEnd = () => setIsVideoPlaying(false);

  const handleDownloadPdf = () => {
    if (lecture.pdfUrl) {
      const link = document.createElement("a");
      link.href = lecture.pdfUrl;
      link.download = `${lecture.title.replace(/\s+/g, "_")}_materials.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreviewPdf = () => setShowPdfPreview(true);
  const closePdfPreview = () => setShowPdfPreview(false);

const handleMarkComplete = () => {
  if (!lecture.completed) {
    onMarkComplete(lecture.id);
  }
};

  // Determine which video component to render (Cloudinary takes preference)
  const renderVideoContent = () => {
    if (lecture.videoUrl) {
      return (
        <VideoContent
          videoUrl={lecture.videoUrl}
          title={lecture.title}
          onPlaybackChange={handlePlaybackChange}
          onEnded={handleVideoEnd}
        />
      );
    }
    
    if (lecture.youtubeEmbedUrl) {
      return (
        <YouTubeEmbed
          url={lecture.youtubeEmbedUrl}
          title={lecture.title}
          onPlay={() => handlePlaybackChange(true)}
          onEnded={handleVideoEnd}
        />
      );
    }
    
    return null;
  };

  return (
    <div className="mx-auto p-2 md:p-4 lg:p-6 space-y-4 md:space-y-8">
      {/* Video Section */}
      {renderVideoContent()}

      {/* Header */}
      <div className="flex flex-col gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl border bg-card/70 backdrop-blur shadow-sm">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight leading-tight">{lecture.title}</h1>
          {lecture.duration && (
            <div className="flex items-center text-muted-foreground mt-2">
              <Clock className="h-4 w-4 mr-1 text-indigo-500" />
              <span className="text-sm">
                {Math.floor(lecture.duration / 60)}m {lecture.duration % 60}s
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="gap-1 rounded-full shadow-sm flex-1 md:flex-initial"
            onClick={onPrevious}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Previous</span>
          </Button>
          <Button
            variant="outline"
            className="gap-1 rounded-full shadow-sm flex-1 md:flex-initial"
            onClick={onNext}
            disabled={!hasNext}
          >
            <span className="text-sm">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      {lecture.summary && (
        <Card className="overflow-hidden border-none shadow-lg relative group rounded-xl md:rounded-2xl bg-card/80 backdrop-blur-md">
          <div className="absolute inset-0 rounded-xl md:rounded-2xl border border-indigo-500/10 group-hover:border-indigo-400/40 transition-all duration-500 pointer-events-none" />
          <CardContent className="p-0 relative z-10">
            {/* Header */}
            <div className="flex items-center px-4 md:px-6 py-3 md:py-4 bg-indigo-950/80 dark:bg-indigo-900/70 text-white shadow-inner relative">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 md:h-7 md:w-7 text-indigo-300 drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
              </div>
              <div className="ml-3 md:ml-4">
                <h2 className="text-base md:text-lg lg:text-xl font-semibold tracking-tight">
                  Lecture Summary
                </h2>
                <p className="text-xs md:text-sm opacity-80">
                  Key insights from this lesson
                </p>
              </div>
            </div>
            {/* Content */}
            <div className="p-4 md:p-6">
              <div
                className="prose prose-sm md:prose-lg dark:prose-invert max-w-none leading-relaxed space-y-3 md:space-y-4"
                dangerouslySetInnerHTML={{ __html: lecture.summary }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF */}
      {lecture.pdfUrl && (
        <Card className="overflow-hidden shadow-md border bg-card/70 backdrop-blur-md rounded-xl md:rounded-2xl">
          <CardContent className="p-0">
            <div className="flex items-center p-3 md:p-4 bg-muted/50 border-b">
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-indigo-500 mr-2" />
              <h2 className="text-base md:text-lg font-semibold">Lecture Materials</h2>
            </div>
            <div className="p-4 md:p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-indigo-600 text-white">
                  <FileText className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-sm md:text-base">Supplementary Materials</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    PDF • {(lecture.duration || 10) * 2} pages
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  variant="outline"
                  className="rounded-full hover:scale-105 transition flex-1 sm:flex-initial"
                  onClick={handlePreviewPdf}
                >
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
                <Button
                  className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 transition flex-1 sm:flex-initial"
                  onClick={handleDownloadPdf}
                >
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Tips */}
      <Card className="relative shadow-lg border-none rounded-xl md:rounded-2xl overflow-hidden bg-card/70 backdrop-blur-md">
        <CardContent className="relative p-4 md:p-6 space-y-4 md:space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6 md:h-7 md:w-7 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <h2 className="text-base md:text-lg lg:text-xl font-semibold tracking-tight text-foreground">
              Study Tips
            </h2>
          </div>
          {/* Tips List */}
          <ul className="grid grid-cols-1 gap-3 md:gap-4 text-sm">
            {[
              {
                id: "biotechnology-concepts",
                icon: BookOpen,
                text: "Summarize biotechnology concepts in your own words after each lecture.",
              },
              {
                id: "molecular-pathways",
                icon: FlaskConical,
                text: "Practice with diagrams and flowcharts to remember molecular pathways.",
              },
              {
                id: "practice-questions",
                icon: ClipboardCheck,
                text: "Solve past competitive exam questions regularly to test recall and timing.",
              },
              {
                id: "study-blocks",
                icon: Clock,
                text: "Break study sessions into focused 45-minute blocks with short reviews.",
              },
            ].map((tip) => (
              <li
                key={tip.id}
                className="p-3 md:p-4 rounded-lg border border-border bg-background/50 shadow-sm flex gap-3 hover:border-indigo-400/40 hover:shadow-indigo-500/20 hover:scale-[1.02] transition"
              >
                <tip.icon className="h-4 w-4 md:h-5 md:w-5 text-indigo-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-xs md:text-sm">{tip.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Completion Footer */}
      <div className="flex flex-col gap-3 md:gap-4 p-4 md:p-5 rounded-xl border bg-card/70 backdrop-blur shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="outline"
            className="rounded-full gap-2 flex-1 sm:flex-initial order-1 sm:order-1"
            onClick={onPrevious}
            disabled={!hasPrevious}
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>

          <Button
            className={cn(
              "rounded-full px-6 py-2 gap-2 shadow-md hover:scale-105 transition flex-1 sm:flex-initial order-3 sm:order-2",
              lecture.completed
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
            onClick={handleMarkComplete}
          >
            {lecture.completed ? (
              <>
                <CheckCircle className="h-4 w-4" /> Completed
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" /> Mark Complete
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="rounded-full gap-2 flex-1 sm:flex-initial order-2 sm:order-3"
            onClick={onNext}
            disabled={!hasNext}
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Modal */}
      {showPdfPreview && lecture.pdfUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
          <div className="bg-card rounded-xl md:rounded-2xl w-full max-w-5xl h-[95vh] md:h-[90vh] flex flex-col border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b bg-muted/50">
              <h3 className="text-sm md:text-lg font-semibold truncate mr-2">
                Preview: {lecture.title} Materials
              </h3>
              <Button variant="ghost" size="icon" onClick={closePdfPreview}>
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
            <iframe
              src={lecture.pdfUrl}
              className="flex-1 w-full bg-white"
              title="PDF Preview"
            />
            <div className="p-3 md:p-4 border-t flex justify-end">
              <Button
                className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 transition text-sm"
                onClick={handleDownloadPdf}
              >
                <Download className="h-4 w-4 mr-1" /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
