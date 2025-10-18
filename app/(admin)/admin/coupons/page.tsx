'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, ArrowLeft, Tag, Sparkles, CreditCard, RotateCcw, BarChart3 } from 'lucide-react';
import GeneralCouponsTable from './generalCouponsTable';
import GeneralCouponForm from './generalCouponForm';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CouponUsage {
  id: string;
  discountAmount: number;
  usedAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface GeneralCoupon {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountAmt?: number;
  minOrderValue?: number;
  usageLimit?: number;
  usageCount: number;
  userLimit?: number;
  productType: 'MOCK_BUNDLE' | 'GUIDANCE_SESSION' | 'INDIVIDUAL_MOCK' | 'SUBSCRIPTION' | 'OTHER';
  productIds: string[];
  validFrom: string;
  validTill: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    usages: number;
  };
  usages?: CouponUsage[];
  isExpired?: boolean;
  isUsageLimitReached?: boolean;
  isEffectivelyActive?: boolean;
  usagePercentage?: number;
}

export default function GeneralCouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<GeneralCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<GeneralCoupon | null>(null);
  const [filterProductType, setFilterProductType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchCouponsCallback = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterProductType !== 'all') {
        params.append('productType', filterProductType);
      }
      
      if (filterStatus === 'active') {
        params.append('isActive', 'true');
      } else if (filterStatus === 'inactive') {
        params.append('isActive', 'false');
      }

      const response = await fetch(`/api/admin/general-coupons?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch general coupons');

      const data = await response.json();
      setCoupons(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filterProductType, filterStatus]);

  useEffect(() => {
    fetchCouponsCallback();
  }, [fetchCouponsCallback]);

  const fetchCoupons = () => {
    fetchCouponsCallback();
  };

  const handleCreate = () => {
    setEditingCoupon(null);
    setShowForm(true);
  };

  const handleEdit = (coupon: GeneralCoupon) => {
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
      const response = await fetch(`/api/admin/general-coupons/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete coupon');
      }
      
      fetchCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  };

  const getProductTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MOCK_BUNDLE: 'Mock Bundles',
      GUIDANCE_SESSION: 'Guidance Sessions',
      INDIVIDUAL_MOCK: 'Individual Mocks',
      SUBSCRIPTION: 'Subscriptions',
      OTHER: 'Other'
    };
    return labels[type] || type;
  };

  const activeCoupons = coupons.filter(c => c.isEffectivelyActive);
  const expiredCoupons = coupons.filter(c => c.isExpired);
  const inactiveCoupons = coupons.filter(c => !c.isActive);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <Tag className="w-5 h-5" />
              </div>
              General Coupons
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Universal coupon system for all product types
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 shadow-sm border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin</span>
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
          
          {/* <Button
            variant="outline"
            onClick={() => router.push('/admin/general-coupons/stats')}
            className="flex items-center gap-2 shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistics</span>
          </Button> */}
          
          <Button
            onClick={handleCreate}
            className="flex items-center gap-2 shadow-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Coupon</span>
          </Button>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Product Type</label>
          <Select value={filterProductType} onValueChange={setFilterProductType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="MOCK_BUNDLE">Mock Bundles</SelectItem>
              <SelectItem value="GUIDANCE_SESSION">Guidance Sessions</SelectItem>
              <SelectItem value="INDIVIDUAL_MOCK">Individual Mocks</SelectItem>
              <SelectItem value="SUBSCRIPTION">Subscriptions</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      {coupons.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{activeCoupons.length}</p>
              </div>
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Expired</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{expiredCoupons.length}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-red-200 dark:border-red-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Inactive</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{inactiveCoupons.length}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/40">
                <Tag className="w-5 h-5 text-red-600 dark:text-red-400" />
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
      <Card className="shadow-sm border-gray-200 dark:border-gray-700 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                General Coupons
              </CardTitle>
              <CardDescription>
                {coupons.length > 0 
                  ? `Manage universal discount coupons for all product types`
                  : `No general coupons created yet`
                }
              </CardDescription>
            </div>
            {coupons.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="outline" className="w-fit">
                  {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'}
                </Badge>
                {filterProductType !== 'all' && (
                  <Badge variant="secondary" className="w-fit">
                    {getProductTypeLabel(filterProductType)}
                  </Badge>
                )}
              </div>
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
            <GeneralCouponsTable
              coupons={coupons}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {showForm && (
        <GeneralCouponForm
          coupon={editingCoupon}
          open={showForm}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}