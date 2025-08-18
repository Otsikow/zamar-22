import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Helper function for consistent GBP formatting
const formatGBP = (cents: number | null | undefined): string => {
  if (cents == null) return "£0.00";
  const value = (Number(cents) / 100).toFixed(2);
  return `£${value}`;
};

interface CommissionRecord {
  id: string;
  earner_user_id: string;
  purchaser_user_id: string;
  generation: number;
  rate: number;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'paid' | 'void';
  created_at: string;
  paid_at?: string;
  notes?: string;
  source_order_id: string;
  earner_name?: string;
  referred_name?: string;
}

interface CommissionBreakdownTableProps {
  commissions: CommissionRecord[];
  onMarkPaid: (id: string) => void;
  onVoid: (commission: CommissionRecord) => void;
  onExportCSV: () => void;
}

export function CommissionBreakdownTable({ 
  commissions, 
  onMarkPaid, 
  onVoid, 
  onExportCSV 
}: CommissionBreakdownTableProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const paginatedCommissions = commissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(commissions.length / pageSize);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'ID copied to clipboard' });
  };

  const getStatusChip = (status: string) => {
    const variants = {
      pending: 'bg-warning/20 text-warning border-warning/30',
      paid: 'bg-success/20 text-success border-success/30',
      void: 'bg-muted/20 text-muted-foreground border-muted/30'
    };
    
    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    );
  };

  const getGenerationBadge = (generation: number) => {
    return generation === 1 ? (
      <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
        Gen-1 (15%)
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
        Gen-2 (10%)
      </Badge>
    );
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Commission Breakdown</CardTitle>
          <Button onClick={onExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-primary/20">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead>Date</TableHead>
                <TableHead>Earner</TableHead>
                <TableHead>Referred User</TableHead>
                <TableHead>Generation</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCommissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No commissions found for current filters
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCommissions.map((commission) => (
                  <TableRow key={commission.id} className="border-primary/20">
                    <TableCell>
                      {format(new Date(commission.created_at), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {commission.earner_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {commission.referred_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {getGenerationBadge(commission.generation)}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatGBP(commission.amount_cents)}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(commission.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          {commission.id.substring(0, 8)}...
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(commission.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {commission.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => onMarkPaid(commission.id)}
                              className="h-8"
                            >
                              Mark Paid
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onVoid(commission)}
                              className="h-8 text-muted-foreground hover:text-destructive"
                            >
                              Void
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, commissions.length)} of {commissions.length} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}