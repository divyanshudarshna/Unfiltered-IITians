"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

type SuccessStory = {
  id: string;
  name: string;
  role: string;
  content: string; // stored as HTML
  image?: string;
  rating: number;
};

export default function SuccessStoriesPage() {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SuccessStory | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch("/api/success-stories");
        const data = await res.json();
        setStories(data);
      } catch (err) {
        console.error("Failed to load stories", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold text-center mb-10">
        🌟 Student Success Stories
      </h1>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-60 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="rounded-2xl shadow-md hover:shadow-xl hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer flex flex-col justify-between"
            >
              <CardHeader className="flex items-center space-x-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={story.image || ""} />
                  <AvatarFallback>{story.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{story.name}</h3>
                  <p className="text-sm text-muted-foreground">{story.role}</p>
                </div>
              </CardHeader>

              <CardContent>
                {/* Preview (plain text only, strip HTML tags) */}
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {story.content.replace(/<[^>]+>/g, "")}
                </p>

                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(story.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelected(story)}
                >
                  Read More
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for full HTML story */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selected.image || ""} />
                    <AvatarFallback>
                      {selected.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{selected.name}</h2>
                    <p className="text-sm text-muted-foreground">{selected.role}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* Render full HTML content safely */}
                <div
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: selected.content }}
                />
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i < Math.round(selected.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
