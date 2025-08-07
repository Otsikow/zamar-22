import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Search, Users, Crown, Heart } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
}

const VALID_ROLES = ['listener', 'supporter', 'admin'] as const;
type Role = typeof VALID_ROLES[number];

const UserRoleManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      // First get admin users
      const { data: adminUsersData, error: adminError } = await supabase
        .from('admin_users')
        .select('id, user_id, role, created_at')
        .order('created_at', { ascending: false });

      if (adminError) throw adminError;

      // Then get profiles for these users
      const userIds = adminUsersData?.map(user => user.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const combinedData = adminUsersData?.map(adminUser => ({
        ...adminUser,
        profiles: profilesData?.find(profile => profile.id === adminUser.user_id) || null
      })) || [];

      setAdminUsers(combinedData);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch admin users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (adminUserId: string, newRole: Role) => {
    if (!VALID_ROLES.includes(newRole)) {
      toast({
        title: 'Error',
        description: 'Invalid role selected',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingRoles(prev => new Set(prev).add(adminUserId));

    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ role: newRole })
        .eq('id', adminUserId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      // Refresh the data
      await fetchAdminUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRoles(prev => {
        const next = new Set(prev);
        next.delete(adminUserId);
        return next;
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'supporter':
        return <Heart className="h-4 w-4" />;
      case 'listener':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'supporter':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'listener':
        return 'bg-muted/10 text-muted-foreground border-muted/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const filteredUsers = adminUsers.filter(adminUser => {
    const email = adminUser.profiles?.email || '';
    const firstName = adminUser.profiles?.first_name || '';
    const lastName = adminUser.profiles?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    const matchesSearch = 
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || adminUser.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const roleCounts = adminUsers.reduce((acc, adminUser) => {
    acc[adminUser.role] = (acc[adminUser.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">{adminUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">Admins</p>
                <p className="text-2xl font-bold">{roleCounts.admin || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Supporters</p>
                <p className="text-2xl font-bold">{roleCounts.supporter || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Listeners</p>
                <p className="text-2xl font-bold">{roleCounts.listener || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Role Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="supporter">Supporter</SelectItem>
                <SelectItem value="listener">Listener</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={fetchAdminUsers} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((adminUser) => {
                    const isCurrentUser = user?.id === adminUser.user_id;
                    const isUpdating = updatingRoles.has(adminUser.id);
                    
                    return (
                      <TableRow key={adminUser.id}>
                        <TableCell>
                          <div className="font-medium">
                            {adminUser.profiles?.first_name && adminUser.profiles?.last_name
                              ? `${adminUser.profiles.first_name} ${adminUser.profiles.last_name}`
                              : 'No name set'}
                            {isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {adminUser.profiles?.email || 'No email'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(adminUser.role)}>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(adminUser.role)}
                              {adminUser.role}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={adminUser.role}
                            onValueChange={(newRole: Role) => updateUserRole(adminUser.id, newRole)}
                            disabled={isCurrentUser || isUpdating}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VALID_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  <div className="flex items-center gap-2">
                                    {getRoleIcon(role)}
                                    {role}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isCurrentUser && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Cannot edit own role
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleManagement;