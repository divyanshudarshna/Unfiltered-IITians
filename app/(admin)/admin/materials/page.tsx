'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Material, MaterialCategory } from '@prisma/client';
import MaterialDataTable from './datatable';
import CategoryFormModal from './categoryFormModal';
import Stats from './stats';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  FileText,
  FolderOpen,
  Edit,
  Trash2,
  RefreshCw,
  BookOpen
} from 'lucide-react';

interface MaterialWithCategory extends Material {
  subject: MaterialCategory;
}

export default function MaterialsAdminPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<MaterialWithCategory[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [materialsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/materials'),
        fetch('/api/admin/material-categories')
      ]);

      if (materialsRes.ok) {
        const materialsData = await materialsRes.json();
        setMaterials(materialsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEditMaterial = (material: MaterialWithCategory) => {
    router.push(`/admin/materials/materialForm?id=${material.id}`);
  };

  const handleEditCategory = (category: MaterialCategory) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      try {
        const response = await fetch(`/api/admin/materials/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setMaterials(materials.filter(m => m.id !== id));
        } else {
          alert('Failed to delete material');
        }
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? All materials in this category will also be deleted.')) {
      try {
        const response = await fetch(`/api/admin/material-categories/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setCategories(categories.filter(c => c.id !== id));
          setMaterials(materials.filter(m => m.subjectId !== id));
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to delete category');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleModalClose = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(false);
    fetchData();
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Materials Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage your learning materials and categories
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Statistics */}
      <Stats materials={materials} categories={categories} />
      
      {/* Tabs */}
      <Tabs defaultValue="materials" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1">
          <TabsTrigger 
            value="materials" 
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            Materials
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>
        
        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl">Learning Materials</CardTitle>
                <CardDescription>
                  Manage all your educational content and resources
                </CardDescription>
              </div>
              <Button onClick={() => router.push('/admin/materials/materialForm')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </CardHeader>
            <CardContent>
              <MaterialDataTable
                data={materials}
                categories={categories}
                onEdit={handleEditMaterial}
                onDelete={handleDeleteMaterial}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl">Material Categories</CardTitle>
                <CardDescription>
                  Organize your materials into categories
                </CardDescription>
              </div>
              <Button onClick={() => setIsCategoryModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {categories.map((category) => {
                    const materialCount = materials.filter(m => m.subjectId === category.id).length;
                    return (
                      <Card key={category.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">
                              {category.name}
                            </CardTitle>
                            <Badge 
                              variant="outline" 
                              className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                            >
                              {materialCount} {materialCount === 1 ? 'item' : 'items'}
                            </Badge>
                          </div>
                          {category.desc && (
                            <CardDescription className="line-clamp-2">
                              {category.desc}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={materialCount > 0}
                              className="flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                          {materialCount > 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                              Remove all materials to delete this category
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {categories.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                      No categories yet
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      Create your first category to organize your materials
                    </p>
                    <Button onClick={() => setIsCategoryModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Category
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Modal */}
      <CategoryFormModal
        open={isCategoryModalOpen}
        onClose={handleModalClose}
        category={selectedCategory}
      />
    </div>
  );
}
