import { User } from "../schemas/user";
import {
  Conversation,
  Message,
  Call,
  UserPresence,
  BlockedUser,
  InAppNotification,
  NotificationPreferences,
  FriendRequest,
  Friendship,
} from "../schemas/messaging";

// Mock users
export const mockUsers: User[] = [
  {
    id: "1",
    email: "alice@example.com",
    name: "Alice Johnson",
    username: "alice_j",
    pronouns: "she/her",
    bio: "Software developer passionate about building great user experiences. Ultimate benchmark of if a democracy is working or not is if the nation is willing to sanction israel, majority of every country wants them sanctioned",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    cover_url:
      "https://img.freepik.com/free-vector/hand-drawn-minimal-background_23-2149013105.jpg",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    email: "bob@example.com",
    name: "Bob Smith",
    username: "bob_smith",
    pronouns: "he/him",
    bio: "Product manager who loves solving complex problems and building amazing products that users love",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    cover_url:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=150&fit=crop",
    created_at: "2024-01-16T11:00:00Z",
    updated_at: "2024-01-16T11:00:00Z",
  },
  {
    id: "3",
    email: "charlie@example.com",
    name: "Charlie Brown",
    username: "charlie_b",
    pronouns: "they/them",
    bio: "Designer focused on creating beautiful and functional interfaces that make people's lives better",
    avatar_url:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    created_at: "2024-01-17T12:00:00Z",
    updated_at: "2024-01-17T12:00:00Z",
  },
  {
    id: "4",
    email: "diana@example.com",
    name: "Diana Prince",
    username: "diana_p",
    pronouns: "she/her",
    bio: "Marketing specialist with a passion for storytelling and connecting brands with their audiences",
    avatar_url:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    cover_url:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=150&fit=crop",
    created_at: "2024-01-18T13:00:00Z",
    updated_at: "2024-01-18T13:00:00Z",
  },
  {
    id: "5",
    email: "eve@example.com",
    name: "Eve Wilson",
    username: "eve_w",
    pronouns: "she/her",
    bio: "Data scientist exploring the world of machine learning and artificial intelligence",
    avatar_url:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    created_at: "2024-01-19T14:00:00Z",
    updated_at: "2024-01-19T14:00:00Z",
  },
];

// Current user (for testing purposes)
export const mockCurrentUser: User = mockUsers[0]; // Alice

