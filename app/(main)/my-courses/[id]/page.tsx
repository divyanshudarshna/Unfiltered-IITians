// app/(main)/my-courses/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // if you have a cn helper; else remove

type Lecture = {
  id: string;
  title: string;
  order?: number | null;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  summary?: string | null;
};

type Quiz = {
  id: string;
  data: any; // shape you chose for quiz JSON
};

type Content = {
  id: string;
  title: string;
  order?: number | null;
  lectures: Lecture[];
  quiz?: Quiz | null;
};

type Course = {
  id: string;
  title: string;
  contents: Content[];
};

export default function CoursePlayerPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/courses/${courseId}/contents`, { cache: "no-store" });
      if (!res.ok) {
        // could show a toast/redirect
        return;
      }
      const data: Course = await res.json();
      setCourse(data);

      // set defaults
      if (data.contents?.length) {
        const c0 = data.contents[0];
        setActiveContentId(c0.id);
        if (c0.lectures?.length) setActiveLectureId(c0.lectures[0].id);
      }
    })();
  }, [courseId]);

  const activeContent = course?.contents.find((c) => c.id === activeContentId) || null;
  const activeLecture =
    activeContent?.lectures.find((l) => l.id === activeLectureId) || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 p-4">
      {/* Sidebar */}
      <Card className="h-[calc(100vh-8rem)] overflow-auto">
        <CardHeader>
          <CardTitle>{course?.title || "Course"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {course?.contents.map((content) => (
            <div key={content.id} className="space-y-2">
              <button
                className={cn(
                  "w-full text-left font-medium rounded-md px-3 py-2 hover:bg-muted/60",
                  activeContentId === content.id && "bg-muted"
                )}
                onClick={() => {
                  setActiveContentId(content.id);
                  setActiveLectureId(content.lectures[0]?.id || null);
                }}
              >
                {content.title}
              </button>

              {/* Lectures */}
              {activeContentId === content.id && (
                <div className="pl-3 space-y-1">
                  {content.lectures.map((lec) => (
                    <button
                      key={lec.id}
                      className={cn(
                        "block w-full text-left text-sm rounded px-3 py-1 hover:bg-muted/40",
                        activeLectureId === lec.id && "bg-muted"
                      )}
                      onClick={() => setActiveLectureId(lec.id)}
                    >
                      {lec.title}
                    </button>
                  ))}

                  {/* Quiz CTA */}
                  {content.quiz && (
                    <a
                      href={`#quiz-${content.id}`}
                      className="mt-2 inline-block text-xs text-primary hover:underline px-3"
                    >
                      Take Quiz →
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Main Player */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {activeLecture ? activeLecture.title : "Select a lecture"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video (stream-only best effort) */}
            {activeLecture?.videoUrl && (
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                <video
                  src={activeLecture.videoUrl}
                  className="h-full w-full"
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            )}

            {/* PDF download */}
            {activeLecture?.pdfUrl && (
              <a
                href={activeLecture.pdfUrl}
                download
                className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-muted"
              >
                Download PDF
              </a>
            )}

            {/* Summary */}
            {activeLecture?.summary && (
              <div className="prose prose-sm max-w-none">
                <h4 className="mt-4 mb-2 font-semibold">Lecture Summary</h4>
                <div dangerouslySetInnerHTML={{ __html: activeLecture.summary }} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz block (simple placeholder to render JSON) */}
        {activeContent?.quiz && (
          <Card id={`quiz-${activeContent.id}`}>
            <CardHeader>
              <CardTitle>Quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted/40 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(activeContent.quiz.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
