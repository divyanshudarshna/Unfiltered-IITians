"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Plus, 
  X, 
  Tag, 
  BookOpen, 
  DollarSign, 
  FileText,
  Check
} from "lucide-react";

interface Mock {
  id: string;
  title: string;
  price: number;
}

interface Bundle {
  id?: string;
  title: string;
  description?: string;
  mockIds: string[];
  discountedPrice?: number;
  status: "DRAFT" | "PUBLISHED";
}

interface Props {
  open: boolean;
  onClose: () => void;
  bundle?: Bundle;
}

export const MockBundleFormDialog = ({ open, onClose, bundle }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mockIds, setMockIds] = useState<string[]>([]);
  const [discountedPrice, setDiscountedPrice] = useState<number | undefined>();
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [mocks, setMocks] = useState<Mock[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Fetch all existing mocks
  useEffect(() => {
    setFetchLoading(true);
    fetch("/api/admin/mocks")
      .then((res) => res.json())
      .then((data) => setMocks(data.mocks || []))
      .catch((err) => console.error("Failed to fetch mocks", err))
      .finally(() => setFetchLoading(false));
  }, []);

  // Populate form if editing an existing bundle
  useEffect(() => {
    if (bundle) {
      setTitle(bundle.title || "");
      setDescription(bundle.description || "");
      setMockIds(bundle.mockIds || []);
      setDiscountedPrice(bundle.discountedPrice);
      setStatus(bundle.status || "DRAFT");
    } else {
      setTitle("");
      setDescription("");
      setMockIds([]);
      setDiscountedPrice(undefined);
      setStatus("DRAFT");
    }
  }, [bundle, open]);

  // Calculate total price of selected mocks
  useEffect(() => {
    const selectedMocks = mocks.filter((m) => mockIds.includes(m.id));
    const sum = selectedMocks.reduce((acc, m) => acc + (m.price || 0), 0);
    setTotalPrice(sum);
    // Only auto-fill discounted price if it's a new bundle or not set
    if (discountedPrice === undefined && !bundle) {
      setDiscountedPrice(sum);
    }
  }, [mockIds, mocks, bundle]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return alert("Bundle title is required.");
    }
    
    if (mockIds.length === 0) {
      return alert("Please select at least one mock.");
    }

    setLoading(true);
    try {
      const payload: any = { 
        title: title.trim(), 
        description: description.trim(), 
        mockIds, 
        discountedPrice, 
        status 
      };
      
      if (bundle?.id) payload.id = bundle.id;

      const res = await fetch("/api/admin/mockBundle", {
        method: bundle ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || `Failed to ${bundle ? 'update' : 'create'} bundle.`);
      } else {
        alert(`Bundle ${bundle ? "updated" : "created"} successfully!`);
        onClose();
      }
    } catch (err) {
      console.error("Failed to save bundle", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMockSelection = (mockId: string) => {
    setMockIds(prev => 
      prev.includes(mockId)
        ? prev.filter(id => id !== mockId)
        : [...prev, mockId]
    );
  };

  const removeMock = (mockId: string) => {
    setMockIds(prev => prev.filter(id => id !== mockId));
  };

  const calculateDiscount = () => {
    if (!discountedPrice || totalPrice === 0) return 0;
    return Math.round(((totalPrice - discountedPrice) / totalPrice) * 100);
  };

  const discountPercentage = calculateDiscount();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {bundle ? "Edit Mock Bundle" : "Create Mock Bundle"}
          </DialogTitle>
          <DialogDescription>
            {bundle ? "Update your mock bundle details" : "Create a new bundle of mocks with discounted pricing"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Bundle Title *
            </label>
            <Input
              placeholder="e.g., Premium Mock Package, Complete Test Series"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-primary/20 focus:border-primary/50"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Description
            </label>
            <Textarea
              placeholder="Describe what this bundle includes and its benefits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] border-primary/20 focus:border-primary/50"
            />
          </div>

          {/* Mock Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Select Mocks *
            </label>
            
            {fetchLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading mocks...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-1">
                  {mocks.map((mock) => (
                    <div
                      key={mock.id}
                      onClick={() => toggleMockSelection(mock.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        mockIds.includes(mock.id)
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-slate-200 hover:border-primary/30 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{mock.title}</div>
                          <div className="text-xs text-muted-foreground">₹{mock.price}</div>
                        </div>
                        {mockIds.includes(mock.id) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Mocks */}
                {mockIds.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Selected Mocks ({mockIds.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {mockIds.map(mockId => {
                        const mock = mocks.find(m => m.id === mockId);
                        return mock ? (
                          <Badge 
                            key={mockId}
                            variant="secondary"
                            className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1"
                          >
                            {mock.title}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMock(mockId);
                              }}
                              className="ml-2 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pricing Section */}
          {mockIds.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Original Price:</span>
                <span className="font-semibold">₹{totalPrice}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Discounted Price *
                </label>
                <Input
                  type="number"
                  placeholder="Enter discounted price"
                  value={discountedPrice !== undefined ? discountedPrice : ""}
                  onChange={(e) =>
                    setDiscountedPrice(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="border-primary/20 focus:border-primary/50"
                  min="0"
                />
              </div>

              {discountedPrice !== undefined && totalPrice > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span>You save:</span>
                  <span className="text-green-600 font-semibold">
                    ₹{totalPrice - discountedPrice} ({discountPercentage}% off)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as "DRAFT" | "PUBLISHED")}
            >
              <SelectTrigger className="border-primary/20">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Draft
                </SelectItem>
                <SelectItem value="PUBLISHED" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Published
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between">
          <div className="text-sm text-muted-foreground">
            * Required fields
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="border-slate-200 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !title.trim() || mockIds.length === 0}
              className="bg-primary hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {bundle ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {bundle ? "Update Bundle" : "Create Bundle"}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};