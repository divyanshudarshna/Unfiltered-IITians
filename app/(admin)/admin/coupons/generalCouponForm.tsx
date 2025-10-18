'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Loader2, AlertTriangle } from 'lucide-react';

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
}

interface GeneralCouponFormProps {
  coupon?: GeneralCoupon | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GeneralCouponForm({ coupon, open, onClose, onSuccess }: GeneralCouponFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 10,
    maxDiscountAmt: '',
    minOrderValue: '',
    usageLimit: '',
    userLimit: '',
    productType: 'MOCK_BUNDLE' as 'MOCK_BUNDLE' | 'GUIDANCE_SESSION' | 'INDIVIDUAL_MOCK' | 'SUBSCRIPTION' | 'OTHER',
    validFrom: '',
    validTill: '',
    isActive: true,
  });

  useEffect(() => {
    if (open) {
      if (coupon) {
        // Editing existing coupon
        setFormData({
          code: coupon.code || '',
          name: coupon.name || '',
          description: coupon.description || '',
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscountAmt: coupon.maxDiscountAmt?.toString() || '',
          minOrderValue: coupon.minOrderValue?.toString() || '',
          usageLimit: coupon.usageLimit?.toString() || '',
          userLimit: coupon.userLimit?.toString() || '',
          productType: coupon.productType,
          validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
          validTill: coupon.validTill ? new Date(coupon.validTill).toISOString().split('T')[0] : '',
          isActive: coupon.isActive,
        });
      } else {
        // Creating new coupon
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        setFormData({
          code: '',
          name: '',
          description: '',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          maxDiscountAmt: '',
          minOrderValue: '',
          usageLimit: '',
          userLimit: '',
          productType: 'MOCK_BUNDLE',
          validFrom: tomorrow.toISOString().split('T')[0],
          validTill: nextMonth.toISOString().split('T')[0],
          isActive: true,
        });
      }
      setError(null);
    }
  }, [open, coupon]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.code || formData.code.trim().length < 2) {
      return 'Coupon code must be at least 2 characters.';
    }
    
    if (formData.discountValue <= 0) {
      return 'Discount value must be greater than 0.';
    }

    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
      return 'Percentage discount cannot exceed 100%.';
    }

    if (!formData.validTill) {
      return 'Valid till date is required.';
    }

    const validTillDate = new Date(formData.validTill);
    const validFromDate = formData.validFrom ? new Date(formData.validFrom) : new Date();
    
    if (validTillDate <= validFromDate) {
      return 'Valid till date must be after valid from date.';
    }

    if (formData.usageLimit && parseInt(formData.usageLimit) <= 0) {
      return 'Usage limit must be greater than 0.';
    }

    if (formData.userLimit && parseInt(formData.userLimit) <= 0) {
      return 'User limit must be greater than 0.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim() || undefined,
        description: formData.description.trim() || undefined,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        maxDiscountAmt: formData.maxDiscountAmt ? parseFloat(formData.maxDiscountAmt) : undefined,
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        userLimit: formData.userLimit ? parseInt(formData.userLimit) : undefined,
        productType: formData.productType,
        validFrom: formData.validFrom || undefined,
        validTill: formData.validTill,
        isActive: formData.isActive,
      };

      const url = coupon 
        ? `/api/admin/general-coupons/${coupon.id}`
        : '/api/admin/general-coupons';
        
      const method = coupon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save coupon');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {coupon ? 'Edit General Coupon' : 'Create General Coupon'}
          </DialogTitle>
          <DialogDescription>
            {coupon 
              ? 'Update the coupon details below.'
              : 'Create a new universal coupon that can be applied to different product types.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Basic Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    placeholder="e.g., SAVE20"
                    className="font-mono"
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., 20% Off Everything"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description for internal use"
                  disabled={loading}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Discount Configuration */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Discount Configuration</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type *</Label>
                  <Select 
                    value={formData.discountType}
                    onValueChange={(value: 'PERCENTAGE' | 'FIXED_AMOUNT') => handleInputChange('discountType', value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Discount Value * {formData.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value) || 0)}
                    min="0"
                    max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                    step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {formData.discountType === 'PERCENTAGE' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountAmt">Maximum Discount (₹)</Label>
                    <Input
                      id="maxDiscountAmt"
                      type="number"
                      value={formData.maxDiscountAmt}
                      onChange={(e) => handleInputChange('maxDiscountAmt', e.target.value)}
                      placeholder="Optional limit"
                      min="0"
                      step="0.01"
                      disabled={loading}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="minOrderValue">Minimum Order Value (₹)</Label>
                  <Input
                    id="minOrderValue"
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => handleInputChange('minOrderValue', e.target.value)}
                    placeholder="Optional minimum"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product & Usage Configuration */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Product & Usage Configuration</h4>
              
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type *</Label>
                <Select 
                  value={formData.productType}
                  onValueChange={(value: any) => handleInputChange('productType', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOCK_BUNDLE">Mock Bundles</SelectItem>
                    <SelectItem value="GUIDANCE_SESSION">Guidance Sessions</SelectItem>
                    <SelectItem value="INDIVIDUAL_MOCK">Individual Mocks</SelectItem>
                    <SelectItem value="SUBSCRIPTION">Subscriptions</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This coupon will only work for {getProductTypeLabel(formData.productType)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Total Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => handleInputChange('usageLimit', e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for unlimited usage
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="userLimit">Per-User Usage Limit</Label>
                  <Input
                    id="userLimit"
                    type="number"
                    value={formData.userLimit}
                    onChange={(e) => handleInputChange('userLimit', e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max uses per user (default: 1 per user)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validity & Status */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Validity & Status</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => handleInputChange('validFrom', e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="validTill">Valid Till *</Label>
                  <Input
                    id="validTill"
                    type="date"
                    value={formData.validTill}
                    onChange={(e) => handleInputChange('validTill', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  disabled={loading}
                />
                <Label htmlFor="isActive">Active</Label>
                <Badge variant={formData.isActive ? "default" : "secondary"} className="ml-2">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {coupon ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                coupon ? 'Update Coupon' : 'Create Coupon'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}