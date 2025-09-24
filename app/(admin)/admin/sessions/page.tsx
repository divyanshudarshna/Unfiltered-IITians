'use client';

import { useState, useEffect } from 'react';
import { Session, SessionEnrollment } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, RefreshCw } from 'lucide-react';
import SessionsDatatable from './Datatable';
import SessionFormModal from './formModal';
import SessionsStats from './stats';

interface SessionWithEnrollments extends Session {
  _count: {
    enrollments: number;
  };
  enrollments: SessionEnrollment[];
}

export default function SessionsAdminPage() {
  const [sessions, setSessions] = useState<SessionWithEnrollments[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    totalEnrollments: 0
  });

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sessions');
      const data = await response.json();
      
      if (response.ok) {
        setSessions(data.sessions || []);
        calculateStats(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sessionsData: SessionWithEnrollments[]) => {
    const total = sessionsData.length;
    const published = sessionsData.filter(s => s.status === 'PUBLISHED').length;
    const draft = sessionsData.filter(s => s.status === 'DRAFT').length;
    const archived = sessionsData.filter(s => s.status === 'ARCHIVED').length;
    const totalEnrollments = sessionsData.reduce((sum, session) => sum + session._count.enrollments, 0);

    setStats({ total, published, draft, archived, totalEnrollments });
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreate = () => {
    setEditingSession(null);
    setIsModalOpen(true);
  };

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setIsModalOpen(true);
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchSessions();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Error deleting session');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSession(null);
  };

  const handleModalSuccess = () => {
    fetchSessions();
    handleModalClose();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sessions Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage your training sessions and student enrollments
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Session
          </Button>
        </div>

        {/* Stats Cards */}
        <SessionsStats stats={stats} />

        {/* Actions and Data Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Sessions</CardTitle>
                <CardDescription>
                  Manage all your training sessions in one place
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={fetchSessions}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SessionsDatatable
              sessions={sessions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <SessionFormModal
          session={editingSession}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
}