import { Button } from "@/components/ui/button";
import { Clock, Bookmark, AlertTriangle } from "lucide-react";

interface HeaderStatsProps {
  title: string;
  totalQuestions: number;
  attemptedQuestions: number;
  bookmarkedQuestions: number;
  timeLeft: number;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  totalDuration: number; // Total duration in minutes from schema
}

export default function HeaderStats({
  title,
  totalQuestions,
  attemptedQuestions,
  bookmarkedQuestions,
  timeLeft,
  isBookmarked,
  onToggleBookmark,
  totalDuration,
}: HeaderStatsProps) {
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  // Calculate progress percentage
  const totalSeconds = totalDuration * 60;
  const progressPercentage = totalSeconds > 0 
    ? Math.max(0, Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100))
    : 0;

  // Format total duration for display
  const formatTotalDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  // Time warning colors
  const getTimeColor = () => {
    if (timeLeft < 300) return "text-red-600 bg-red-50 border-red-200"; // Less than 5 minutes
    if (timeLeft < 900) return "text-amber-600 bg-amber-50 border-amber-200"; // Less than 15 minutes
    return "text-purple-600 bg-purple-50 border-purple-200";
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-purple-800">Attempting: {title}</h1>
        {totalDuration > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Total allowed time: {formatTotalDuration(totalDuration)}
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm font-medium">
              {totalQuestions}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Attempted:</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium">
              {attemptedQuestions}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Bookmarked:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
              {bookmarkedQuestions}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getTimeColor()}`}>
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                {hours.toString().padStart(2, "0")}:
                {minutes.toString().padStart(2, "0")}:
                {seconds.toString().padStart(2, "0")}
              </span>
              {timeLeft < 300 && <AlertTriangle className="w-4 h-4" />}
            </div>
            {totalDuration > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                <div 
                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleBookmark}
            className={`h-9 w-9 ${
              isBookmarked
                ? "bg-blue-50 text-blue-600 border-blue-200"
                : ""
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${isBookmarked ? "fill-blue-400" : ""}`}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}