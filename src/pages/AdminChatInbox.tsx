import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Send, User, Clock, Paperclip, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import BackButton from '@/components/ui/back-button';
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
  image_url?: string | null;
  seen: boolean;
  sent_at: string;
}

const AdminChatInbox = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Only auto-scroll when new messages arrive, not on room change
  const prevMessagesLength = useRef(0);
  const prevSelectedRoomId = useRef<string | null>(null);
  
  useEffect(() => {
    // Scroll to bottom when switching rooms
    if (selectedRoom && selectedRoom.id !== prevSelectedRoomId.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        inputRef.current?.focus();
      }, 100);
      prevSelectedRoomId.current = selectedRoom.id;
    }
    // Scroll to bottom only when new messages are added
    else if (messages.length > prevMessagesLength.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      if (selectedRoom) inputRef.current?.focus();
    }
    prevMessagesLength.current = messages.length;
  }, [messages, selectedRoom]);

  useEffect(() => {
    if (!user) return;
    
    fetchChatRooms();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('admin-chat-inbox')
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
            fetchMessages(selectedRoom.id, selectedRoom.user_id);
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

  const fetchChatRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      
      // Optimized query with join instead of separate requests
      const { data: roomsWithProfiles, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          user_id,
          admin_id,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Group rooms by user_id and keep only the most recent one per user
      const roomsByUser = new Map<string, any>();
      
      (roomsWithProfiles || []).forEach(room => {
        const existingRoom = roomsByUser.get(room.user_id);
        if (!existingRoom || new Date(room.updated_at) > new Date(existingRoom.updated_at)) {
          roomsByUser.set(room.user_id, room);
        }
      });

      // Use batch queries for better performance
      const uniqueRooms = Array.from(roomsByUser.values());
      const allRoomIds = roomsWithProfiles?.map(r => r.id) || [];
      
      // Get last messages and unread counts in batches
      const [lastMessagesResult, unreadCountsResult] = await Promise.all([
        // Get last message for each user (across all their rooms)
        Promise.all(
          uniqueRooms.map(async (room) => {
            const userRoomIds = roomsWithProfiles?.filter(r => r.user_id === room.user_id).map(r => r.id) || [];
            const { data } = await supabase
              .from('chat_messages')
              .select('message, sent_at, sender_id')
              .in('room_id', userRoomIds)
              .order('sent_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            return { userId: room.user_id, lastMessage: data };
          })
        ),
        // Get unread counts for each user
        Promise.all(
          uniqueRooms.map(async (room) => {
            const userRoomIds = roomsWithProfiles?.filter(r => r.user_id === room.user_id).map(r => r.id) || [];
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .in('room_id', userRoomIds)
              .eq('sender_id', room.user_id)
              .eq('seen', false);
            return { userId: room.user_id, count: count || 0 };
          })
        )
      ]);

      // Combine data efficiently
      const roomsWithData = uniqueRooms.map((room) => {
        const lastMessageData = lastMessagesResult.find(lm => lm.userId === room.user_id);
        const unreadData = unreadCountsResult.find(uc => uc.userId === room.user_id);
        
        return {
          ...room,
          last_message: lastMessageData?.lastMessage,
          unread_count: unreadData?.count || 0
        };
      });

      setChatRooms(roomsWithData.sort((a, b) => {
        // Sort by unread count first, then by last message time
        if (a.unread_count !== b.unread_count) {
          return b.unread_count - a.unread_count;
        }
        const aTime = a.last_message?.sent_at || a.updated_at;
        const bTime = b.last_message?.sent_at || b.updated_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      }));
      
      // Auto-select room if user or room parameter is present
      const targetUserId = searchParams.get('user');
      const targetRoomId = searchParams.get('room');
      if ((targetUserId || targetRoomId) && roomsWithData.length > 0) {
        let targetRoom: ChatRoom | undefined;

        if (targetRoomId) {
          const rawRoom = roomsWithProfiles?.find(r => r.id === targetRoomId);
          if (rawRoom) {
            targetRoom = roomsWithData.find(r => r.user_id === rawRoom.user_id);
          }
        }

        if (!targetRoom && targetUserId) {
          targetRoom = roomsWithData.find(room => room.user_id === targetUserId) as ChatRoom | undefined;
        }

        if (targetRoom && !selectedRoom) {
          selectRoom(targetRoom);
        }
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  }, [searchParams, selectedRoom]);

  const fetchMessages = async (roomId: string, userIdOverride?: string) => {
    try {
      // Determine the user whose conversations we should aggregate
      let targetUserId = userIdOverride;

      if (!targetUserId) {
        const selectedRoomData = chatRooms.find(r => r.id === roomId);
        if (selectedRoomData) {
          targetUserId = selectedRoomData.user_id;
        } else {
          // Fallback: fetch the room directly in case chatRooms hasn't updated yet
          const { data: roomFromDb } = await supabase
            .from('chat_rooms')
            .select('user_id')
            .eq('id', roomId)
            .maybeSingle();
          targetUserId = roomFromDb?.user_id;
        }
      }

      if (!targetUserId) return;

      // Get ALL messages from ALL rooms for this user (to handle multiple rooms per user)
      const { data: allRooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('user_id', targetUserId);

      const roomIds = allRooms?.map(r => r.id) || [roomId];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .in('room_id', roomIds)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Mark user messages as seen by admin across all their rooms
      await markMessagesAsSeen(roomId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsSeen = async (roomId: string) => {
    try {
      const room = chatRooms.find(r => r.id === roomId);
      if (!room) return;

      // Get ALL rooms for this user and mark ALL their messages as seen
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

      // Update local state - set unread count to 0 for this user's conversation
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
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id ? data : msg
        )
      );

      // Update room's admin_id if not set
      if (!selectedRoom.admin_id) {
        await supabase
          .from('chat_rooms')
          .update({ admin_id: user.id })
          .eq('id', selectedRoom.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev =>
        prev.filter(msg => msg.id !== optimisticMessage.id)
      );
      setNewMessage(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom || !user) return;
    setLoading(true);
    try {
      const path = `${selectedRoom.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('chat')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from('chat').getPublicUrl(path);
      const imageUrl = pub.publicUrl;

      const optimisticMessage: ChatMessage = {
        id: 'temp-' + Date.now(),
        room_id: selectedRoom.id,
        sender_id: user.id,
        message: file.name,
        image_url: imageUrl,
        seen: false,
        sent_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticMessage]);

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ room_id: selectedRoom.id, sender_id: user.id, message: file.name, image_url: imageUrl })
        .select()
        .single();
      if (error) throw error;
      setMessages(prev => prev.map(m => (m.id === optimisticMessage.id ? (data as any) : m)));
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
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
    setShowChat(true); // Show chat on mobile
    fetchMessages(room.id, room.user_id);
  };

  const goBackToRooms = () => {
    setShowChat(false);
    setSelectedRoom(null);
    // Clear URL parameters when going back
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('user');
    newSearchParams.delete('room');
    setSearchParams(newSearchParams);
  };

  const getUserDisplayName = useCallback((room: ChatRoom) => {
    const profile = room.profiles;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile?.email || 'Anonymous User';
  }, []);

  // Memoized filtered chat rooms for search performance
  const filteredChatRooms = useMemo(() => {
    if (!searchTerm) return chatRooms;
    
    const searchLower = searchTerm.toLowerCase();
    return chatRooms.filter(room => {
      const displayName = getUserDisplayName(room).toLowerCase();
      const email = room.profiles?.email?.toLowerCase() || '';
      const lastMessage = room.last_message?.message?.toLowerCase() || '';
      
      return displayName.includes(searchLower) || 
             email.includes(searchLower) || 
             lastMessage.includes(searchLower);
    });
  }, [chatRooms, searchTerm, getUserDisplayName]);

  const totalUnreadCount = useMemo(() => 
    chatRooms.reduce((sum, room) => sum + room.unread_count, 0), 
    [chatRooms]
  );

  const openFirstUnread = () => {
    const unreadRoom = chatRooms.find(r => r.unread_count > 0);
    if (unreadRoom) {
      selectRoom(unreadRoom);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('user', unreadRoom.user_id);
      newParams.set('room', unreadRoom.id);
      setSearchParams(newParams);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        inputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-white pb-48">{/* Added bottom padding for mini player + nav */}
      <div className="pt-16 pb-8 h-screen flex flex-col">{/* Adjusted padding for proper spacing */}
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-4">
          <div className="flex items-center space-x-3 mb-2">
            <BackButton to="/admin" showOnDesktop={true} />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Chat Inbox</h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">Manage customer support conversations</p>
          {totalUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="mt-2 bg-[#FFD700] text-black cursor-pointer hover:opacity-90"
              onClick={openFirstUnread}
              title="Click to open the first unread conversation"
              role="button"
            >
              {totalUnreadCount} unread messages
            </Badge>
          )}
        </div>

        {/* Main Chat Interface - Professional Layout */}
        <div className={`${showChat ? 'block lg:grid' : 'grid'} grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-0 px-4`}>
          {/* Left Sidebar - Chat Rooms List */}
          <div className={`${showChat ? 'hidden lg:block' : 'block'} lg:col-span-1 bg-[#1a1a1a] rounded-lg overflow-hidden flex flex-col min-h-0`}>
            <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Conversations</h2>
                {totalUnreadCount > 0 && (
                  <Badge variant="destructive" className="bg-[#FFD700] text-black text-xs">
                    {totalUnreadCount}
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#2a2a2a] border-gray-700 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              {loadingRooms ? (
                <div className="p-4 text-center text-gray-400">
                  <div className="animate-pulse space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredChatRooms.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredChatRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => selectRoom(room)}
                      className={`p-3 sm:p-4 cursor-pointer hover:bg-[#2a2a2a] border-b border-gray-800 transition-colors ${
                        selectedRoom?.id === room.id ? 'bg-[#2a2a2a]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="bg-[#FFD700] text-black rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center text-sm font-semibold">
                            <User className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate text-sm sm:text-base">
                              {getUserDisplayName(room)}
                            </p>
                            {room.last_message && (
                              <p className="text-xs sm:text-sm text-gray-400 truncate">
                                {room.last_message.message}
                              </p>
                            )}
                            <div className="flex items-center space-x-1 mt-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-500">
                                {room.last_message 
                                  ? formatDistanceToNow(new Date(room.last_message.sent_at), { addSuffix: true })
                                  : formatDistanceToNow(new Date(room.created_at), { addSuffix: true })
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        {room.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs bg-[#FFD700] text-black shrink-0">
                            {room.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Side - Chat Messages */}
          <div className={`${showChat ? 'block' : 'hidden lg:block'} lg:col-span-2 bg-[#1a1a1a] rounded-lg overflow-hidden flex flex-col min-h-0`}>
            {selectedRoom ? (
              <div className="flex flex-col h-full min-h-0">
                {/* Chat Header - Fixed */}
                <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-800 bg-[#2a2a2a]">
                  <div className="flex items-center space-x-3">
                    <BackButton onClick={goBackToRooms} />
                    <div className="bg-[#FFD700] text-black rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate text-sm sm:text-base">{getUserDisplayName(selectedRoom)}</h3>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">{selectedRoom.profiles?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Messages Area - Scrollable */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-32">{/* Added bottom padding to messages */}
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        <>
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg text-sm ${
                                  message.sender_id === user?.id
                                    ? 'bg-[#FFD700] text-black'
                                    : 'bg-[#2a2a2a] text-white'
                                }`}
                              >
                                {message.image_url ? (
                                  <a href={message.image_url} target="_blank" rel="noreferrer">
                                    <img
                                      src={message.image_url}
                                      alt="Sent image"
                                      className="rounded-md max-h-64 w-auto max-w-full object-contain mb-2"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : null}
                                {message.message && (
                                  <p className="break-words">{message.message}</p>
                                )}
                                <p className={`text-xs mt-1 ${
                                  message.sender_id === user?.id ? 'text-black/70' : 'text-gray-400'
                                }`}>
                                  {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={bottomRef} />
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Message Input - Fixed at bottom */}
                <div className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-800 bg-[#1a1a1a] mb-36 md:mb-28 lg:mb-24 relative z-50">{/* Extra margin to clear mini player & bottom nav */}
                  <div className="flex items-center gap-2">
                    <input
                      id="admin-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0 h-10 w-10 sm:h-auto sm:w-auto sm:px-3"
                      onClick={() => (document.getElementById('admin-image-upload') as HTMLInputElement)?.click()}
                      disabled={loading}
                      aria-label="Attach image"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your reply..."
                      className="flex-1 bg-[#2a2a2a] border-gray-600 text-white placeholder-gray-400 focus:border-[#FFD700] focus:ring-[#FFD700] text-sm"
                      disabled={loading}
                    />
                    <Button 
                      onClick={sendMessage} 
                      className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 shrink-0 h-10 w-10 sm:h-auto sm:w-auto sm:px-4"
                      disabled={!newMessage.trim() || loading}
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400 px-4">
                  <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Select a conversation</h3>
                  <p className="text-sm">Choose a chat from the sidebar to start responding</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatInbox;
