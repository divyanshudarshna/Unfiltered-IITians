"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useProgress } from '@/app/contexts/ProgressContext';

export function ProgressSaver() {
  const pathname = usePathname();
  const { progress, updateProgress } = useProgress();

  useEffect(() => {
    // Save all progress when navigating away
    const saveAllProgress = async () => {
      for (const p of progress) {
        try {
          await updateProgress({
            courseId: p.courseId,
            contentId: p.contentId,
            completed: p.completed,
            progress: p.progress,
            quizScore: p.quizScore,
            totalQuizQuestions: p.totalQuizQuestions,
            attemptedQuestions: p.attemptedQuestions ? JSON.parse(p.attemptedQuestions as string) : undefined
          });
        } catch (error) {
          console.error('Error saving progress:', error);
        }
      }
    };

    return () => {
      saveAllProgress();
    };
  }, [pathname, progress, updateProgress]); // Trigger on route change

  return null;
}