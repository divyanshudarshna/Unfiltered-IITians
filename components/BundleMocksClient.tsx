"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Clock, FileText, Award, Zap, Crown, Sparkles, Target } from "lucide-react";

interface Mock {
  id: string;
  title: string;
  description?: string;
  duration?: number | null;
  questionCount: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  tags?: string[];
}

interface Props {
  mocks: Mock[];
}

export default function BundleMocksClient({ mocks }: Props) {
  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return "Flexible Duration";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours && mins) return `${hours}h ${mins}m`;
    if (hours) return `${hours}h`;
    return `${mins}m`;
  };

  const getDifficultyInfo = (difficulty?: string) => {
    switch (difficulty) {
      case "EASY":
        return { color: "bg-emerald-100 text-emerald-800", icon: <Sparkles className="h-3.5 w-3.5 mr-1" />, text: "EASY" };
      case "MEDIUM":
        return { color: "bg-amber-100 text-amber-800", icon: <Target className="h-3.5 w-3.5 mr-1" />, text: "MEDIUM" };
      case "HARD":
        return { color: "bg-rose-100 text-rose-800", icon: <Crown className="h-3.5 w-3.5 mr-1" />, text: "HARD" };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: <FileText className="h-3.5 w-3.5 mr-1" />, text: "STANDARD" };
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {mocks.map(mock => {
        const difficultyInfo = getDifficultyInfo(mock.difficulty);

        const features = [
          { text: `${mock.questionCount} Questions`, icon: FileText },
          { text: formatDuration(mock.duration), icon: Clock },
          { text: "Detailed Solutions", icon: Award },
          { text: "Performance Analytics", icon: Zap },
        ];

        return (
          <Card key={mock.id} className="shadow-lg hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden group bg-card flex flex-col transform hover:-translate-y-1.5 relative">
            
            {/* Glow & gradient hover */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400/0 via-blue-400/0 to-purple-500/0 group-hover:from-cyan-400/10 group-hover:via-blue-400/10 group-hover:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1">
              <CardHeader className="bg-background rounded-t-lg py-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={`${difficultyInfo.color} font-medium flex items-center border`}>
                    {difficultyInfo.icon} {difficultyInfo.text}
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 flex items-center">
                    <Rocket className="h-3.5 w-3.5 mr-1" /> Subscribed
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors">{mock.title}</CardTitle>
                <CardDescription className="mt-2">
                  {mock.description || "Comprehensive test to evaluate your knowledge and skills."}
                </CardDescription>
              </CardHeader>
            </div>

            <CardContent className="flex-1 pt-6">
              {/* Features */}
              <div className="space-y-3 mb-4">
                {features.map((f, idx) => {
                  const Icon = f.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4 text-blue-500" />
                      <span>{f.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Tags */}
              {mock.tags && mock.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Topics:</h4>
                  <div className="flex flex-wrap gap-1">
                    {mock.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                    {mock.tags.length > 3 && <Badge variant="outline" className="text-xs">+{mock.tags.length - 3} more</Badge>}
                  </div>
                </div>
              )}
            </CardContent>

            {/* Start Test button */}
            <CardFooter className="border-t pt-4">
              <Button asChild className="w-full py-2 h-11 relative overflow-hidden group/btn">
                <Link href={`/mocks/${mock.id}/start`}>
                  <span className="relative z-10 flex items-center justify-center">
                    <Rocket className="h-4 w-4 mr-2 transition-transform group-hover/btn:translate-x-1" />
                    Start Test
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
