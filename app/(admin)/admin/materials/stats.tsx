import { Material, MaterialCategory } from "@prisma/client";
import { Eye, FolderOpen, TrendingUp, Library } from "lucide-react";

interface MaterialWithCategory extends Material {
  subject: MaterialCategory;
}

interface StatsProps {
  materials: MaterialWithCategory[];
  categories: MaterialCategory[];
}

export default function Stats({ materials, categories }: StatsProps) {
  const totalMaterials = materials.length;
  const publishedMaterials = materials.filter((m) => m.published).length;
  const unpublishedMaterials = totalMaterials - publishedMaterials;
  const totalCategories = categories.length;

  const materialsByCategory = categories.map((category) => ({
    name: category.name,
    count: materials.filter((m) => m.subjectId === category.id).length,
  }));

  const topCategory = materialsByCategory.sort((a, b) => b.count - a.count)[0];
  const hasMaterials = totalMaterials > 0;

  const statCards = [
    {
      title: "Total Materials",
      value: totalMaterials,
      icon: Library,
      description: "All learning resources",
    },
    {
      title: "Published",
      value: publishedMaterials,
      icon: Eye,
      description: `${unpublishedMaterials} unpublished`,
    },
    {
      title: "Categories",
      value: totalCategories,
      icon: FolderOpen,
      description: "Content categories",
    },
    {
      title: "Top Category",
      value: topCategory?.count || 0,
      icon: TrendingUp,
      description: topCategory?.name || "No materials yet",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div
            key={index}
            className="relative group overflow-hidden rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-300 border border-border"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {card.title}
                  </p>
                  <h3 className="text-3xl font-bold text-foreground">
                    {card.value}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2">
                    {card.description}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-6 h-6" />
                </div>
              </div>

              {/* Progress indicator for Published */}
              {card.title === "Published" && totalMaterials > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${(publishedMaterials / totalMaterials) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((publishedMaterials / totalMaterials) * 100)}% published
                  </p>
                </div>
              )}

              {/* Progress indicator for Top Category */}
              {card.title === "Top Category" && hasMaterials && (
                <div className="mt-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${(topCategory.count / totalMaterials) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((topCategory.count / totalMaterials) * 100)}% of total
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
