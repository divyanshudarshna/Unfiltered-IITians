"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Quote, ExternalLink } from "lucide-react";

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
    <div className=" py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-800 rounded-full mb-6 shadow-2xl shadow-purple-500/25">
            <Quote className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-700 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-4">
            Success Stories
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover how our students transformed their careers and achieved their dreams
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <div
              key={story.id}
              className="group relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10" />
              
              <Card 
                className="relative rounded-3xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 overflow-hidden cursor-pointer h-full flex flex-col"
                onClick={() => setSelected(story)}
              >
                {/* Gradient Top Bar */}
                <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
                
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 ring-4 ring-white/50 dark:ring-slate-700/50 shadow-lg group-hover:ring-4 group-hover:ring-purple-200/50 dark:group-hover:ring-purple-400/20 transition-all duration-300">
                        <AvatarImage src={story.image || ""} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
                          {story.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online Indicator */}
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full ring-2 ring-white dark:ring-slate-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                        {story.name}
                      </h3>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-medium truncate">
                        {story.role}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 flex-1 flex flex-col">
                  {/* Content Preview */}
                  <div className="flex-1 mb-4">
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-4 leading-relaxed text-sm">
                      {story.content.replace(/<[^>]+>/g, "").substring(0, 120)}...
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 transition-transform duration-200 ${
                            i < Math.round(story.rating)
                              ? "fill-yellow-400 text-yellow-400 group-hover:scale-110"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-2">
                        {story.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Read More Button */}
                  <Button 
                    variant="ghost" 
                    className="w-full group/btn bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/30 dark:hover:to-pink-800/30 border border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 font-semibold rounded-xl transition-all duration-300 hover:shadow-lg"
                  >
                    <span>Read Story</span>
                    <ExternalLink className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-purple-300/30 dark:group-hover:border-purple-500/20 transition-all duration-500 pointer-events-none" />
              </Card>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {stories.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
              <Quote className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-500 dark:text-gray-400 mb-2">
              No stories yet
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              Success stories will appear here soon
            </p>
          </div>
        )}
      </div>

      {/* Story Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-4xl rounded-3xl border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          {selected && (
            <>
              <DialogHeader className="relative">
                {/* Gradient Header */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-3xl opacity-5 -z-10" />
                <DialogTitle className="flex items-center gap-4 p-6">
                  <Avatar className="h-16 w-16 ring-4 ring-white/50 dark:ring-slate-700/50 shadow-lg">
                    <AvatarImage src={selected.image || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xl">
                      {selected.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selected.name}
                    </h2>
                    <p className="text-purple-600 dark:text-purple-400 font-medium">
                      {selected.role}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="p-6 pt-0 space-y-6">
                {/* Content */}
                <div className="prose prose-lg max-w-none dark:prose-invert prose-purple">
                  <div 
                    className="text-gray-700 dark:text-gray-300 leading-relaxed text-justify"
                    dangerouslySetInnerHTML={{ __html: selected.content }} 
                  />
                </div>

                {/* Rating & Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-6 w-6 ${
                            i < Math.round(selected.rating)
                              ? "fill-yellow-400 text-yellow-400 animate-pulse"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                      {selected.rating.toFixed(1)}/5.0
                    </span>
                  </div>
                  
                  <Button 
                    onClick={() => setSelected(null)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl px-8 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Close Story
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}