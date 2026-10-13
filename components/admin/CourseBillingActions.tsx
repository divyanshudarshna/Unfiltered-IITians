"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Action = "TERMINATE" | "TERMINATE_REFUND";
export type CourseBillingTarget = { userId: string; courseId: string; action: Action };
type Payment = { paymentId: string; amountPaise: number; currency: string; status: string; capturedAt: string | null; refundDeadline: string | null; refundEligible: boolean; refunds: { id: string | null; status: string; amountPaise: number }[] };
type Billing = { user: { name: string | null; email: string }; course: { title: string }; payments: Payment[]; pendingAction?: ActionRequest | null };
type ActionRequest = CourseBillingTarget & { requestId: string; paymentId?: string; reason: string; confirmation: "TERMINATE" };
type Result = { pending: boolean; message: string; accessTerminated: boolean; refundStatus: string | null; refundId: string | null };
const money = (amount: number, currency: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount / 100);
const date = (value: string | null) => value ? new Date(value).toLocaleString("en-IN") : "Unknown";

export function CourseBillingDialog({ target, onClose, onComplete }: { target: CourseBillingTarget; onClose: () => void; onComplete: () => void }) {
  const { getToken, userId: adminId } = useAuth();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [error, setError] = useState("");
  const [action, setAction] = useState<Action>(target.action);
  const [paymentId, setPaymentId] = useState("");
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [request, setRequest] = useState<ActionRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const storageKey = `admin-course-action:${adminId}:${target.userId}:${target.courseId}`;
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const previous: ActionRequest = JSON.parse(saved);
          if (previous.userId === target.userId && previous.courseId === target.courseId && previous.requestId && previous.confirmation === "TERMINATE") {
            setRequest(previous); setAction(previous.action); setPaymentId(previous.paymentId ?? ""); setReason(previous.reason); setConfirmation("TERMINATE");
          }
        }
        const token = await getToken();
        const response = await fetch(`/api/admin/enrollments/billing?userId=${target.userId}&courseId=${target.courseId}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load billing");
        if (!cancelled) {
          setBilling(data);
          if (!saved && data.pendingAction) {
            const previous: ActionRequest = data.pendingAction;
            setRequest(previous); setAction(previous.action); setPaymentId(previous.paymentId ?? ""); setReason(previous.reason); setConfirmation("TERMINATE");
          } else if (!saved) setPaymentId(data.payments.find((row: Payment) => row.refundEligible)?.paymentId ?? "");
        }
      } catch (failure) { if (!cancelled) setError(failure instanceof Error ? failure.message : "Unable to load billing"); }
    };
    void load();
    return () => { cancelled = true; };
  }, [getToken, storageKey, target.userId, target.courseId]);

  const selectedPayment = billing?.payments.find(row => row.paymentId === paymentId);
  const submit = async () => {
    const body: ActionRequest = request ?? { ...target, action, ...(action === "TERMINATE_REFUND" ? { paymentId } : {}), reason: reason.trim(), requestId: crypto.randomUUID(), confirmation: "TERMINATE" };
    // Persist before POST: closing the dialog or losing the response must not
    // silently create another financial operation on the next attempt.
    try { sessionStorage.setItem(storageKey, JSON.stringify(body)); }
    catch { toast.error("Cannot save the retry ID. Enable browser storage before continuing."); return; }
    setRequest(body); setBusy(true); setError("");
    try {
      const token = await getToken();
      const response = await fetch("/api/admin/enrollments/billing", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
       if (!response.ok) {
         if (data.retryRequired === false) { sessionStorage.removeItem(storageKey); setRequest(null); }
         throw new Error(data.error ?? "Action could not be confirmed. Retry the same request.");
       }
      setResult(data);
      if (!data.pending) { sessionStorage.removeItem(storageKey); onComplete(); toast.success(data.message); }
      else { toast.warning(data.message); onComplete(); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Response unavailable. Retry the same request."); }
    finally { setBusy(false); }
  };
  const complete = result && !result.pending;
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Course access &amp; refund</DialogTitle>
        <DialogDescription>Terminate this student’s course access and stop future course subscription charges. Payment history is retained.</DialogDescription>
      </DialogHeader>
      {billing ? <div className="min-w-0 space-y-5">
        <div className="text-sm break-words"><p className="font-medium">{billing.course.title}</p><p>{billing.user.name || "Student"} · {billing.user.email}</p></div>
        <div className="space-y-2"><Label htmlFor="course-billing-action">Action</Label>
          <Select value={action} onValueChange={value => setAction(value as Action)} disabled={Boolean(request) || busy}>
            <SelectTrigger id="course-billing-action" className="w-full"><SelectValue className="min-w-0 truncate" /></SelectTrigger>
            <SelectContent><SelectItem value="TERMINATE">Terminate access — no refund</SelectItem><SelectItem value="TERMINATE_REFUND">Terminate access &amp; refund selected payment</SelectItem></SelectContent>
          </Select>
        </div>
        {action === "TERMINATE_REFUND" && <div className="space-y-2">
          <Label htmlFor="course-refund-payment">Payment to refund</Label>
          <Select value={paymentId} onValueChange={setPaymentId} disabled={Boolean(request) || busy}>
            <SelectTrigger id="course-refund-payment" className="w-full"><SelectValue className="min-w-0 truncate" placeholder="Select an eligible captured payment" /></SelectTrigger>
            <SelectContent>{billing.payments.map(row => <SelectItem key={row.paymentId} value={row.paymentId}>
              {money(row.amountPaise, row.currency)} · {row.paymentId}{!row.refundEligible ? " — not eligible" : ""}
            </SelectItem>)}</SelectContent>
          </Select>
          {selectedPayment && <div className="text-sm text-muted-foreground"><p>Paid: {date(selectedPayment.capturedAt)}</p><p>Refund deadline: {date(selectedPayment.refundDeadline)}</p><p>Full refund: {money(selectedPayment.amountPaise, selectedPayment.currency)}. No other billing cycles are refunded.</p></div>}
          {selectedPayment?.refunds.map(refund => <p key={refund.id} className="text-sm text-muted-foreground break-all">Refund {refund.id}: {refund.status === "CREATED" ? "Accepted, awaiting processing" : refund.status} · {money(refund.amountPaise, selectedPayment.currency)}</p>)}
          <p className="text-sm text-muted-foreground">Refunds require live Razorpay verification and payment within the past seven days. The server enforces this deadline.</p>
        </div>}
        <div className="space-y-2"><Label htmlFor="course-termination-reason">Reason (required)</Label><Textarea id="course-termination-reason" value={reason} onChange={event => setReason(event.target.value)} maxLength={500} disabled={Boolean(request) || busy} /></div>
        <p className="text-sm text-muted-foreground">Course-included mock and guidance access will also end. Independently purchased access is preserved. This does not delete the student’s account.</p>
        <div className="space-y-2"><Label htmlFor="course-termination-confirmation">Type TERMINATE to confirm</Label><Input id="course-termination-confirmation" autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={Boolean(request) || busy} /></div>
        {request && !complete && <p className="text-sm text-muted-foreground break-all">Retry ID: {request.requestId}. Keep this action unchanged until its outcome is confirmed.</p>}
        {result && <div role="status" className="border border-border rounded-[var(--radius)] p-3 text-sm"><p>{result.message}</p>{result.refundId && <p className="break-all">Refund: {result.refundId} ({result.refundStatus})</p>}</div>}
        {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Close</Button>
          {!complete && <Button variant="destructive" onClick={submit} disabled={busy || confirmation !== "TERMINATE" || reason.trim().length < 5 || (!request && action === "TERMINATE_REFUND" && !selectedPayment?.refundEligible)}>
            {busy ? "Verifying…" : request ? "Retry same action" : action === "TERMINATE_REFUND" ? "Terminate & refund" : "Terminate access"}
          </Button>}
        </div>
      </div> : <p role={error ? "alert" : "status"} className="text-sm text-muted-foreground">{error || "Loading billing history…"}</p>}
    </DialogContent>
  </Dialog>;
}

type Review = { id: string; user: { id: string; name: string | null; email: string }; courseId: string; amountPaise: number; currency: string };
export function CoursePaymentReviews({ courseId, search, refresh, onManage }: { courseId: string; search: string; refresh: number; onManage: (target: CourseBillingTarget) => void }) {
  const { getToken } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setReviews([]); setError("");
    if (!courseId || courseId === "all") return;
    const timer = setTimeout(async () => {
      try {
        const token = await getToken();
        const query = new URLSearchParams({ courseId, search, reviews: "true" });
        const response = await fetch(`/api/admin/enrollments/billing?${query}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load paid reviews");
        if (!cancelled) setReviews(data.checkouts);
      } catch { if (!cancelled) setError("Paid checkout reviews could not be loaded. Refresh to retry."); }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [courseId, search, refresh, getToken]);
  if (!reviews.length && !error) return null;
  return <section className="border border-border rounded-[var(--radius)] bg-card text-card-foreground p-5 space-y-3">
    <h2 className="font-semibold">Captured payments needing access review</h2>
    <p className="text-sm text-muted-foreground">Includes paid checkouts without an enrollment. Up to 50 recent reviews for the selected course; use email search to find a student.</p>
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
    {reviews.map(row => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
      <div className="min-w-0 text-sm break-words"><p className="font-medium">{row.user.name || "Student"} · {money(row.amountPaise, row.currency)}</p><p className="text-muted-foreground">{row.user.email}</p></div>
      <Button variant="outline" onClick={() => onManage({ userId: row.user.id, courseId: row.courseId, action: "TERMINATE_REFUND" })}>Access &amp; refund</Button>
    </div>)}
  </section>;
}
