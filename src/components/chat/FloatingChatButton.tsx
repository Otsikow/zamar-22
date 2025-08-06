import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoom {
  id: string;
  user_id: string;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  seen: boolean;
  sent_at: string;
}

export const FloatingChatButton = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    initializeChat();
  }, [user]);

  useEffect(() => {
    if (!chatRoom) return;

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`chat-${chatRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${chatRoom.id}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
          
          // If message is from admin and chat is closed, increment unread count
          if (newMessage.sender_id !== user?.id && !isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoom, user, isOpen]);

  const initializeChat = async () => {
    if (!user) return;

    try {
      // Check if user already has a chat room
      let { data: existingRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roomError && roomError.code !== 'PGRST116') {
        throw roomError;
      }

      if (!existingRoom) {
        // Create new chat room
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        existingRoom = newRoom;
      }

      setChatRoom(existingRoom);
      await fetchMessages(existingRoom.id);
    } catch (error) {
      console.error('Error initializing chat:', error);
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
      
      // Count unread messages from admin
      const unreadFromAdmin = data?.filter(msg => 
        msg.sender_id !== user?.id && !msg.seen
      ).length || 0;
      
      setUnreadCount(unreadFromAdmin);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoom || !user) return;

    const messageText = newMessage.trim();
    setLoading(true);
    
    // Optimistically add message to UI immediately
    const optimisticMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      room_id: chatRoom.id,
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
          room_id: chatRoom.id,
          sender_id: user.id,
          message: messageText
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? data : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => 
        prev.filter(msg => msg.id !== optimisticMessage.id)
      );
      setNewMessage(messageText); // Restore message text
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    
    // Mark messages as seen
    if (chatRoom) {
      markMessagesAsSeen();
    }
  };

  const markMessagesAsSeen = async () => {
    if (!chatRoom || !user) return;

    try {
      await supabase
        .from('chat_messages')
        .update({ seen: true })
        .eq('room_id', chatRoom.id)
        .neq('sender_id', user.id);
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 h-96 flex flex-col shadow-xl z-50 bg-background border-border">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <h3 className="font-semibold">Support Chat</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation with our support team!</p>
                </div>
              ) : (
                messages.map((message) => (
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
                      <p className={`text-xs mt-1 opacity-70`}>
                        {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
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
        </Card>
      )}
    </>
  );
};
