'use client';

import { Session, SessionEnrollment, SessionStatus, SessionType } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Users, Loader2 } from 'lucide-react';

interface SessionWithEnrollments extends Session {
  _count: {
    enrollments: number;
  };
  enrollments: SessionEnrollment[];
}

interface DatatableProps {
  sessions: SessionWithEnrollments[];
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  loading: boolean;
}

export default function SessionsDatatable({ sessions, onEdit, onDelete, loading }: DatatableProps) {
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
          {sessions.map((session) => (
            <TableRow key={session.id} className="hover:bg-muted/50">
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
                    onClick={() => onEdit(session)}
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