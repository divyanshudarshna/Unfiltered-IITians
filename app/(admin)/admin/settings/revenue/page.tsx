"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  Loader2,
  Info,
  CheckCircle,
  History
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

interface RevenueSettings {
  id: string;
  currentRevenue: number;
  lifetimeRevenue: number;
  lastDisbursementDate: string | null;
  lastDisbursementAmount: number | null;
  autoResetEnabled: boolean;
  lastResetDate: string | null;
}

interface DisbursementHistory {
  id: string;
  amount: number;
  previousBalance: number;
  disbursedBy: string;
  disbursementDate: string;
  notes: string | null;
  isAutomatic: boolean;
}

export default function RevenuePage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [revenueSettings, setRevenueSettings] = useState<RevenueSettings | null>(null);
  const [disbursementHistory, setDisbursementHistory] = useState<DisbursementHistory[]>([]);
  
  // Disbursement dialog
  const [isDisbursementDialogOpen, setIsDisbursementDialogOpen] = useState(false);
  const [securityPassword, setSecurityPassword] = useState("");
  const [disbursementNotes, setDisbursementNotes] = useState("");
  const [disbursing, setDisbursing] = useState(false);

  // Auto-reset confirmation dialog
  const [isAutoResetDialogOpen, setIsAutoResetDialogOpen] = useState(false);
  const [updatingAutoReset, setUpdatingAutoReset] = useState(false);

  // Fetch revenue data
  const fetchRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch("/api/admin/revenue-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch revenue data");

      const data = await response.json();
      setRevenueSettings(data.revenueSettings);
      setDisbursementHistory(data.disbursementHistory || []);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  // Handle auto-reset toggle
  const handleAutoResetToggle = (checked: boolean) => {
    if (checked) {
      // Show confirmation dialog
      setIsAutoResetDialogOpen(true);
    } else {
      // Direct disable without confirmation
      updateAutoReset(false);
    }
  };

  const updateAutoReset = async (enabled: boolean) => {
    try {
      setUpdatingAutoReset(true);
      const token = await getToken();
      const response = await fetch("/api/admin/revenue-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ autoResetEnabled: enabled }),
      });

      if (!response.ok) throw new Error("Failed to update auto-reset");

      const data = await response.json();
      setRevenueSettings(data.revenueSettings);
      toast.success(enabled ? "Auto-reset enabled" : "Auto-reset disabled");
      setIsAutoResetDialogOpen(false);
    } catch (error) {
      console.error("Error updating auto-reset:", error);
      toast.error("Failed to update auto-reset setting");
    } finally {
      setUpdatingAutoReset(false);
    }
  };

  // Handle manual disbursement
  const handleDisbursement = async () => {
    if (!securityPassword) {
      toast.error("Please enter security password");
      return;
    }

    if (!revenueSettings || revenueSettings.currentRevenue <= 0) {
      toast.error("No revenue to disburse");
      return;
    }

    try {
      setDisbursing(true);
      const token = await getToken();
      const response = await fetch("/api/admin/revenue-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: securityPassword,
          notes: disbursementNotes || null,
        }),
      });

      const data = await response.json();

      if (response.status === 403) {
        toast.error("Invalid security password");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to process disbursement");
      }

      toast.success(`Successfully disbursed ₹${data.disbursedAmount.toLocaleString()}`);
      setIsDisbursementDialogOpen(false);
      setSecurityPassword("");
      setDisbursementNotes("");
      fetchRevenueData(); // Refresh data
    } catch (error: unknown) {
      console.error("Error processing disbursement:", error);
      const message = error instanceof Error ? error.message : "Failed to process disbursement";
      toast.error(message);
    } finally {
      setDisbursing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.push("/admin/settings")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Settings
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Revenue & Disbursement</h1>
        <p className="text-gray-600">Manage revenue tracking and disbursements</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          {/* Revenue Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  ₹{revenueSettings?.currentRevenue.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Available for disbursement
                </p>
              </CardContent>
            </Card>

            {/* Lifetime Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lifetime Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ₹{revenueSettings?.lifetimeRevenue.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total earnings from beginning
                </p>
              </CardContent>
            </Card>

            {/* Last Disbursement */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Disbursement</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ₹{revenueSettings?.lastDisbursementAmount?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {revenueSettings?.lastDisbursementDate
                    ? formatDate(revenueSettings.lastDisbursementDate)
                    : "No disbursement yet"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Management</CardTitle>
              <CardDescription>
                Configure revenue tracking and disbursement settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Manual Disbursement */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Manual Disbursement
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reset current revenue to ₹0 and record disbursement
                  </p>
                </div>
                <Button
                  onClick={() => setIsDisbursementDialogOpen(true)}
                  disabled={!revenueSettings || revenueSettings.currentRevenue <= 0}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700"
                >
                  Disburse Amount
                </Button>
              </div>

              {/* Auto-Reset Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Automatic Yearly Reset
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically reset revenue to ₹0 on April 1st every year
                  </p>
                </div>
                <Switch
                  checked={revenueSettings?.autoResetEnabled || false}
                  onCheckedChange={handleAutoResetToggle}
                  disabled={updatingAutoReset}
                />
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold">Important Information</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Current revenue tracks earnings since the last disbursement</li>
                    <li>Lifetime revenue shows total earnings from the very beginning</li>
                    <li>Manual disbursement requires security password confirmation</li>
                    <li>Auto-reset only affects current revenue, not lifetime revenue</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disbursement History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                <CardTitle>Disbursement History</CardTitle>
              </div>
              <CardDescription>
                View all past disbursements and resets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {disbursementHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No disbursement history yet</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Disbursed By</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disbursementHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDate(record.disbursementDate)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-semibold text-emerald-600">
                              ₹{record.amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.isAutomatic ? "secondary" : "default"}>
                              {record.isAutomatic ? "Automatic" : "Manual"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{record.disbursedBy}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {record.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Manual Disbursement Dialog */}
      <Dialog open={isDisbursementDialogOpen} onOpenChange={setIsDisbursementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <DollarSign className="w-5 h-5" />
              Confirm Disbursement
            </DialogTitle>
            <DialogDescription>
              This will reset the current revenue to ₹0 and record the disbursement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm font-semibold text-emerald-900">Amount to Disburse:</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                ₹{revenueSettings?.currentRevenue.toLocaleString()}
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={disbursementNotes}
                onChange={(e) => setDisbursementNotes(e.target.value)}
                placeholder="Add any notes about this disbursement..."
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="securityPassword" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Security Password *
              </Label>
              <Input
                id="securityPassword"
                type="password"
                value={securityPassword}
                onChange={(e) => setSecurityPassword(e.target.value)}
                placeholder="Enter admin security password"
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDisbursementDialogOpen(false);
                setSecurityPassword("");
                setDisbursementNotes("");
              }}
              disabled={disbursing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisbursement}
              disabled={!securityPassword || disbursing}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              {disbursing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Disbursement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Reset Confirmation Dialog */}
      <Dialog open={isAutoResetDialogOpen} onOpenChange={setIsAutoResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Calendar className="w-5 h-5" />
              Enable Automatic Yearly Reset
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to enable automatic revenue reset?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                When enabled, the system will automatically:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800 list-disc list-inside">
                <li>Reset current revenue to ₹0 on April 1st every year</li>
                <li>Create an automatic disbursement record</li>
                <li>Keep lifetime revenue tracking intact</li>
                <li>Notify administrators of the reset</li>
              </ul>
            </div>

            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800">
                This is a critical setting. Ensure you understand the implications before enabling.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAutoResetDialogOpen(false)}
              disabled={updatingAutoReset}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateAutoReset(true)}
              disabled={updatingAutoReset}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              {updatingAutoReset ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Enable Auto-Reset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
