'use client';

import { useState } from 'react';
import { Session, SessionEnrollment, SessionStatus, SessionType } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Users, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface SessionWithEnrollments extends Omit<Session, 'order'> {
  _count: {
    enrollments: number;
  };
  enrollments: SessionEnrollment[];
  order?: number;
}

interface DatatableProps {
  sessions: SessionWithEnrollments[];
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function SessionsDatatable({ sessions, onEdit, onDelete, loading, onRefresh }: Readonly<DatatableProps>) {
  const [isReordering, setIsReordering] = useState(false);

  // 🔄 Handle reordering sessions
  const handleReorderSessions = async (newOrder: SessionWithEnrollments[]) => {
    try {
      setIsReordering(true);
      
      const sessionOrders = newOrder.map((session, index) => ({
        id: session.id,
        order: index + 1,
      }));

      const response = await fetch('/api/admin/sessions/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionOrders }),
      });

      if (!response.ok) throw new Error('Failed to reorder sessions');

      toast.success('Session order updated successfully');
      onRefresh();
    } catch (error) {
      console.error('Error reordering sessions:', error);
      toast.error('Failed to update session order');
    } finally {
      setIsReordering(false);
    }
  };

  // Move session up in order
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSessions = [...sessions];
    [newSessions[index], newSessions[index - 1]] = [newSessions[index - 1], newSessions[index]];
    handleReorderSessions(newSessions);
  };

  // Move session down in order
  const moveDown = (index: number) => {
    if (index === sessions.length - 1) return;
    const newSessions = [...sessions];
    [newSessions[index], newSessions[index + 1]] = [newSessions[index + 1], newSessions[index]];
    handleReorderSessions(newSessions);
  };

  const getStatusBadge = (status: SessionStatus) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary' as const, label: 'Draft' },
      PUBLISHED: { variant: 'default' as const, label: 'Published' },
      ARCHIVED: { variant: 'outline' as const, label: 'Archived' }
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: SessionType) => {
    const typeConfig = {
      ONE_ON_ONE: { variant: 'secondary' as const, label: '1-on-1' },
      GROUP: { variant: 'default' as const, label: 'Group' }
    };

    const config = typeConfig[type];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No expiry';
    return new Date(date).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading sessions...</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">No sessions found</h3>
        <p className="text-muted-foreground mt-1">
          Create your first session to get started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Order</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Enrollments</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session, index) => (
            <TableRow key={session.id} className="hover:bg-muted/50">
              <TableCell className="w-20">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{session.order || 0}</span>
                  <div className="flex flex-col gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveUp(index)}
                      disabled={index === 0 || isReordering}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveDown(index)}
                      disabled={index === sessions.length - 1 || isReordering}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold">{session.title}</div>
                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                    {session.description || 'No description'}
                  </div>
                </div>
              </TableCell>
              <TableCell>{getTypeBadge(session.type)}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {formatPrice(session.discountedPrice || session.price)}
                  </span>
                  {session.discountedPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(session.price)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {session._count.enrollments}
                  {session.maxEnrollment ? ` / ${session.maxEnrollment}` : ' / ∞'}
                </div>
              </TableCell>
              <TableCell>{session.duration} mins</TableCell>
              <TableCell>{formatDate(session.expiryDate)}</TableCell>
              <TableCell>{getStatusBadge(session.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(session as Session)}
                    className="h-8 gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // View enrollments - implement later
                      console.log('View enrollments for:', session.id);
                    }}
                    className="h-8 gap-1"
                  >
                    <Users className="h-3 w-3" />
                    View
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(session.id)}
                    className="h-8 gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
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