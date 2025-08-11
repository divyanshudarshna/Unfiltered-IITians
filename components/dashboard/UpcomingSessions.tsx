// components/dashboard/UpcomingSessions.tsx
import { Card,CardHeader,CardTitle,CardContent } from "../ui/card";
import { Button } from "../ui/button";

export function UpcomingSessions() {
  return (
    <Card className="shadow-md lg:col-span-2">
      <CardHeader>
        <CardTitle>Upcoming Sessions</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="mb-4 text-muted-foreground">
          You have 2 upcoming mentoring sessions:
        </p>
        <ul className="space-y-4">
          <li className="border-b pb-3">
            <strong>Physics Concept Review</strong><br />
            <small>June 15, 2025 | 3:00 PM - 4:00 PM</small>
          </li>
          <li>
            <strong>Math Problem Solving</strong><br />
            <small>June 18, 2025 | 10:00 AM - 11:30 AM</small>
          </li>
        </ul>
        <Button className="w-full mt-5">View All Sessions</Button>
      </CardContent>
    </Card>
  );
}
