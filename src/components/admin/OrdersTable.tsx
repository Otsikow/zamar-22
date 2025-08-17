import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { UpgradeSheet } from "@/components/modals/UpgradeSheet";

type OrderRow = {
  id: string;
  user_email: string | null;
  tier: "basic" | "pro" | "premium";
  amount: number; // pence
  status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  user_id: string;
};

export default function OrdersTable() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "paid" | "failed" | "refunded">("");
  const [upgradeOrder, setUpgradeOrder] = useState<OrderRow | null>(null);
  const { toast } = useToast();

  async function loadOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_list_orders', { 
        p_q: query || null, 
        p_status: statusFilter || null 
      });
      
      if (error) throw error;
      setOrders((data || []) as OrderRow[]);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [query, statusFilter]);

  async function handleResumePayment(orderId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-from-order', {
        body: { order_id: orderId }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Resume payment error:', error);
      toast({
        title: "Error",
        description: "Failed to resume payment. Please try again.",
        variant: "destructive",
      });
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom Song Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Input 
              placeholder="Search email or order ID..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              className="max-w-sm" 
            />
            <div className="flex gap-2">
              {["", "pending", "paid", "failed", "refunded"].map(status => (
                <Button 
                  key={status || "all"} 
                  variant={statusFilter === status ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setStatusFilter(status as any)}
                >
                  {status || "All"}
                </Button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {order.id.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>{order.user_email || 'No email'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {order.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>£{(order.amount / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {order.status === "pending" && (
                            <Button 
                              size="sm" 
                              onClick={() => handleResumePayment(order.id)}
                            >
                              Resume Payment
                            </Button>
                          )}
                          {order.status === "paid" && order.tier !== "premium" && (
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => setUpgradeOrder(order)}
                            >
                              Upgrade
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Sheet */}
      {upgradeOrder && (
        <UpgradeSheet
          open={!!upgradeOrder}
          onOpenChange={(open) => !open && setUpgradeOrder(null)}
          orderId={upgradeOrder.id}
          currentTier={upgradeOrder.tier}
        />
      )}
    </div>
  );
}