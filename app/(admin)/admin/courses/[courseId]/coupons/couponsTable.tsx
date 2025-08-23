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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2, Search, Filter, Calendar, Percent, Hash, X } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discountPct: number;
  validTill: Date;
  courseId: string;
}

interface CouponsTableProps {
  coupons: Coupon[];
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
}

export default function CouponsTable({ coupons, onEdit, onDelete }: CouponsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [sortConfig, setSortConfig] = useState<{key: keyof Coupon | null; direction: 'ascending' | 'descending'}>({key: null, direction: 'ascending'});

  const isExpired = (validTill: Date) => {
    return new Date(validTill) < new Date();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Request sort
  const requestSort = (key: keyof Coupon) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Sort coupons
  const sortedCoupons = [...coupons].sort((a, b) => {
    if (!sortConfig.key) {
      return 0;
    }
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Filter coupons based on search term and status
  const filteredCoupons = sortedCoupons.filter((coupon) => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
    const isCouponExpired = isExpired(coupon.validTill);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !isCouponExpired) ||
                         (statusFilter === 'expired' && isCouponExpired);
    
    return matchesSearch && matchesStatus;
  });

  if (coupons.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Percent className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No coupons yet</h3>
            <p className="text-sm">Create your first coupon to offer discounts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search coupons by code..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'expired') => setStatusFilter(value)}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredCoupons.length} of {coupons.length} coupons
        </div>
        {searchTerm && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSearchTerm('')}
            className="h-8 px-2 text-xs"
          >
            Clear search
          </Button>
        )}
      </div>

      {/* Table */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-md">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-medium mb-1">No coupons found</h3>
          <p className="text-sm">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-[120px] cursor-pointer hover:bg-accent"
                  onClick={() => requestSort('code')}
                >
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 mr-1" />
                    Code
                    {sortConfig.key === 'code' && (
                      <span className="ml-1 text-xs">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => requestSort('discountPct')}
                >
                  <div className="flex items-center">
                    <Percent className="h-4 w-4 mr-1" />
                    Discount
                    {sortConfig.key === 'discountPct' && (
                      <span className="ml-1 text-xs">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => requestSort('validTill')}
                >
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Valid Until
                    {sortConfig.key === 'validTill' && (
                      <span className="ml-1 text-xs">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => {
                const expired = isExpired(coupon.validTill);
                
                return (
                  <TableRow key={coupon.id} className={expired ? 'opacity-70' : ''}>
                    <TableCell>
                      <div className="font-mono font-semibold bg-secondary/30 px-2 py-1 rounded-md text-center inline-block">
                        {coupon.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{coupon.discountPct}%</span>
                        <span className="text-muted-foreground text-sm ml-1">off</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span className={expired ? 'text-muted-foreground line-through' : ''}>
                          {formatDate(coupon.validTill)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={expired ? "secondary" : "default"}
                        className={expired 
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400" 
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                        }
                      >
                        {expired ? "Expired" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onEdit(coupon)}
                          className="h-8 px-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onDelete(coupon.id)}
                          className="h-8 px-2 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}