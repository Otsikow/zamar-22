import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
      // First get all chat rooms
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

      // Get last message and unread count for each room
      const roomsWithData = await Promise.all(
        (rooms || []).map(async (room) => {
          // Get last message
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('message, sent_at, sender_id')
            .eq('room_id', room.id)
            .order('sent_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count (messages from user that admin hasn't seen)
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('sender_id', room.user_id)
            .eq('seen', false);

          // Find matching profile
          const userProfile = profiles?.find(p => p.id === room.user_id) || null;

          return {
            ...room,
            profiles: userProfile,
            last_message: lastMsg,
            unread_count: unreadCount || 0
          };
        })
      );

      setChatRooms(roomsWithData);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Mark user messages as seen by admin
      await markMessagesAsSeen(roomId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsSeen = async (roomId: string) => {
    try {
      const room = chatRooms.find(r => r.id === roomId);
      if (!room) return;

      await supabase
        .from('chat_messages')
        .update({ seen: true })
        .eq('room_id', roomId)
        .eq('sender_id', room.user_id);

      // Update local state
      setChatRooms(prev =>
        prev.map(r =>
          r.id === roomId ? { ...r, unread_count: 0 } : r
        )
      );
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: selectedRoom.id,
          sender_id: user.id,
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      
      // Update room's admin_id if not set
      if (!selectedRoom.admin_id) {
        await supabase
          .from('chat_rooms')
          .update({ admin_id: user.id })
          .eq('id', selectedRoom.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

  const openFullChatInbox = () => {
    navigate('/admin/chat-inbox');
  };

  return (
    <div className="space-y-6">
      {/* Full Chat Inbox Button */}
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <MessageCircle className="h-12 w-12 mx-auto text-[#FFD700] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Full Chat Inbox Available</h3>
            <p className="text-gray-400 mb-4">
              For a complete chat management experience, use our dedicated full-screen chat inbox.
            </p>
          </div>
          <Button 
            onClick={openFullChatInbox}
            className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold px-6 py-3 rounded-lg"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Full Chat Inbox
          </Button>
        </CardContent>
      </Card>

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
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
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
