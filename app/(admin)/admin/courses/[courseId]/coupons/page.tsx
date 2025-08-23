'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, ArrowLeft, Tag, Sparkles, CreditCard, RotateCcw } from 'lucide-react';
import CouponsTable from './couponsTable';
import CouponForm from './couponsForm';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Coupon {
  id: string;
  code: string;
  discountPct: number;
  validTill: string;
  courseId: string;
}

export default function CouponsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>(''); // store course name

  // Fetch coupons
  useEffect(() => {
    fetchCourse();
    fetchCoupons();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch course');
      const data = await res.json();
      setCourseTitle(data.title || 'Course');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/courses/${courseId}/coupons`);
      if (!response.ok) throw new Error('Failed to fetch coupons');

      const data = await response.json();
      setCoupons(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCoupon(null);
    setShowForm(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCoupon(null);
  };

  const handleFormSuccess = () => {
    fetchCoupons();
    handleFormClose();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/coupons`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete coupon');
      fetchCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <Tag className="w-5 h-5" />
              </div>
              Course Coupons
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Managing discounts for: <span className="font-medium text-amber-600 dark:text-amber-400">{courseTitle}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/admin/courses')}
            className="flex items-center gap-2 shadow-sm border-gray-200 dark:border-gray-700 py-4"
          >
            <ArrowLeft className="w-4 h-8" />
            <span>Back to Courses</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={fetchCoupons}
            disabled={loading}
            className="flex items-center gap-2 shadow-sm"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={handleCreate}
            className="flex items-center gap-2 shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Coupon</span>
          </Button>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Stats Cards */}
      {coupons.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Coupons</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{coupons.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/40">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Active Coupons</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {coupons.filter(coupon => new Date(coupon.validTill) > new Date()).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Expired Coupons</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {coupons.filter(coupon => new Date(coupon.validTill) <= new Date()).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setError(null)}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Coupons Table */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-700 overflow-hidden p-4">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 mt-2">
                <Tag className="w-5 h-5 text-primary" />
                Coupon List
              </CardTitle>
              <CardDescription>
                {coupons.length > 0 
                  ? `Manage discount coupons for ${courseTitle}`
                  : `No coupons created yet for ${courseTitle}`
                }
              </CardDescription>
            </div>
            {coupons.length > 0 && (
              <Badge variant="outline" className="w-fit">
                {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <CouponsTable
              coupons={coupons}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {showForm && (
        <CouponForm
          courseId={courseId}
          coupon={editingCoupon}
          open={showForm}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}