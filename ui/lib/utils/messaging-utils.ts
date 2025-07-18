import { 
  Message, 
  Conversation, 
  Call, 
  UserPresence, 
  MessageType, 
  MessageStatus, 
  CallStatus, 
  UserStatus 
} from '../schemas/messaging';
import { User } from '../schemas/user';

// Type guards
export const isValidMessageType = (type: string): type is MessageType => {
  return ['text', 'call_start', 'call_end', 'system'].includes(type);
};

export const isValidMessageStatus = (status: string): status is MessageStatus => {
  return ['sending', 'sent', 'delivered', 'read', 'failed'].includes(status);
};

export const isValidCallStatus = (status: string): status is CallStatus => {
  return ['pending', 'ringing', 'accepted', 'declined', 'ended', 'failed'].includes(status);
};

export const isValidUserStatus = (status: string): status is UserStatus => {
  return ['online', 'offline', 'in_call', 'away'].includes(status);
};

// Validation functions
export const validateMessage = (message: any): message is Message => {
  return (
    typeof message === 'object' &&
    typeof message.id === 'string' &&
    typeof message.conversation_id === 'string' &&
    typeof message.sender === 'object' &&
    typeof message.content === 'string' &&
    isValidMessageType(message.message_type) &&
    isValidMessageStatus(message.status) &&
    typeof message.created_at === 'string'
  );
};

export const validateConversation = (conversation: any): conversation is Conversation => {
  return (
    typeof conversation === 'object' &&
    typeof conversation.id === 'string' &&
    typeof conversation.participant1 === 'object' &&
    typeof conversation.participant2 === 'object' &&
    typeof conversation.last_message_at === 'string' &&
    typeof conversation.unread_count === 'number' &&
    typeof conversation.is_archived === 'boolean' &&
    typeof conversation.created_at === 'string'
  );
};

export const validateCall = (call: any): call is Call => {
  return (
    typeof call === 'object' &&
    typeof call.id === 'string' &&
    typeof call.caller === 'object' &&
    typeof call.callee === 'object' &&
    ['voice', 'video'].includes(call.type) &&
    isValidCallStatus(call.status) &&
    typeof call.created_at === 'string'
  );
};

// Utility functions
export const getOtherParticipant = (conversation: Conversation, currentUserId: string): User => {
  return conversation.participant1.id === currentUserId 
    ? conversation.participant2 
    : conversation.participant1;
};

export const isMessageFromCurrentUser = (message: Message, currentUserId: string): boolean => {
  return message.sender.id === currentUserId;
};

