"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Clock,
  BookOpen,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Captions,
  Settings,
  Airplay,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Lecture {
  id: string;
  title: string;
  summary?: string;
  videoUrl?: string;
  pdfUrl?: string;
  duration?: number;
}

interface LectureViewProps {
  lecture: Lecture;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function LectureView({ 
  lecture, 
  onNext, 
  onPrevious, 
  hasNext, 
  hasPrevious 
}: LectureViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(lecture.duration || 0);
  const [volume, setVolume] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    setCurrentTime(newTime);
    
    // In a real implementation, you would set the video currentTime
    // videoRef.current.currentTime = newTime;
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, you would play/pause the video
    // if (isPlaying) videoRef.current.pause();
    // else videoRef.current.play();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Video Player Section */}
      {lecture.videoUrl && (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden shadow-xl">
          <CardContent className="p-0">
            {/* Video Container */}
            <div className="relative aspect-video bg-black">
              {/* Video placeholder - would be replaced with actual video element */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                <div className="text-center">
                  <button 
                    onClick={togglePlay}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full transition-all hover:scale-110 mb-4"
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 ml-1" />
                    )}
                  </button>
                  <p className="text-slate-300 text-sm">
                    {isPlaying ? "Pause" : "Play"} Video
                  </p>
                </div>
              </div>
              
              {/* Video Progress Bar */}
              <div 
                className="absolute bottom-16 left-0 right-0 h-2 bg-slate-700 cursor-pointer group"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 relative"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 p-3 flex items-center">
                <button 
                  onClick={togglePlay}
                  className="text-white p-2 hover:bg-slate-800 rounded"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </button>
                
                <div className="flex items-center mx-2 text-slate-300 text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
                
                <div className="flex items-center flex-1 mx-4">
                  <Volume2 className="h-4 w-4 text-slate-400 mr-2" />
                  <div className="h-1 bg-slate-700 rounded-full flex-1 max-w-20">
                    <div 
                      className="h-1 bg-blue-400 rounded-full"
                      style={{ width: `${volume}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="text-slate-400 hover:text-white p-2">
                    <Captions className="h-5 w-5" />
                  </button>
                  <button className="text-slate-400 hover:text-white p-2">
                    <Settings className="h-5 w-5" />
                  </button>
                  <button className="text-slate-400 hover:text-white p-2">
                    <Airplay className="h-5 w-5" />
                  </button>
                  <button 
                    className="text-slate-400 hover:text-white p-2"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    <Maximize className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
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
        
        <Button className="bg-blue-600 hover:bg-blue-700">
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