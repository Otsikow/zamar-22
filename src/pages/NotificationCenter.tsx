import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Bell, MessageCircle, Music, Heart, Check, CheckCheck, ExternalLink } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
  metadata?: {
    sender_user_id?: string;
    room_id?: string;
  };
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
      
      // Navigate to admin chat inbox with user parameter
      navigate(`/admin/chat-inbox?user=${senderUserId}`);
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

  const getUserDisplayName = (userId: string) => {
    const profile = userProfiles[userId];
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile?.email || 'Anonymous User';
  };

  const getNotificationDisplayMessage = (notification: Notification) => {
    if (notification.type === 'message') {
      // For message notifications, try to extract user name from metadata or user_id
      const senderId = notification.metadata?.sender_user_id || notification.user_id;
      const userName = getUserDisplayName(senderId);
      return `New chat message from ${userName}`;
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

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
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
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-all hover:shadow-md cursor-pointer ${
                  !notification.is_read 
                    ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' 
                    : ''
                } ${
                  notification.type === 'message' ? 'hover:border-green-500/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Status Dot & Icon */}
                    <div className="flex flex-col items-center gap-2">
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
                        
                        <div className="flex items-center gap-2">
                          {(notification.type === 'message' || notification.type === 'song_request') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                              className="shrink-0"
                            >
                              {notification.type === 'message' ? 'Open Chat' : 'Review'}
                            </Button>
                          )}
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="shrink-0"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-foreground leading-relaxed">
                        {getNotificationDisplayMessage(notification)}
                      </p>
                      
                      {notification.type === 'message' && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Click to open chat conversation
                        </p>
                      )}
                    </div>
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