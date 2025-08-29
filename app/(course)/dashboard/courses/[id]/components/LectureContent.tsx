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
} from "lucide-react";
import VideoContent from "./VideoContent";

interface Lecture {
  id: string;
  title: string;
  summary?: string;
  videoUrl?: string;
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

  const handlePlaybackChange = (playing: boolean) => {
    setIsVideoPlaying(playing);
  };

  const handleVideoEnd = () => {
    setIsVideoPlaying(false);
  };

  const handleDownloadPdf = () => {
    if (lecture.pdfUrl) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = lecture.pdfUrl;
      link.download = `${lecture.title.replace(/\s+/g, '_')}_materials.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreviewPdf = () => {
    setShowPdfPreview(true);
  };

  const closePdfPreview = () => {
    setShowPdfPreview(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Video Player Section */}
      {lecture.videoUrl && (
        <VideoContent
          videoUrl={lecture.videoUrl}
          title={lecture.title}
          onPlaybackChange={handlePlaybackChange}
          onEnded={handleVideoEnd}
        />
      )}
      
      {/* Lecture Title and Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{lecture.title}</h1>
          {lecture.duration && (
            <div className="flex items-center text-slate-400 mt-1">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">{Math.floor(lecture.duration / 60)}m {lecture.duration % 60}s</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={onPrevious}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={onNext}
            disabled={!hasNext}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      {/* Summary Content */}
      {lecture.summary && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <BookOpen className="h-5 w-5 text-blue-400 mr-2" />
              <h2 className="text-lg font-semibold text-slate-100">Lecture Summary</h2>
            </div>
            <div 
              className="prose prose-invert prose-lg max-w-none text-slate-300"
              dangerouslySetInnerHTML={{ __html: lecture.summary }}
            />
          </CardContent>
        </Card>
      )}
      
      {/* PDF Resource */}
      {lecture.pdfUrl && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-purple-400 mr-2" />
              <h2 className="text-lg font-semibold text-slate-100">Lecture Materials</h2>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
              <div className="flex items-center">
                <div className="bg-purple-500/10 p-3 rounded-lg mr-4">
                  <FileText className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-100">Supplementary Materials</h3>
                  <p className="text-sm text-slate-400">PDF Document</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="border-purple-600 text-purple-400 hover:bg-purple-600/20 hover:text-purple-300"
                  onClick={handlePreviewPdf}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleDownloadPdf}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* PDF Preview Modal */}
      {showPdfPreview && lecture.pdfUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-100">
                Preview: {lecture.title} Materials
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={closePdfPreview}
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={lecture.pdfUrl}
                className="w-full h-full rounded-md bg-white"
                title="PDF Preview"
                frameBorder="0"
              />
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end">
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleDownloadPdf}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Completion and Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-700">
        <Button 
          variant="outline" 
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous Lecture
        </Button>
        
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => onMarkComplete(lecture.id)}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark as Complete
        </Button>
        
        <Button 
          variant="outline" 
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={onNext}
          disabled={!hasNext}
        >
          Next Lecture
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}