// Mock user presence
export const mockUserPresence: UserPresence[] = [
  {
    user_id: "1",
    status: "online",
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    user_id: "2",
    status: "online",
    last_seen_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    user_id: "3",
    status: "offline",
    last_seen_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    user_id: "4",
    status: "in_call",
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    user_id: "5",
    status: "away",
    last_seen_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

// Generate additional mock messages for testing pagination and search
const generateAdditionalMessages = (): Message[] => {
  const additionalMessages: Message[] = [];
  const baseDate = new Date("2024-01-19T08:00:00Z");

  // Generate messages for conv_1 (Alice and Bob)
  const conv1Messages = [
    "Good morning! How was your weekend?",
    "It was great! Went hiking with some friends. How about yours?",
    "Nice! I spent most of it working on that new project we discussed.",
    "Oh right, the messaging app! How's it coming along?",
    "Pretty well actually. I've been working on the UI components.",
    "That sounds exciting! Can't wait to see it.",
    "I'll show you a demo when we meet next week.",
    "Perfect! Looking forward to it.",
    "By the way, did you finish reading that book I recommended?",
    "Yes! It was fantastic. Thanks for the suggestion.",
    "I'm glad you liked it. The author has a new book coming out soon.",
    "Really? I'll have to keep an eye out for it.",
    "I can let you know when it's available if you want.",
    "That would be great, thanks!",
    "No problem. Always happy to share good books.",
  ];

  conv1Messages.forEach((content, index) => {
    const messageDate = new Date(baseDate.getTime() + index * 30 * 60 * 1000); // 30 minutes apart
    const isFromBob = index % 2 === 0;

    additionalMessages.push({
      id: `msg_old_${index + 1}`,
      conversation_id: "conv_1",
      sender: isFromBob ? mockUsers[1] : mockUsers[0], // Bob or Alice
      content,
      message_type: "text",
      status: "read",
      delivered_at: new Date(messageDate.getTime() + 1000).toISOString(),
      read_at: new Date(messageDate.getTime() + 2000).toISOString(),
      created_at: messageDate.toISOString(),
      updated_at: new Date(messageDate.getTime() + 2000).toISOString(),
    });
  });

  // Generate messages for conv_2 (Alice and Charlie)
  const conv2Messages = [
    "Hey Alice, I wanted to discuss the design mockups.",
    "Sure! I've been looking at them. They look really good.",
    "Thanks! I tried to keep the interface clean and intuitive.",
    "You definitely succeeded. The color scheme works well too.",
    "I was thinking we could add some micro-interactions.",
    "That's a great idea. What did you have in mind?",
    "Maybe some subtle animations when messages are sent?",
    "Yes, that would add a nice touch of polish.",
    "I'll work on some prototypes and show you later.",
    "Sounds perfect. Let me know if you need any feedback.",
  ];

  conv2Messages.forEach((content, index) => {
    const messageDate = new Date(baseDate.getTime() + index * 45 * 60 * 1000); // 45 minutes apart
    const isFromCharlie = index % 2 === 0;

    additionalMessages.push({
      id: `msg_old_conv2_${index + 1}`,
      conversation_id: "conv_2",
      sender: isFromCharlie ? mockUsers[2] : mockUsers[0], // Charlie or Alice
      content,
      message_type: "text",
      status: "read",
      delivered_at: new Date(messageDate.getTime() + 1000).toISOString(),
      read_at: new Date(messageDate.getTime() + 2000).toISOString(),
      created_at: messageDate.toISOString(),
      updated_at: new Date(messageDate.getTime() + 2000).toISOString(),
    });
  });

  return additionalMessages;
};

// Mock messages
export const mockMessages: Message[] = [
  ...generateAdditionalMessages(),
  {
    id: "msg_1",
    conversation_id: "conv_1",
    sender: mockUsers[1], // Bob
    content: "Hey Alice! How are you doing?",
    message_type: "text",
    status: "read",
    delivered_at: "2024-01-20T10:01:00Z",
    read_at: "2024-01-20T10:02:00Z",
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-01-20T10:02:00Z",
  },
  {
    id: "msg_2",
    conversation_id: "conv_1",
    sender: mockUsers[0], // Alice
    content: "Hi Bob! I'm doing great, thanks for asking. How about you?",
    message_type: "text",
    status: "read",
    delivered_at: "2024-01-20T10:03:00Z",
    read_at: "2024-01-20T10:04:00Z",
    created_at: "2024-01-20T10:02:30Z",
    updated_at: "2024-01-20T10:04:00Z",
  },
  {
    id: "msg_3",
    conversation_id: "conv_1",
    sender: mockUsers[1], // Bob
    content: "I'm doing well! Are you free for a quick call later?",
    message_type: "text",
    status: "delivered",
    delivered_at: "2024-01-20T10:05:00Z",
    created_at: "2024-01-20T10:04:30Z",
    updated_at: "2024-01-20T10:05:00Z",
  },
  {
    id: "msg_4",
    conversation_id: "conv_2",
    sender: mockUsers[2], // Charlie
    content: "Alice, did you see the latest project updates?",
    message_type: "text",
    status: "sent",
    created_at: "2024-01-20T09:30:00Z",
    updated_at: "2024-01-20T09:30:00Z",
  },
  {
    id: "msg_5",
    conversation_id: "conv_2",
    sender: mockUsers[0], // Alice
    content: "Yes, I reviewed them this morning. Looks good!",
    message_type: "text",
    status: "read",
    delivered_at: "2024-01-20T09:32:00Z",
    read_at: "2024-01-20T09:33:00Z",
    created_at: "2024-01-20T09:31:00Z",
    updated_at: "2024-01-20T09:33:00Z",
  },
  {
    id: "msg_6",
    conversation_id: "conv_3",
    sender: mockUsers[3], // Diana
    content: "Call started",
    message_type: "call_start",
    status: "delivered",
    delivered_at: "2024-01-20T08:00:00Z",
    created_at: "2024-01-20T08:00:00Z",
    updated_at: "2024-01-20T08:00:00Z",
  },
  {
    id: "msg_7",
    conversation_id: "conv_3",
    sender: mockUsers[3], // Diana
    content: "Call ended (Duration: 15 minutes)",
    message_type: "call_end",
    status: "delivered",
    delivered_at: "2024-01-20T08:15:00Z",
    created_at: "2024-01-20T08:15:00Z",
    updated_at: "2024-01-20T08:15:00Z",
  },
];

// Mock conversations
export const mockConversations: Conversation[] = [
  {
    id: "conv_1",
    participant1: mockUsers[0], // Alice
    participant2: mockUsers[1], // Bob
    last_message: mockMessages[2], // Bob's latest message
    last_message_at: "2024-01-20T10:04:30Z",
    unread_count: 1,
    is_archived: false,
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-01-20T10:04:30Z",
  },
  {
    id: "conv_2",
    participant1: mockUsers[0], // Alice
    participant2: mockUsers[2], // Charlie
    last_message: mockMessages[4], // Alice's response
    last_message_at: "2024-01-20T09:31:00Z",
    unread_count: 0,
    is_archived: false,
    created_at: "2024-01-20T09:30:00Z",
    updated_at: "2024-01-20T09:31:00Z",
  },
  {
    id: "conv_3",
    participant1: mockUsers[0], // Alice
    participant2: mockUsers[3], // Diana
    last_message: mockMessages[6], // Call ended message
    last_message_at: "2024-01-20T08:15:00Z",
    unread_count: 0,
    is_archived: false,
    created_at: "2024-01-20T08:00:00Z",
    updated_at: "2024-01-20T08:15:00Z",
  },
  {
    id: "conv_4",
    participant1: mockUsers[0], // Alice
    participant2: mockUsers[4], // Eve
    last_message: undefined,
    last_message_at: "2024-01-19T16:00:00Z",
    unread_count: 0,
    is_archived: true,
    created_at: "2024-01-19T16:00:00Z",
    updated_at: "2024-01-19T16:00:00Z",
  },
];

// Mock calls
export const mockCalls: Call[] = [
  {
    id: "call_1",
    caller: mockUsers[1], // Bob
    callee: mockUsers[0], // Alice
    type: "voice",
    status: "ended",
    started_at: "2024-01-19T15:00:00Z",
    ended_at: "2024-01-19T15:12:00Z",
    duration: 720, // 12 minutes
    created_at: "2024-01-19T15:00:00Z",
    updated_at: "2024-01-19T15:12:00Z",
  },
  {
    id: "call_2",
    caller: mockUsers[3], // Diana
    callee: mockUsers[0], // Alice
    type: "voice",
    status: "ended",
    started_at: "2024-01-20T08:00:00Z",
    ended_at: "2024-01-20T08:15:00Z",
    duration: 900, // 15 minutes
    created_at: "2024-01-20T08:00:00Z",
    updated_at: "2024-01-20T08:15:00Z",
  },
  {
    id: "call_3",
    caller: mockUsers[0], // Alice
    callee: mockUsers[2], // Charlie
    type: "voice",
    status: "declined",
    created_at: "2024-01-20T09:00:00Z",
    updated_at: "2024-01-20T09:00:30Z",
  },
];

// Mock friendships (Alice's perspective)
export const mockFriendships: Friendship[] = [
  {
    id: "friendship_1",
    user1: mockUsers[0], // Alice
    user2: mockUsers[1], // Bob
    status: "accepted",
    created_at: "2024-01-15T12:00:00Z",
    updated_at: "2024-01-15T12:00:00Z",
  },
  {
    id: "friendship_2",
    user1: mockUsers[0], // Alice
    user2: mockUsers[2], // Charlie
    status: "accepted",
    created_at: "2024-01-16T14:00:00Z",
    updated_at: "2024-01-16T14:00:00Z",
  },
  {
    id: "friendship_3",
    user1: mockUsers[0], // Alice
    user2: mockUsers[3], // Diana
    status: "accepted",
    created_at: "2024-01-17T16:00:00Z",
    updated_at: "2024-01-17T16:00:00Z",
  },
  {
    id: "friendship_4",
    user1: mockUsers[0], // Alice
    user2: mockUsers[4], // Eve
    status: "accepted",
    created_at: "2024-01-18T10:00:00Z",
    updated_at: "2024-01-18T10:00:00Z",
  },
];

// Mock friend requests
export const mockFriendRequests: FriendRequest[] = [
  {
    id: "freq_1",
    requester: {
      id: "7",
      email: "frank@example.com",
      name: "Frank Miller",
      username: "frank_m",
      bio: "Graphic designer and illustrator",
      avatar_url:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      created_at: "2024-01-20T09:00:00Z",
      updated_at: "2024-01-20T09:00:00Z",
    },
    recipient: mockUsers[0], // Alice
    status: "pending",
    created_at: "2024-01-20T15:00:00Z",
    updated_at: "2024-01-20T15:00:00Z",
  },
  {
    id: "freq_2",
    requester: mockUsers[0], // Alice
    recipient: {
      id: "8",
      email: "grace@example.com",
      name: "Grace Lee",
      username: "grace_l",
      bio: "UX researcher passionate about user behavior",
      avatar_url:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
      created_at: "2024-01-19T11:00:00Z",
      updated_at: "2024-01-19T11:00:00Z",
    },
    status: "pending",
    created_at: "2024-01-20T14:00:00Z",
    updated_at: "2024-01-20T14:00:00Z",
  },
];

// Mock blocked users
export const mockBlockedUsers: BlockedUser[] = [
  {
    id: "block_1",
    blocked_user: {
      id: "6",
      email: "spam@example.com",
      name: "Spam User",
      username: "spam_user",
      created_at: "2024-01-10T10:00:00Z",
      updated_at: "2024-01-10T10:00:00Z",
    },
    blocked_at: "2024-01-18T14:00:00Z",
  },
];

// Mock notifications
export const mockNotifications: InAppNotification[] = [
  {
    id: "notif_1",
    type: "message",
    title: "New message from Bob",
    message: "I'm doing well! Are you free for a quick call later?",
    user: mockUsers[1],
    conversation_id: "conv_1",
    created_at: "2024-01-20T10:04:30Z",
    read: false,
  },
  {
    id: "notif_2",
    type: "call",
    title: "Missed call from Diana",
    message: "You missed a voice call",
    user: mockUsers[3],
    call_id: "call_2",
    created_at: "2024-01-20T08:00:00Z",
    read: true,
  },
];

// Mock notification preferences
export const mockNotificationPreferences: NotificationPreferences = {
  message_notifications: true,
  call_notifications: true,
  sound_enabled: true,
  desktop_notifications: false,
};

// Helper functions for generating additional mock data
export const generateMockMessage = (
  conversationId: string,
  sender: User,
  content: string,
  messageType: "text" | "call_start" | "call_end" = "text"
): Message => ({
  id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
  conversation_id: conversationId,
  sender,
  content,
  message_type: messageType,
  status: "sending",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const generateMockCall = (
  caller: User,
  callee: User,
  type: "voice" | "video" = "voice"
): Call => ({
  id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
  caller,
  callee,
  type,
  status: "pending",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Mock API delay simulation
export const mockApiDelay = (ms: number = 500): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock error responses
export const mockErrors = {
  networkError: {
    code: "NETWORK_ERROR",
    message: "Unable to connect to server",
  },
  userNotFound: {
    code: "USER_NOT_FOUND",
    message: "User not found",
  },
  conversationNotFound: {
    code: "CONVERSATION_NOT_FOUND",
    message: "Conversation not found",
  },
  userBlocked: {
    code: "USER_BLOCKED",
    message: "Cannot send message to blocked user",
  },
  callInProgress: {
    code: "CALL_IN_PROGRESS",
    message: "User is already in a call",
  },
  notFriends: {
    code: "NOT_FRIENDS",
    message: "You must be friends to send messages or make calls",
  },
  friendRequestExists: {
    code: "FRIEND_REQUEST_EXISTS",
    message: "Friend request already sent",
  },
  alreadyFriends: {
    code: "ALREADY_FRIENDS",
    message: "You are already friends with this user",
  },
  friendRequestNotFound: {
    code: "FRIEND_REQUEST_NOT_FOUND",
    message: "Friend request not found",
  },
};
