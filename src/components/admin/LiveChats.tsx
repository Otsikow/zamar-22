import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoom {
  id: string;
  user_id: string;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  last_message?: {
    message: string;
    sent_at: string;
    sender_id: string;
  };
  unread_count: number;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  seen: boolean;
  sent_at: string;
}

export const LiveChats = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, selectedRoom]);

  useEffect(() => {
    if (!user) return;
    
    fetchChatRooms();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('admin-chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchChatRooms();
          if (selectedRoom) {
            fetchMessages(selectedRoom.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_rooms'
        },
        () => {
          fetchChatRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedRoom]);

  const fetchChatRooms = async () => {
    try {
      // Get all chat rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('updated_at', { ascending: false });

      if (roomsError) throw roomsError;

      // Get user profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email');

      if (profilesError) throw profilesError;

      // Consolidate into one conversation per user
      const roomsByUser = new Map<string, any>();
      (rooms || []).forEach((room) => {
        const existing = roomsByUser.get(room.user_id);
        if (!existing || new Date(room.updated_at) > new Date(existing.updated_at)) {
          roomsByUser.set(room.user_id, room);
        }
      });

      const roomsWithData = await Promise.all(
        Array.from(roomsByUser.values()).map(async (room) => {
          const allUserRooms = (rooms || []).filter(r => r.user_id === room.user_id);
          const roomIds = allUserRooms.map(r => r.id);

          // Last message across all rooms for the user
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('message, sent_at, sender_id')
            .in('room_id', roomIds)
            .order('sent_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Unread count across all rooms (messages from user not seen)
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .in('room_id', roomIds)
            .eq('sender_id', room.user_id)
            .eq('seen', false);

          const userProfile = profiles?.find(p => p.id === room.user_id) || null;

          return {
            ...room,
            profiles: userProfile,
            last_message: lastMsg,
            unread_count: unreadCount || 0,
          } as ChatRoom;
        })
      );

      setChatRooms(roomsWithData);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const baseRoom = chatRooms.find(r => r.id === roomId);
      if (!baseRoom) return;

      // Load messages across ALL rooms for this user
      const { data: userRooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('user_id', baseRoom.user_id);

      const roomIds = (userRooms || []).map(r => r.id).length > 0 ? (userRooms || []).map(r => r.id) : [roomId];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .in('room_id', roomIds)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      await markMessagesAsSeen(roomId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsSeen = async (roomId: string) => {
    try {
      const room = chatRooms.find(r => r.id === roomId);
      if (!room) return;

      // Mark messages as seen across ALL rooms for this user
      const { data: allUserRooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('user_id', room.user_id);

      const userRoomIds = allUserRooms?.map(r => r.id) || [roomId];

      await supabase
        .from('chat_messages')
        .update({ seen: true })
        .in('room_id', userRoomIds)
        .eq('sender_id', room.user_id);

      // Update local state
      setChatRooms(prev =>
        prev.map(r =>
          r.user_id === room.user_id ? { ...r, unread_count: 0 } : r
        )
      );
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;

    const messageText = newMessage.trim();
    setLoading(true);

    // Optimistically add message to UI
    const optimisticMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      room_id: selectedRoom.id,
      sender_id: user.id,
      message: messageText,
      seen: false,
      sent_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: selectedRoom.id,
          sender_id: user.id,
          message: messageText
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => (m.id === optimisticMessage.id ? (data as any) : m)));

      // Update room's admin_id if not set
      if (!selectedRoom.admin_id) {
        await supabase
          .from('chat_rooms')
          .update({ admin_id: user.id })
          .eq('id', selectedRoom.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message and restore input
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setNewMessage(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    fetchMessages(room.id);
  };

  const getUserDisplayName = (room: ChatRoom) => {
    const profile = room.profiles;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile?.email || 'Anonymous User';
  };

  const totalUnreadCount = chatRooms.reduce((sum, room) => sum + room.unread_count, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
      {/* Chat Rooms List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Live Chats</span>
            {totalUnreadCount > 0 && (
              <Badge variant="destructive">
                {totalUnreadCount} new
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {chatRooms.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No chat conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chatRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => selectRoom(room)}
                    className={`p-3 cursor-pointer hover:bg-muted/50 border-b ${
                      selectedRoom?.id === room.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 flex-1 min-w-0">
                        <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {getUserDisplayName(room)}
                          </p>
                          {room.last_message && (
                            <p className="text-xs text-muted-foreground truncate">
                              {room.last_message.message}
                            </p>
                          )}
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(room.updated_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {room.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {room.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="lg:col-span-2">
        {selectedRoom ? (
          <>
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{getUserDisplayName(selectedRoom)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[500px] p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p>{message.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your reply..."
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button 
                    onClick={sendMessage} 
                    size="icon"
                    disabled={!newMessage.trim() || loading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-[500px]">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a chat to start responding</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};