export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export const formatLastSeen = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)} minutes ago`;
  } else if (diffInMinutes < 60 * 24) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / (60 * 24));
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

export const formatCallDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  } else if (minutes < 60) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

export const getStatusColor = (status: UserStatus): string => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'away':
      return 'bg-yellow-500';
    case 'in_call':
      return 'bg-blue-500';
    case 'offline':
    default:
      return 'bg-gray-400';
  }
};

export const getStatusText = (status: UserStatus): string => {
  switch (status) {
    case 'online':
      return 'Online';
    case 'away':
      return 'Away';
    case 'in_call':
      return 'In a call';
    case 'offline':
    default:
      return 'Offline';
  }
};

export const getMessageStatusIcon = (status: MessageStatus): string => {
  switch (status) {
    case 'sending':
      return '⏳';
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'read':
      return '✓✓'; // Could be blue or different color
    case 'failed':
      return '❌';
    default:
      return '';
  }
};

export const sortConversationsByLastMessage = (conversations: Conversation[]): Conversation[] => {
  return [...conversations].sort((a, b) => {
    const dateA = new Date(a.last_message_at).getTime();
    const dateB = new Date(b.last_message_at).getTime();
    return dateB - dateA; // Most recent first
  });
};

export const sortMessagesByTimestamp = (messages: Message[]): Message[] => {
  return [...messages].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateA - dateB; // Oldest first
  });
};

export const filterActiveConversations = (conversations: Conversation[]): Conversation[] => {
  return conversations.filter(conv => !conv.is_archived);
};

export const filterArchivedConversations = (conversations: Conversation[]): Conversation[] => {
  return conversations.filter(conv => conv.is_archived);
};

export const getTotalUnreadCount = (conversations: Conversation[]): number => {
  return conversations.reduce((total, conv) => total + conv.unread_count, 0);
};

export const searchConversations = (conversations: Conversation[], query: string, currentUserId: string): Conversation[] => {
  if (!query.trim()) return conversations;
  
  const lowerQuery = query.toLowerCase();
  return conversations.filter(conv => {
    const otherUser = getOtherParticipant(conv, currentUserId);
    return (
      otherUser.name.toLowerCase().includes(lowerQuery) ||
      otherUser.username.toLowerCase().includes(lowerQuery) ||
      conv.last_message?.content.toLowerCase().includes(lowerQuery)
    );
  });
};

export const searchMessages = (messages: Message[], query: string): Message[] => {
  if (!query.trim()) return messages;
  
  const lowerQuery = query.toLowerCase();
  return messages.filter(message => 
    message.content.toLowerCase().includes(lowerQuery)
  );
};

// WebSocket message helpers
export const createWSMessage = (type: string, payload: any) => ({
  type,
  payload,
  timestamp: new Date().toISOString(),
});

// Error handling helpers
export const isNetworkError = (error: any): boolean => {
  return error?.code === 'NETWORK_ERROR' || error?.name === 'NetworkError';
};

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.code) return `Error: ${error.code}`;
  return 'An unexpected error occurred';
};

// Local storage helpers
export const STORAGE_KEYS = {
  CONVERSATIONS: 'messaging_conversations',
  MESSAGES: 'messaging_messages',
  USER_PRESENCE: 'messaging_user_presence',
  NOTIFICATION_PREFS: 'messaging_notification_prefs',
  DRAFT_MESSAGES: 'messaging_draft_messages',
} as const;

export const saveDraftMessage = (conversationId: string, content: string): void => {
  try {
    const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFT_MESSAGES) || '{}');
    if (content.trim()) {
      drafts[conversationId] = content;
    } else {
      delete drafts[conversationId];
    }
    localStorage.setItem(STORAGE_KEYS.DRAFT_MESSAGES, JSON.stringify(drafts));
  } catch (error) {
    console.warn('Failed to save draft message:', error);
  }
};

export const getDraftMessage = (conversationId: string): string => {
  try {
    const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFT_MESSAGES) || '{}');
    return drafts[conversationId] || '';
  } catch (error) {
    console.warn('Failed to get draft message:', error);
    return '';
  }
};

export const clearDraftMessage = (conversationId: string): void => {
  saveDraftMessage(conversationId, '');
};

// Friend system utility functions
export const areFriends = (user1Id: string, user2Id: string, friendships: import('../schemas/messaging').Friendship[]): boolean => {
  return friendships.some(friendship => 
    (friendship.user1.id === user1Id && friendship.user2.id === user2Id) ||
    (friendship.user1.id === user2Id && friendship.user2.id === user1Id)
  );
};

export const getFriendshipStatus = (
  currentUserId: string, 
  otherUserId: string, 
  friendships: import('../schemas/messaging').Friendship[],
  friendRequests: import('../schemas/messaging').FriendRequest[]
): 'friends' | 'pending_sent' | 'pending_received' | 'not_friends' => {
  // Check if already friends
  if (areFriends(currentUserId, otherUserId, friendships)) {
    return 'friends';
  }

  // Check for pending friend requests
  const sentRequest = friendRequests.find(req => 
    req.requester.id === currentUserId && 
    req.recipient.id === otherUserId && 
    req.status === 'pending'
  );
  
  if (sentRequest) {
    return 'pending_sent';
  }

  const receivedRequest = friendRequests.find(req => 
    req.requester.id === otherUserId && 
    req.recipient.id === currentUserId && 
    req.status === 'pending'
  );
  
  if (receivedRequest) {
    return 'pending_received';
  }

  return 'not_friends';
};

export const getFriendsList = (currentUserId: string, friendships: import('../schemas/messaging').Friendship[]): import('../schemas/user').User[] => {
  return friendships
    .filter(friendship => 
      friendship.user1.id === currentUserId || friendship.user2.id === currentUserId
    )
    .map(friendship => 
      friendship.user1.id === currentUserId ? friendship.user2 : friendship.user1
    );
};

export const getPendingFriendRequests = (
  currentUserId: string, 
  friendRequests: import('../schemas/messaging').FriendRequest[]
): import('../schemas/messaging').FriendRequest[] => {
  return friendRequests.filter(req => 
    req.recipient.id === currentUserId && req.status === 'pending'
  );
};

export const getSentFriendRequests = (
  currentUserId: string, 
  friendRequests: import('../schemas/messaging').FriendRequest[]
): import('../schemas/messaging').FriendRequest[] => {
  return friendRequests.filter(req => 
    req.requester.id === currentUserId && req.status === 'pending'
  );
};

export const canSendMessage = (
  currentUserId: string, 
  recipientId: string, 
  friendships: import('../schemas/messaging').Friendship[],
  blockedUsers: import('../schemas/messaging').BlockedUser[]
): { canSend: boolean; reason?: string } => {
  // Check if user is blocked
  const isBlocked = blockedUsers.some(blocked => 
    blocked.blocked_user.id === recipientId
  );
  
  if (isBlocked) {
    return { canSend: false, reason: 'User is blocked' };
  }

  // Check if users are friends
  if (!areFriends(currentUserId, recipientId, friendships)) {
    return { canSend: false, reason: 'You must be friends to send messages' };
  }

  return { canSend: true };
};

export const canInitiateCall = (
  currentUserId: string, 
  recipientId: string, 
  friendships: import('../schemas/messaging').Friendship[],
  blockedUsers: import('../schemas/messaging').BlockedUser[]
): { canCall: boolean; reason?: string } => {
  // Check if user is blocked
  const isBlocked = blockedUsers.some(blocked => 
    blocked.blocked_user.id === recipientId
  );
  
  if (isBlocked) {
    return { canCall: false, reason: 'User is blocked' };
  }

  // Check if users are friends
  if (!areFriends(currentUserId, recipientId, friendships)) {
    return { canCall: false, reason: 'You must be friends to make calls' };
  }

  return { canCall: true };
};

export const getFriendshipButtonText = (
  status: 'friends' | 'pending_sent' | 'pending_received' | 'not_friends'
): string => {
  switch (status) {
    case 'friends':
      return 'Remove Friend';
    case 'pending_sent':
      return 'Request Sent';
    case 'pending_received':
      return 'Accept Request';
    case 'not_friends':
      return 'Add Friend';
    default:
      return 'Add Friend';
  }
};

export const getFriendshipButtonAction = (
  status: 'friends' | 'pending_sent' | 'pending_received' | 'not_friends'
): 'remove' | 'cancel' | 'accept' | 'send' | 'none' => {
  switch (status) {
    case 'friends':
      return 'remove';
    case 'pending_sent':
      return 'cancel';
    case 'pending_received':
      return 'accept';
    case 'not_friends':
      return 'send';
    default:
      return 'none';
  }
};