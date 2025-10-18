"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink, X, Sparkles } from "lucide-react";

type SuccessStory = {
  id: string;
  name: string;
  role: string;
  content: string; // stored as HTML
  image?: string;
  rating: number;
};

interface Props {
  stories: SuccessStory[];
}

export default function SuccessStoriesList({ stories }: Props) {
  const [selected, setSelected] = useState<SuccessStory | null>(null);

  return (
    <div className="py-20 px-4  text-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-white">
            Success Stories
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Real stories from real people who transformed their careers with our programs.
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <Card
              key={story.id}
              className="group bg-slate-900/60 border border-slate-800 hover:border-blue-700/60 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col cursor-pointer"
              style={{ animationDelay: `${index * 80}ms` }}
              onClick={() => setSelected(story)}
            >
              <CardHeader className="p-6 pb-3">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-14 w-14 ring-2 ring-blue-600/40 shadow-md">
                    <AvatarImage src={story.image || ""} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-semibold">
                      {story.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{story.name}</h3>
                    <p className="text-sm text-blue-400">{story.role}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0 flex flex-col flex-1">
                {/* Content Preview */}
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-4 mb-6">
                  {story.content.replace(/<[^>]+>/g, "").substring(0, 160)}...
                </p>

                {/* Rating */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(story.rating)
                            ? "fill-blue-500 text-blue-500"
                            : "text-slate-600"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-500 ml-2">{story.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Button */}
                <Button
                  variant="ghost"
                  className="w-full mt-auto bg-slate-800/50 hover:bg-blue-600/20 text-blue-400 border border-slate-700 hover:border-blue-600 font-medium rounded-xl transition-all"
                >
                  <span>Read Full Story</span>
                  <ExternalLink className="h-4 w-4 ml-2 opacity-80" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {stories.length === 0 && (
          <div className="text-center py-24 text-gray-500">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No stories yet</h3>
            <p>Check back soon for inspiring success journeys.</p>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col p-0 shadow-2xl">
          {selected && (
            <>
              <DialogHeader className="relative bg-gradient-to-r from-blue-900/80 to-indigo-800/70 px-6 py-4 flex items-left justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-blue-500/40">
                    <AvatarImage src={selected.image || ""} />
                    <AvatarFallback className="bg-blue-800 text-white font-bold text-xl">
                      {selected.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl font-semibold text-white">
                      {selected.name}
                    </DialogTitle>
                    <p className="text-blue-200">{selected.role}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(selected.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-blue-300/50"
                          }`}
                        />
                      ))}
                      <span className="text-blue-100 text-sm ml-2">
                        {selected.rating.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                </div>
              
              </DialogHeader>

              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                  <div
                    className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selected.content }}
                  />
                </div>

                <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60">
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setSelected(null)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2"
                    >
                      Close Story
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #64748b;
        }
      `}</style>
    </div>
  );
}
