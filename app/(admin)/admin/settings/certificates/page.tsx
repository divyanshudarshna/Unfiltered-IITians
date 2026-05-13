'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Award,
  Calendar,
  Users,
  Download,
  Loader2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import CertificateTemplate from '@/components/certificate/CertificateTemplate';
import { CertificateData } from '@/types/certificate';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface CustomCertificate {
  id: string;
  certificateId: string;
  recipientName: string;
  recipientEmail: string;
  purpose: string;
  startDate: string | null;
  completionDate: string;
  issuedAt: string;
  generatedBy: string | null;
  user: { id: string; name: string | null; email: string } | null;
}

interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  profileImageUrl: string | null;
}

interface Stats {
  total: number;
  today: number;
  thisMonth: number;
}

export default function AdminCertificatesPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  // ---- Generate tab state ----
  const [form, setForm] = useState({
    recipientName: '',
    recipientEmail: '',
    purpose: '',
    startDate: '',
    completionDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewCert, setPreviewCert] = useState<CertificateData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);
  // Separate hidden ref used for PDF download (full-size, off-screen)
  const certDownloadRef = useRef<HTMLDivElement>(null);

  // ---- Log tab state ----
  const [certificates, setCertificates] = useState<CustomCertificate[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, thisMonth: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomCertificate | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // ---- Fetch certificates log ----
  const fetchCertificates = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/admin/certificates/custom?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCertificates(data.certificates);
      setStats(data.stats);
      setTotalPages(data.pagination.pages || 1);
    } catch {
      toast.error('Failed to load certificate log');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, page, search]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // ---- User search ----
  useEffect(() => {
    if (userQuery.length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const token = await getToken();
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(userQuery)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserResults(data.users);
        }
      } catch {
        // ignore
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery, getToken]);

  // ---- Generate certificate ----
  const handleGenerate = async () => {
    if (!form.recipientName.trim() || !form.recipientEmail.trim() || !form.purpose.trim() || !form.completionDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsGenerating(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/certificates/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientName: form.recipientName,
          recipientEmail: form.recipientEmail,
          purpose: form.purpose,
          startDate: form.startDate || null,
          completionDate: form.completionDate,
          ...(selectedUser ? { userId: selectedUser.id } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate');
      }
      const data = await res.json();
      const cert = data.certificate;

      // Build CertificateData for preview
      const certData: CertificateData = {
        id: cert.id,
        certificateId: cert.certificateId,
        studentName: cert.recipientName,
        courseName: cert.purpose,
        courseType: 'SKILLS',
        startDate: cert.startDate || undefined,
        completionDate: cert.completionDate,
        issuedAt: cert.issuedAt,
        instructorName: 'Divyanshu Darshna',
        instructorDesignation: 'Founder & CEO, Unfiltered IITians',
        companyName: 'Unfiltered IITians',
      };
      setPreviewCert(certData);
      setShowPreview(true);
      toast.success('Certificate generated!');
      // Refresh log
      fetchCertificates();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // ---- Download PDF ----
  const handleDownload = async () => {
    if (!certDownloadRef.current || !previewCert) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(certDownloadRef.current, { cacheBust: true, pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [900, 636] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, 900, 636);
      pdf.save(`certificate-${previewCert.certificateId}.pdf`);
      toast.success('Certificate downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    if (!deleteTarget || !deletePassword) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/certificates/custom/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }
      toast.success('Certificate deleted');
      setDeleteTarget(null);
      setDeletePassword('');
      fetchCertificates();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setForm({ recipientName: '', recipientEmail: '', purpose: '', startDate: '', completionDate: format(new Date(), 'yyyy-MM-dd') });
    setSelectedUser(null);
    setUserQuery('');
    setUserResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/settings')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Custom Certificates</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate and manage certificates for interns, mentors, and contributors</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Issued', value: stats.total, icon: Award, color: 'text-amber-600' },
          { label: 'Issued Today', value: stats.today, icon: Calendar, color: 'text-blue-600' },
          { label: 'This Month', value: stats.thisMonth, icon: Users, color: 'text-purple-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 flex items-center gap-4">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Generate Certificate</TabsTrigger>
          <TabsTrigger value="log">Certificate Log</TabsTrigger>
        </TabsList>

        {/* ---- GENERATE TAB ---- */}
        <TabsContent value="generate" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>Certificate Details</CardTitle>
                <CardDescription>Fill in the recipient details to generate a certificate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipient Name */}
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Recipient Name *</Label>
                  <Input
                    id="recipientName"
                    placeholder="Full name as shown on certificate"
                    value={form.recipientName}
                    onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                  />
                </div>

                {/* Recipient Email */}
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Recipient Email *</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="recipient@example.com"
                    value={form.recipientEmail}
                    onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                  />
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose / Program *</Label>
                  <Input
                    id="purpose"
                    placeholder="e.g. Internship Program, Mentorship, Research Contribution"
                    value={form.purpose}
                    onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">This appears as the program/course name on the certificate</p>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date <span className="text-gray-400 text-xs">(optional)</span></Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">Used to calculate and display duration on the certificate</p>
                </div>

                {/* Completion Date */}
                <div className="space-y-2">
                  <Label htmlFor="completionDate">End / Completion Date *</Label>
                  <Input
                    id="completionDate"
                    type="date"
                    value={form.completionDate}
                    onChange={(e) => setForm((f) => ({ ...f, completionDate: e.target.value }))}
                  />
                </div>

                {/* Link to Platform User (optional) */}
                <div className="space-y-2">
                  <Label>Link to Platform User (optional)</Label>
                  {selectedUser ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedUser.name || 'No name'}</p>
                          <p className="text-xs text-gray-500">{selectedUser.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(null);
                          setUserQuery('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        className="pl-9"
                        placeholder="Search by name or email..."
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                      />
                      {userResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 border rounded-lg bg-white dark:bg-gray-900 shadow-lg">
                          {userResults.map((u) => (
                            <button
                              key={u.id}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex flex-col"
                              onClick={() => {
                                setSelectedUser(u);
                                setUserQuery('');
                                setUserResults([]);
                                // Auto-fill name and email if empty
                                setForm((f) => ({
                                  ...f,
                                  recipientName: f.recipientName || u.name || '',
                                  recipientEmail: f.recipientEmail || u.email,
                                }));
                              }}
                            >
                              <span className="text-sm font-medium">{u.name || 'No name'}</span>
                              <span className="text-xs text-gray-500">{u.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {isSearchingUsers && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4 mr-2" />
                        Generate Certificate
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Certificate Preview</CardTitle>
                <CardDescription>Preview will appear here after generation</CardDescription>
              </CardHeader>
              <CardContent>
                {previewCert ? (
                  <div className="space-y-4">
                    {/* Scaled preview - 900x636 → ~360x254 at 0.4 scale */}
                    <div
                      className="overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900"
                      style={{ width: '100%', height: `${Math.round(636 * 0.4)}px`, position: 'relative' }}
                    >
                      <div
                        ref={certRef}
                        style={{
                          transform: 'scale(0.4)',
                          transformOrigin: 'top left',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '900px',
                          height: '636px',
                        }}
                      >
                        {previewCert && (
                          <CertificateTemplate
                            certificate={previewCert}
                            bodyText="has successfully completed"
                            purposeLabel={previewCert.courseName}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex-1"
                        variant="outline"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPreview(true);
                        }}
                      >
                        Full Preview
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-600 border-2 border-dashed rounded-lg">
                    <div className="text-center">
                      <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Certificate preview will appear here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---- LOG TAB ---- */}
        <TabsContent value="log" className="space-y-4 mt-6">
          {/* Search + Refresh */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Search by name, email, or certificate ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchCertificates} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate ID</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Generated By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ) : certificates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No certificates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    certificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {cert.certificateId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {cert.recipientName}
                            </p>
                            <p className="text-xs text-gray-500">{cert.recipientEmail}</p>
                            {cert.user && (
                              <Badge variant="secondary" className="text-xs mt-1">Platform User</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{cert.purpose}</TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(cert.completionDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(cert.issuedAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {cert.generatedBy || '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => {
                              setDeleteTarget(cert);
                              setDeletePassword('');
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Full Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
          </DialogHeader>
          {previewCert && (
            <div className="overflow-auto">
              <CertificateTemplate
                certificate={previewCert}
                bodyText="has successfully completed"
                purposeLabel={previewCert.courseName}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
            <Button onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden full-size certificate used for PDF download */}
      {previewCert && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
          <CertificateTemplate
            ref={certDownloadRef}
            certificate={previewCert}
            bodyText="has successfully completed"
            purposeLabel={previewCert.courseName}
          />
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Certificate
            </DialogTitle>
            <DialogDescription>
              This will permanently delete certificate{' '}
              <span className="font-mono font-semibold">{deleteTarget?.certificateId}</span> for{' '}
              <span className="font-semibold">{deleteTarget?.recipientName}</span>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="deletePassword">Security Password</Label>
            <Input
              id="deletePassword"
              type="password"
              placeholder="Enter security password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || !deletePassword}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
