'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Users,
  Percent,
  DollarSign,
  Package,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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

interface GeneralCouponsTableProps {
  coupons: GeneralCoupon[];
  onEdit: (coupon: GeneralCoupon) => void;
  onDelete: (id: string) => void;
}

export default function GeneralCouponsTable({ coupons, onEdit, onDelete }: GeneralCouponsTableProps) {
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

  const getProductTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      MOCK_BUNDLE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      GUIDANCE_SESSION: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      INDIVIDUAL_MOCK: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      SUBSCRIPTION: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };
    return colors[type] || colors.OTHER;
  };

  const getStatusBadge = (coupon: GeneralCoupon) => {
    if (!coupon.isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Inactive</Badge>;
    }
    
    if (coupon.isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (coupon.isUsageLimitReached) {
      return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Limit Reached</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Active</Badge>;
  };

  const formatDiscount = (coupon: GeneralCoupon) => {
    if (coupon.discountType === 'PERCENTAGE') {
      return (
        <div className="flex items-center gap-1">
          <Percent className="w-3 h-3" />
          <span>{coupon.discountValue}%</span>
          {coupon.maxDiscountAmt && (
            <span className="text-xs text-muted-foreground">(max ₹{coupon.maxDiscountAmt})</span>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          <span>₹{coupon.discountValue}</span>
        </div>
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (coupons.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No coupons found</h3>
        <p className="text-muted-foreground mb-4">
          Create your first general coupon to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b bg-muted/50">
            <TableHead className="font-semibold">Code</TableHead>
            <TableHead className="font-semibold">Product Type</TableHead>
            <TableHead className="font-semibold">Discount</TableHead>
            <TableHead className="font-semibold">Usage</TableHead>
            <TableHead className="font-semibold">Validity</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow key={coupon.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-bold">{coupon.code}</span>
                  {coupon.name && (
                    <span className="text-xs text-muted-foreground">{coupon.name}</span>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getProductTypeColor(coupon.productType)}`}
                >
                  {getProductTypeLabel(coupon.productType)}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="flex flex-col gap-1">
                  {formatDiscount(coupon)}
                  {coupon.minOrderValue && (
                    <span className="text-xs text-muted-foreground">
                      Min: ₹{coupon.minOrderValue}
                    </span>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">
                      {coupon.usageCount}
                      {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                    </span>
                  </div>
                  {coupon.usagePercentage && (
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(coupon.usagePercentage, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(coupon.validTill)}</span>
                </div>
              </TableCell>
              
              <TableCell>
                {getStatusBadge(coupon)}
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {coupon.code}
                          </Badge>
                          {coupon.name && <span>{coupon.name}</span>}
                        </DialogTitle>
                        <DialogDescription>
                          Coupon details and usage history
                        </DialogDescription>
                      </DialogHeader>
                      
                      <ScrollArea className="max-h-[60vh]">
                        <div className="space-y-4">
                          {/* Coupon Details */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Product Type</label>
                              <p className="text-sm">{getProductTypeLabel(coupon.productType)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Discount</label>
                              <p className="text-sm">{formatDiscount(coupon)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Usage Count</label>
                              <p className="text-sm">
                                {coupon.usageCount} {coupon.usageLimit && `/ ${coupon.usageLimit}`}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Valid Till</label>
                              <p className="text-sm">{formatDate(coupon.validTill)}</p>
                            </div>
                          </div>
                          
                          {coupon.description && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Description</label>
                              <p className="text-sm">{coupon.description}</p>
                            </div>
                          )}
                          
                          {/* Usage History */}
                          {coupon.usages && coupon.usages.length > 0 && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  Recent Usage History
                                </h4>
                                <div className="space-y-2">
                                  {coupon.usages.slice(0, 10).map((usage) => (
                                    <div key={usage.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                      <div>
                                        <p className="text-sm font-medium">
                                          {usage.user.name || usage.user.email}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {usage.user.email}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium">₹{usage.discountAmount}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatDate(usage.usedAt)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(coupon)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(coupon.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}