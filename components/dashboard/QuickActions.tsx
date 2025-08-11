// components/dashboard/QuickActions.tsx
import { Card,CardHeader,CardTitle,CardContent } from "../ui/card";
import { Button } from "../ui/button";
const actions = [
  { label: "My Courses", icon: "📘" },
  { label: "Book Session", icon: "👨‍🏫" },
  { label: "Resources", icon: "📂" },
  { label: "Progress", icon: "🏆" },
];

export function QuickActions() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 py-8 px-6 text-sm rounded-lg border-muted transition-all duration-300 ease-in-out hover:scale-105 hover:bg-primary/10 hover:border-primary hover:shadow-md hover:text-primary cursor-pointer"
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="font-medium">{action.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
