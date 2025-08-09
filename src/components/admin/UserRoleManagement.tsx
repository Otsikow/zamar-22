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

interface ProfileRow {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface AdminRow {
  id: string;
  user_id: string;
  role: Role;
  created_at: string;
}

const VALID_ROLES = ['listener', 'supporter', 'admin'] as const;
type Role = typeof VALID_ROLES[number];

interface UserWithRole {
  profile: ProfileRow;
  role: Role;
  admin_user_id?: string; // present when a row exists in admin_users
}

const UserRoleManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAllUsersWithRoles();
  }, []);

  const fetchAllUsersWithRoles = async () => {
    try {
      setLoading(true);
      const [{ data: profiles, error: pErr }, { data: adminRows, error: aErr }] = await Promise.all([
        supabase.from('profiles').select('id, email, first_name, last_name').order('created_at', { ascending: false }),
        supabase.from('admin_users').select('id, user_id, role, created_at')
      ]);
      if (pErr) throw pErr;
      if (aErr) throw aErr;

      const roleMap = new Map<string, AdminRow>();
      (adminRows as AdminRow[] | null)?.forEach(r => roleMap.set(r.user_id, r));

      const combined: UserWithRole[] = (profiles as ProfileRow[] | null)?.map(pr => {
        const r = roleMap.get(pr.id);
        return {
          profile: pr,
          role: (r?.role as Role) || 'listener',
          admin_user_id: r?.id,
        };
      }) || [];

      setUsers(combined);
    } catch (error) {
      console.error('Error fetching users/roles:', error);
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (target: UserWithRole, newRole: Role) => {
    if (!VALID_ROLES.includes(newRole)) {
      toast({ title: 'Error', description: 'Invalid role selected', variant: 'destructive' });
      return;
    }

    const userId = target.profile.id;
    setUpdatingRoles(prev => new Set(prev).add(userId));

    try {
      if (target.admin_user_id) {
        // Update existing record
        const { error } = await supabase
          .from('admin_users')
          .update({ role: newRole })
          .eq('id', target.admin_user_id);
        if (error) throw error;
      } else {
        // Create role record for this user
        const { error } = await supabase
          .from('admin_users')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }

      toast({ title: 'Success', description: 'User role saved' });
      await fetchAllUsersWithRoles();
    } catch (error) {
      console.error('Error saving user role:', error);
      toast({ title: 'Error', description: 'Failed to save role', variant: 'destructive' });
    } finally {
      setUpdatingRoles(prev => {
        const next = new Set(prev);
        next.delete(userId);
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

  const filteredUsers = users.filter(u => {
    const email = u.profile.email || '';
    const firstName = u.profile.first_name || '';
    const lastName = u.profile.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    const matchesSearch =
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === (roleFilter as Role);

    return matchesSearch && matchesRole;
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
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
      {/* Summary Cards - Click to filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Users */}
        <Card onClick={() => setRoleFilter('all')} className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admins */}
        <Card onClick={() => setRoleFilter('admin')} className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Crown className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">Admins</p>
                <p className="text-2xl font-bold">{roleCounts.admin || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listeners */}
        <Card onClick={() => setRoleFilter('listener')} className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
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
              onClick={fetchAllUsersWithRoles} 
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
                  filteredUsers.map((u) => {
                    const userId = u.profile.id;
                    const isCurrentUser = user?.id === userId;
                    const isUpdating = updatingRoles.has(userId);
                    
                    return (
                      <TableRow key={userId}>
                        <TableCell>
                          <div className="font-medium">
                            {u.profile.first_name && u.profile.last_name
                              ? `${u.profile.first_name} ${u.profile.last_name}`
                              : 'No name set'}
                            {isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.profile.email || 'No email'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(u.role)}>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(u.role)}
                              {u.role}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(newRole: Role) => updateUserRole(u, newRole)}
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