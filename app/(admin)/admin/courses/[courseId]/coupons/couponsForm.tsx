'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface CouponFormProps {
  courseId: string;
  coupon?: {
    id: string;
    code: string;
    discountPct: number;
    validTill: Date;
  } | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CouponForm({ courseId, coupon, open, onClose, onSuccess }: CouponFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    discountPct: coupon?.discountPct || 10,
    validTill: coupon?.validTill ? new Date(coupon.validTill).toISOString().split('T')[0] : '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        code: coupon?.code || '',
        discountPct: coupon?.discountPct || 10,
        validTill: coupon?.validTill ? new Date(coupon.validTill).toISOString().split('T')[0] : '',
      });
      setError(null);
    }
  }, [open, coupon]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discountPct' ? Number(value) : value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.code || formData.code.trim().length < 2) {
      return 'Coupon code must be at least 2 characters.';
    }
    
    if (!formData.discountPct || formData.discountPct < 1 || formData.discountPct > 100) {
      return 'Discount must be between 1% and 100%.';
    }
    
    if (!formData.validTill) {
      return 'Please select a valid date.';
    }
    
    // Check if date is in the future
    const selectedDate = new Date(formData.validTill);
    if (selectedDate <= new Date()) {
      return 'Valid until date must be in the future.';
    }
    
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Manual validation
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      // Use the same endpoint for both POST and PUT
      const url = `/api/admin/courses/${courseId}/coupons`;
      const method = coupon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(coupon && { id: coupon.id }), // Include coupon ID for updates
          code: formData.code.trim().toUpperCase(), // Convert to uppercase to avoid case sensitivity issues
          discountPct: formData.discountPct,
          validTill: formData.validTill,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400 && responseData.error?.includes('code')) {
          throw new Error('Coupon code already exists. Please use a unique code.');
        }
        throw new Error(responseData.error || 'Failed to save coupon');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{coupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
          <DialogDescription>
            {coupon 
              ? 'Update the coupon details below.' 
              : 'Fill in the details to create a new discount coupon for this course.'
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code *</Label>
            <Input
              id="code"
              name="code"
              placeholder="SUMMER2024"
              value={formData.code}
              onChange={handleInputChange}
              required
              className="uppercase" // Display as uppercase
            />
            {formData.code.trim().length < 2 && formData.code.length > 0 && (
              <p className="text-sm text-destructive">Coupon code must be at least 2 characters</p>
            )}
            <p className="text-sm text-muted-foreground">
              Code must be unique across all coupons
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountPct">Discount Percentage *</Label>
            <Input
              id="discountPct"
              name="discountPct"
              type="number"
              min="1"
              max="100"
              value={formData.discountPct}
              onChange={handleInputChange}
              required
            />
            {(formData.discountPct < 1 || formData.discountPct > 100) && (
              <p className="text-sm text-destructive">Discount must be between 1% and 100%</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="validTill">Valid Until *</Label>
            <Input
              id="validTill"
              name="validTill"
              type="date"
              value={formData.validTill}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]} // Set min date to today
              required
            />
            {formData.validTill && new Date(formData.validTill) <= new Date() && (
              <p className="text-sm text-destructive">Valid until date must be in the future</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (coupon ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}