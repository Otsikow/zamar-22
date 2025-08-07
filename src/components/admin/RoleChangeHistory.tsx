import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';
import { format } from 'date-fns';

interface RoleChange {
  id: string;
  user_id: string;
  changed_by: string;
  old_role: string;
  new_role: string;
  changed_at: string;
  user_email: string;
  admin_email: string;
}

type FilterType = 'all' | 'promotions' | 'demotions';

export default function RoleChangeHistory() {
  const [roleChanges, setRoleChanges] = useState<RoleChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchRoleChanges();
  }, []);

  const fetchRoleChanges = async () => {
    try {
      setLoading(true);
      
      // Get role changes with user emails by joining with profiles
      const { data, error } = await supabase
        .from('role_change_logs')
        .select(`
          id,
          user_id,
          changed_by,
          old_role,
          new_role,
          changed_at
        `)
        .order('changed_at', { ascending: false });

      if (error) throw error;

      // Get user profiles separately to get emails
      const userIds = [...new Set([
        ...data.map(item => item.user_id),
        ...data.map(item => item.changed_by)
      ].filter(Boolean))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      // Transform the data to include email addresses
      const formattedData = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        changed_by: item.changed_by,
        old_role: item.old_role,
        new_role: item.new_role,
        changed_at: item.changed_at,
        user_email: profileMap[item.user_id]?.email || 'Unknown',
        admin_email: profileMap[item.changed_by]?.email || 'Unknown'
      })) || [];

      setRoleChanges(formattedData);
    } catch (error: any) {
      console.error('Error fetching role changes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch role change history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleHierarchy = (role: string): number => {
    switch (role) {
      case 'listener': return 1;
      case 'supporter': return 2;
      case 'admin': return 3;
      default: return 0;
    }
  };

  const isPromotion = (oldRole: string, newRole: string): boolean => {
    return getRoleHierarchy(newRole) > getRoleHierarchy(oldRole);
  };

  const isDemotion = (oldRole: string, newRole: string): boolean => {
    return getRoleHierarchy(newRole) < getRoleHierarchy(oldRole);
  };

  const getChangeType = (oldRole: string, newRole: string): 'promotion' | 'demotion' | 'neutral' => {
    if (isPromotion(oldRole, newRole)) return 'promotion';
    if (isDemotion(oldRole, newRole)) return 'demotion';
    return 'neutral';
  };

  const filteredChanges = roleChanges.filter(change => {
    const matchesSearch = change.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterType === 'all') return true;
    if (filterType === 'promotions') return isPromotion(change.old_role, change.new_role);
    if (filterType === 'demotions') return isDemotion(change.old_role, change.new_role);
    
    return true;
  });

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'supporter': return 'secondary';
      case 'listener': return 'outline';
      default: return 'outline';
    }
  };

  const getRowClassName = (oldRole: string, newRole: string): string => {
    const changeType = getChangeType(oldRole, newRole);
    if (changeType === 'promotion') return 'bg-green-50 dark:bg-green-950/20';
    if (changeType === 'demotion') return 'bg-red-50 dark:bg-red-950/20';
    return '';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Role Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by user email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter changes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Changes</SelectItem>
                <SelectItem value="promotions">Promotions Only</SelectItem>
                <SelectItem value="demotions">Demotions Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredChanges.length} of {roleChanges.length} role changes
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User Email</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Role Change</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading role changes...
                    </TableCell>
                  </TableRow>
                ) : filteredChanges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No role changes found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChanges.map((change) => (
                    <TableRow 
                      key={change.id}
                      className={getRowClassName(change.old_role, change.new_role)}
                    >
                      <TableCell className="font-medium">
                        {format(new Date(change.changed_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{change.user_email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {change.admin_email}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleVariant(change.old_role)}>
                            {change.old_role}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant={getRoleVariant(change.new_role)}>
                            {change.new_role}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {isPromotion(change.old_role, change.new_role) && (
                          <ArrowUpCircle className="h-4 w-4 text-green-600 mx-auto" />
                        )}
                        {isDemotion(change.old_role, change.new_role) && (
                          <ArrowDownCircle className="h-4 w-4 text-red-600 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}