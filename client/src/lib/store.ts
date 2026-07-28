import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  username: string;
  avatar: string | null;
  role: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  profile: {
    fullName: string;
    phoneNumber?: string;
    bio?: string;
    gender?: string;
  } | null;
  settings?: {
    theme: string;
    language: string;
    notifications: boolean;
    soundEnabled: boolean;
    wallpaper?: string;
    fontSize: number;
  };
}

interface Chat {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  name: string;
  avatar: string | null;
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: { username: string };
  };
  unreadCount: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isTyping?: boolean;
  memberCount?: number;
}

interface Message {
  id: number;
  senderId: number;
  chatType: 'PRIVATE' | 'GROUP';
  chatId: string;
  content: string | null;
  type: string;
  replyToId?: number;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    username: string;
    avatar: string | null;
    profile?: { fullName: string };
  };
  attachments?: Array<{
    id: number;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
  reactions?: Array<{
    id: number;
    emoji: string;
    user: { id: number; username: string };
  }>;
  reads?: Array<{
    userId: number;
    readAt: string;
  }>;
  replies?: Message[];
  replyTo?: Message;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;

  activeChat: Chat | null;
  setActiveChat: (chat: Chat | null) => void;

  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  updateChat: (chatId: string, data: Partial<Chat>) => void;

  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, data: Partial<Message>) => void;

  typingUsers: Record<string, number[]>;
  setTypingUser: (chatId: string, userId: number, isTyping: boolean) => void;

  onlineUsers: Set<number>;
  addOnlineUser: (userId: number) => void;
  removeOnlineUser: (userId: number) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  profilePanelOpen: boolean;
  setProfilePanelOpen: (open: boolean) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  activeChat: null,
  setActiveChat: (activeChat) => set({ activeChat }),

  chats: [],
  setChats: (chats) => set({ chats }),
  updateChat: (chatId, data) =>
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? { ...c, ...data } : c)),
    })),

  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (messageId, data) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, ...data } : m)),
    })),

  typingUsers: {},
  setTypingUser: (chatId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[chatId] || [];
      const updated = isTyping
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
      return { typingUsers: { ...state.typingUsers, [chatId]: updated } };
    }),

  onlineUsers: new Set(),
  addOnlineUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.add(userId);
      return { onlineUsers: newSet };
    }),
  removeOnlineUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.delete(userId);
      return { onlineUsers: newSet };
    }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  profilePanelOpen: false,
  setProfilePanelOpen: (profilePanelOpen) => set({ profilePanelOpen }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
