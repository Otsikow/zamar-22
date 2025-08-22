import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Search, Users, Crown, Heart, MessageCircle, Ban, Trash2 } from 'lucide-react';

interface UserWithRole {
  id: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  role: Role;
  account_status?: 'active' | 'suspended' | 'deleted';
  is_suspended?: boolean;
  soft_deleted_at?: string;
  created_at?: string;
  last_sign_in_at?: string;
}

const VALID_ROLES = ['listener', 'supporter', 'admin'] as const;
type Role = typeof VALID_ROLES[number];

const UserRoleManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

  // Calculate role counts using the new admin_counts function
  const [roleCounts, setRoleCounts] = useState({
    total: 0,
    admins: 0,
    supporters: 0,
    listeners: 0,
  });

  useEffect(() => {
    fetchAllUsersWithRoles();
  }, []);

  const fetchAllUsersWithRoles = async () => {
    try {
      setLoading(true);
      
      // Use the profiles table directly (much simpler!)
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          first_name,
          last_name,
          role,
          account_status,
          is_suspended,
          soft_deleted_at,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user details:', error);
        
        // Provide specific error messages
        if (error.message.includes('access')) {
          toast({ 
            title: 'Access Denied', 
            description: 'You must be logged in as an admin to view user management. Please sign in with an admin account.', 
            variant: 'destructive' 
          });
        } else {
          toast({ 
            title: 'Error', 
            description: `Failed to fetch users: ${error.message}`, 
            variant: 'destructive' 
          });
        }
        return;
      }

      // Type the data properly
      const typedUsers: UserWithRole[] = (usersData || []).map(user => ({
        ...user,
        role: (user.role as Role) || 'listener'
      }));

      setUsers(typedUsers);
      
      // Fetch role counts using the new function
      await fetchRoleCounts();
    } catch (error) {
      console.error('Error fetching users/roles:', error);
      toast({ 
        title: 'Authentication Required', 
        description: 'Please log in as an admin to access user management features.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleCounts = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_counts');
      if (error) throw error;
      
      // Parse the JSON response properly
      const counts = typeof data === 'string' ? JSON.parse(data) : data;
      setRoleCounts({
        total: counts.total || 0,
        admins: counts.admins || 0,
        supporters: counts.supporters || 0,
        listeners: counts.listeners || 0,
      });
    } catch (error) {
      console.error('Error fetching role counts:', error);
      // Fall back to calculating from current users list
      const counts = users.reduce((acc, u) => {
        acc.total += 1;
        if (u.role === 'admin') acc.admins += 1;
        else if (u.role === 'supporter') acc.supporters += 1;
        else acc.listeners += 1;
        return acc;
      }, { total: 0, admins: 0, supporters: 0, listeners: 0 });
      setRoleCounts(counts);
    }
  };

  const updateUserRole = async (target: UserWithRole, newRole: Role) => {
    if (!VALID_ROLES.includes(newRole)) {
      toast({ title: 'Error', description: 'Invalid role selected', variant: 'destructive' });
      return;
    }

    const userId = target.id;
    setUpdatingRoles(prev => new Set(prev).add(userId));

    try {
      // Update role directly in the profiles table (much simpler!)
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;

      toast({ title: 'Success', description: 'User role updated successfully' });
      await fetchAllUsersWithRoles();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    } finally {
      setUpdatingRoles(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleChat = (targetUserId: string) => {
    navigate(`/admin?tab=chat&chatUserId=${targetUserId}`);
  };

  const handleSuspendToggle = async (targetUserId: string, isSuspended: boolean) => {
    try {
      if (isSuspended) {
        const { error } = await supabase.rpc('admin_unsuspend_user', { target_user_id: targetUserId });
        if (error) throw error;
        toast({ title: 'User unsuspended' });
      } else {
        const { error } = await supabase.rpc('admin_suspend_user', { target_user_id: targetUserId });
        if (error) throw error;
        toast({ title: 'User suspended' });
      }
      await fetchAllUsersWithRoles();
    } catch (error) {
      console.error('Suspend toggle failed:', error);
      toast({ title: 'Error', description: 'Failed to update suspension', variant: 'destructive' });
    }
  };

  const handleSoftDelete = async (targetUserId: string) => {
    if (!confirm('Delete this user? This will permanently remove them from the system.')) return;
    
    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Call the edge function with proper authorization
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: targetUserId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Function error details:', error);
        throw error;
      }
      
      if (!data?.ok) {
        throw new Error(data?.error || 'Delete operation failed');
      }
      
      toast({ title: 'User deleted', description: 'User has been permanently deleted' });
      await fetchAllUsersWithRoles();
    } catch (error) {
      console.error('Delete failed:', error);
      const errorMessage = (error as any)?.message || 'Failed to delete user';
      toast({ title: 'Error', description: `Failed to delete user: ${errorMessage}`, variant: 'destructive' });
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
    const email = u.email || '';
    const firstName = u.first_name || '';
    const lastName = u.last_name || '';
    const fullName = u.full_name || `${firstName} ${lastName}`.trim();

    const matchesSearch =
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === (roleFilter as Role);

    return matchesSearch && matchesRole;
  });

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
                <p className="text-2xl font-bold">{roleCounts.total}</p>
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
                <p className="text-2xl font-bold">{roleCounts.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supporters */}
        <Card onClick={() => setRoleFilter('supporter')} className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Heart className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Supporters</p>
                <p className="text-2xl font-bold">{roleCounts.supporters}</p>
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
                <p className="text-2xl font-bold">{roleCounts.listeners}</p>
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

          {/* Mobile-Optimized User Cards */}
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No users found
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((u) => {
                const userId = u.id;
                const isCurrentUser = user?.id === userId;
                const isUpdating = updatingRoles.has(userId);
                
                return (
                  <Card key={userId} className="overflow-hidden">
                    <CardContent className="p-4">
                      {/* User Info Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">
                              {u.full_name && u.full_name !== u.email 
                                ? u.full_name 
                                : (u.first_name || u.last_name 
                                  ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                                  : u.email?.split('@')[0] || 'Unknown User')}
                            </h3>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {u.email || 'No email available'}
                          </p>
                        </div>
                        
                        {/* Status Badges */}
                        <div className="flex flex-col gap-1">
                          {u.account_status === 'suspended' && (
                            <Badge variant="secondary" className="text-xs">Suspended</Badge>
                          )}
                          {u.account_status === 'deleted' && (
                            <Badge variant="destructive" className="text-xs">Deleted</Badge>
                          )}
                        </div>
                      </div>

                      {/* Role Selection */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Role:</span>
                          <Badge className={getRoleColor(u.role)}>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(u.role)}
                              <span className="capitalize">{u.role}</span>
                            </div>
                          </Badge>
                        </div>
                        
                        <Select
                          value={u.role}
                          onValueChange={(newRole: Role) => updateUserRole(u, newRole)}
                          disabled={isCurrentUser || isUpdating}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VALID_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  {getRoleIcon(role)}
                                  <span className="capitalize">{role}</span>
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
                      </div>

                      {/* Action Buttons - Mobile Optimized */}
                      <div className="grid grid-cols-1 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleChat(userId)}
                          className="justify-start"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Start Chat
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuspendToggle(userId, u.account_status === 'suspended')}
                            disabled={isCurrentUser}
                            className="justify-start"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            {u.account_status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSoftDelete(userId)}
                            disabled={isCurrentUser}
                            className="justify-start"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleManagement;