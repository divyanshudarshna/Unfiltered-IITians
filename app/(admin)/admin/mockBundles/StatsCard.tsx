"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Props {
  label: string;
  value: number;
}

export const StatsCard = ({ label, value }: Props) => {
  return (
    <Card className="bg-gray-50 dark:bg-slate-900 p-4 text-center">
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
};
