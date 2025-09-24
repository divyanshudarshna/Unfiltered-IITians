import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  CheckCircle, 
  FileText, 
  Archive, 
  Users 
} from 'lucide-react';

interface StatsProps {
  stats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    totalEnrollments: number;
  };
}

export default function SessionsStats({ stats }: StatsProps) {
  const statCards = [
    {
      title: 'Total Sessions',
      value: stats.total,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Published',
      value: stats.published,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Draft',
      value: stats.draft,
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      title: 'Archived',
      value: stats.archived,
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-800'
    },
    {
      title: 'Total Enrollments',
      value: stats.totalEnrollments,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.title.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}