import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Bell, MessageCircle, Music, Heart, Check, CheckCheck, ExternalLink, Trash2, Undo2 } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
  metadata?: any;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'message' | 'song_request'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    fetchUserProfiles();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email');

      if (error) throw error;
      
      // Convert array to record for easy lookup
      const profilesRecord = (data || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, UserProfile>);
      
      setUserProfiles(profilesRecord);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );

      toast({
        title: 'Success',
        description: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: false })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: false }
            : notif
        )
      );

      toast({ title: 'Updated', description: 'Notification marked as unread' });
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      toast({ title: 'Error', description: 'Failed to mark as unread', variant: 'destructive' });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({ title: 'Deleted', description: 'Notification removed' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' });
    }
  };

  const markGroupAsRead = async (senderId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .or(`user_id.eq.${senderId},metadata->>sender_user_id.eq.${senderId}`)
        .eq('is_read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(n => {
        const key = (n.metadata?.sender_user_id || n.user_id);
        return key === senderId ? { ...n, is_read: true } : n;
      }));
    } catch (error) {
      console.error('Error marking group as read:', error);
    }
  };

  const markGroupAsUnread = async (senderId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: false })
        .or(`user_id.eq.${senderId},metadata->>sender_user_id.eq.${senderId}`)
        .eq('is_read', true);
      if (error) throw error;
      setNotifications(prev => prev.map(n => {
        const key = (n.metadata?.sender_user_id || n.user_id);
        return key === senderId ? { ...n, is_read: false } : n;
      }));
    } catch (error) {
      console.error('Error marking group as unread:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Handle different notification types
    if (notification.type === 'message') {
      // Navigate to chat with the specific user
      const senderUserId = notification.metadata?.sender_user_id || notification.user_id;
      console.log('Navigating to chat with user:', senderUserId);
      console.log('Full notification:', notification);
      // Navigate to admin chat inbox with user and room parameters
      const roomId = notification.metadata?.room_id;
      navigate(`/admin/chat-inbox?user=${senderUserId}${roomId ? `&room=${roomId}` : ''}`);
    } else if (notification.type === 'song_request') {
      // Navigate to admin panel or request review
      navigate('/admin');
    } else {
      // For other types, just mark as read
      toast({
        title: 'Notification opened',
        description: 'This notification has been marked as read',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'song_request':
        return <Music className="h-4 w-4" />;
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      case 'donation':
        return <Heart className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'song_request':
        return 'bg-blue-500';
      case 'message':
        return 'bg-green-500';
      case 'donation':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.is_read;
    return notification.type === filter;
  });

  // Group notifications by sender (prefer metadata.sender_user_id, fallback to user_id)
  const grouped = Object.values(
    filteredNotifications.reduce((acc, n) => {
      const senderId = n.metadata?.sender_user_id || n.user_id || 'unknown';
      if (!acc[senderId]) acc[senderId] = { senderId, items: [] as Notification[] };
      acc[senderId].items.push(n);
      return acc;
    }, {} as Record<string, { senderId: string; items: Notification[] }>)
  ).map(g => {
    // sort items by created_at desc inside each group
    g.items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latestAt = g.items[0]?.created_at || new Date(0).toISOString();
    const unread = g.items.filter(i => !i.is_read).length;
    return { ...g, latestAt, unread };
  }).sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());

  const getUserDisplayName = (userId: string) => {
    const profile = userProfiles[userId];
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile?.email || 'Anonymous User';
  };

  const getNotificationDisplayMessage = (notification: Notification) => {
    if (notification.type === 'message') {
      const senderId = notification.metadata?.sender_user_id || notification.user_id;
      const userName = getUserDisplayName(senderId);
      const preview: string | undefined = notification.metadata?.message_preview;
      const previewText = preview ? `: ${preview.length > 120 ? preview.slice(0, 117) + '…' : preview}` : '';
      return `New chat message from ${userName}${previewText}`;
    }
    return notification.message;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
  return (
    <div className="min-h-screen bg-background pb-32">{/* Added extra bottom padding for mini player + nav */}
      <div className="container mx-auto px-4 py-8 pt-20 pb-8">{/* Ensured proper top and bottom spacing */}
          <div className="flex items-center justify-center h-64">
            <div className="text-primary">Loading notifications...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">{/* Added extra bottom padding for mini player + nav */}
      <div className="container mx-auto px-4 py-8 pt-20 pb-8">{/* Ensured proper top and bottom spacing */}
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notification Center
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage and review app alerts and notifications
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All as Read ({unreadCount})
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === 'message' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('message')}
          >
            Messages ({notifications.filter(n => n.type === 'message').length})
          </Button>
          <Button
            variant={filter === 'song_request' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('song_request')}
          >
            Song Requests ({notifications.filter(n => n.type === 'song_request').length})
          </Button>
        </div>

        {/* Grouped Notifications */}
        <div className="space-y-4">
          {grouped.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No notifications found
                </h3>
                <p className="text-muted-foreground text-center">
                  {filter === 'all' 
                    ? "You're all caught up! No notifications to display."
                    : `No ${filter} notifications found.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            grouped.map((group) => (
              <Card key={group.senderId} className={`transition-all animate-fade-in hover:shadow-md ${group.unread > 0 ? 'border-yellow-500 shadow-yellow-500/20' : ''}`}>
                <CardContent className="p-4 space-y-4">
                  {/* Group header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full h-10 w-10 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {getUserDisplayName(group.senderId)}
                        </div>
                        {userProfiles[group.senderId]?.email && (
                          <div className="text-xs text-muted-foreground">
                            {userProfiles[group.senderId]?.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap md:justify-end">
                      <Badge variant="outline" className="text-xs rounded-full px-2.5 py-1">
                        {group.items.length} total
                      </Badge>
                      {group.unread > 0 && (
                        <Badge variant="destructive" className="bg-[#FFD700] text-black text-xs rounded-full px-2.5 py-1">
                          {group.unread} unread
                        </Badge>
                      )}
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/chat-inbox?user=${group.senderId}`)}>
                        Open Chat
                      </Button>
                      {group.unread > 0 ? (
                        <Button size="sm" variant="outline" onClick={() => markGroupAsRead(group.senderId)}>
                          <Check className="h-4 w-4 mr-1" /> Mark all read
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => markGroupAsUnread(group.senderId)}>
                          <Undo2 className="h-4 w-4 mr-1" /> Mark all unread
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Items in group */}
                  <div className="space-y-3">
                    {group.items.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer overflow-hidden ${
                          !notification.is_read ? 'border-yellow-500/80 shadow-yellow-500/10' : 'border-gray-800'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Status Dot & Icon */}
                          <div className="flex flex-col items-center gap-2 pt-1">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                !notification.is_read ? 'bg-yellow-500' : 'bg-gray-400'
                              }`}
                            />
                            <div className={`p-2 rounded-full ${getTypeColor(notification.type)} text-white`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {notification.type.replace('_', ' ')}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                                {(notification.type === 'message' || notification.type === 'song_request') && (
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start sm:justify-end">
                                {(notification.type === 'message' || notification.type === 'song_request') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNotificationClick(notification);
                                    }}
                                    className="shrink-0 whitespace-nowrap"
                                  >
                                    {notification.type === 'message' ? 'Open Chat' : 'Review'}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="shrink-0 whitespace-nowrap"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                                {!notification.is_read ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="shrink-0 whitespace-nowrap"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Mark Read
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsUnread(notification.id);
                                    }}
                                    className="shrink-0 whitespace-nowrap"
                                  >
                                    <Undo2 className="h-4 w-4 mr-1" />
                                    Mark Unread
                                  </Button>
                                )}
                              </div>
                            </div>

                            <p className="text-foreground leading-relaxed">
                              {getNotificationDisplayMessage(notification)}
                            </p>

                            {notification.type === 'message' && (
                              <div className="mt-2 space-y-1">
                                {notification.metadata?.sender_email && (
                                  <p className="text-xs text-muted-foreground">
                                    From: {notification.metadata.sender_email}
                                  </p>
                                )}
                                {notification.metadata?.message_preview && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    “{notification.metadata.message_preview}”
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;