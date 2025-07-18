/* eslint-disable @typescript-eslint/no-explicit-any */
// API Response wrapper types
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

export interface ApiError {
    code: number;
    message: string;
    details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        cursor?: string;
        has_more: boolean;
        total?: number;
        limit: number;
    };
}

// API Request types for messaging endpoints
export interface GetConversationsParams {
    cursor?: string;
    limit?: number;
    archived?: boolean;
}

export interface GetMessagesParams {
    conversation_id: string;
    cursor?: string;
    limit?: number;
    before?: string; // timestamp
    after?: string; // timestamp
}

export interface SearchUsersParams {
    query: string;
    limit?: number;
    exclude_blocked?: boolean;
}

export interface CreateConversationPayload {
    participant_id: string;
    initial_message?: string;
}

export interface SendMessagePayload {
    conversation_id: string;
    content: string;
    message_type?: 'text' | 'system';
    reply_to_id?: string; // for future message replies
}

export interface MarkMessagesReadPayload {
    conversation_id: string;
    message_ids?: string[]; // if not provided, marks all as read
}

export interface UpdateConversationPayload {
    is_archived?: boolean;
}

export interface BlockUserPayload {
    user_id: string;
    reason?: string;
}

export interface InitiateCallPayload {
    callee_id: string;
    type: 'voice' | 'video';
}

export interface RespondToCallPayload {
    call_id: string;
    response: 'accepted' | 'declined';
}

export interface UpdateNotificationPreferencesPayload {
    message_notifications?: boolean;
    call_notifications?: boolean;
    sound_enabled?: boolean;
    desktop_notifications?: boolean;
}

// WebRTC Signaling types
export interface RTCSignalingMessage {
    type: 'offer' | 'answer' | 'ice-candidate' | 'call-end';
    call_id: string;
    from_user_id: string;
    to_user_id: string;
    sdp?: string;
    ice_candidate?: RTCIceCandidateInit;
}

export interface RTCConnectionState {
    state: RTCPeerConnectionState;
    ice_connection_state: RTCIceConnectionState;
    ice_gathering_state: RTCIceGatheringState;
}

// Frontend-specific state types
export interface ConversationListState {
    conversations: import('./messaging').Conversation[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    cursor?: string;
    searchQuery: string;
    showArchived: boolean;
}

export interface ChatWindowState {
    messages: import('./messaging').Message[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    cursor?: string;
    typingUsers: string[];
    searchQuery: string;
    searchResults: import('./messaging').Message[];
}

export interface CallState {
    activeCall: import('./messaging').Call | null;
    incomingCall: import('./messaging').Call | null;
    callStatus: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed';
    isMuted: boolean;
    volume: number;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
    error: string | null;
}

export interface UserPresenceState {
    presenceMap: Record<string, import('./messaging').UserPresence>;
    onlineUsers: Set<string>;
    lastUpdated: string;
}

export interface NotificationState {
    notifications: import('./messaging').InAppNotification[];
    unreadCount: number;
    preferences: import('./messaging').NotificationPreferences;
    permissionGranted: boolean;
}

// UI Component prop types
export interface ConversationListItemProps {
    conversation: import('./messaging').Conversation;
    isActive: boolean;
    currentUserId: string;
    onSelect: (conversationId: string) => void;
    onArchive?: (conversationId: string) => void;
    onDelete?: (conversationId: string) => void;
}

export interface MessageItemProps {
    message: import('./messaging').Message;
    isFromCurrentUser: boolean;
    showTimestamp?: boolean;
    showAvatar?: boolean;
    onRetry?: (messageId: string) => void;
}

export interface ChatInputProps {
    conversationId: string;
    onSendMessage: (content: string) => void;
    onTypingStart: () => void;
    onTypingStop: () => void;
    disabled?: boolean;
    placeholder?: string;
}

export interface CallControlsProps {
    call: import('./messaging').Call;
    isMuted: boolean;
    volume: number;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
    onToggleMute: () => void;
    onVolumeChange: (volume: number) => void;
    onEndCall: () => void;
}

export interface IncomingCallModalProps {
    call: import('./messaging').Call;
    onAccept: () => void;
    onDecline: () => void;
}

export interface UserSearchProps {
    onSelectUser: (user: import('./user').User) => void;
    excludeUserIds?: string[];
    placeholder?: string;
}

// Form validation types
export interface MessageFormData {
    content: string;
}

export interface UserSearchFormData {
    query: string;
}

export interface CallFormData {
    calleeId: string;
    type: 'voice' | 'video';
}

// Hook return types
export interface UseConversationsReturn {
    conversations: import('./messaging').Conversation[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
    refresh: () => void;
    createConversation: (participantId: string) => Promise<import('./messaging').Conversation>;
    archiveConversation: (conversationId: string) => Promise<void>;
    deleteConversation: (conversationId: string) => Promise<void>;
}

export interface UseMessagesReturn {
    messages: import('./messaging').Message[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
    sendMessage: (content: string) => Promise<void>;
    markAsRead: () => Promise<void>;
    searchMessages: (query: string) => import('./messaging').Message[];
}

export interface UseCallReturn {
    activeCall: import('./messaging').Call | null;
    incomingCall: import('./messaging').Call | null;
    callStatus: CallState['callStatus'];
    isMuted: boolean;
    volume: number;
    connectionQuality: CallState['connectionQuality'];
    initiateCall: (calleeId: string, type: 'voice' | 'video') => Promise<void>;
    acceptCall: () => Promise<void>;
    declineCall: () => Promise<void>;
    endCall: () => Promise<void>;
    toggleMute: () => void;
    setVolume: (volume: number) => void;
}

export interface UseUserPresenceReturn {
    getUserPresence: (userId: string) => import('./messaging').UserPresence | null;
    isUserOnline: (userId: string) => boolean;
    getOnlineUsers: () => string[];
    updatePresence: (status: import('./messaging').UserStatus) => void;
}

export interface UseWebSocketReturn {
    isConnected: boolean;
    connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
    sendMessage: (message: import('./messaging').WSMessage) => void;
    lastMessage: import('./messaging').WSMessage | null;
    error: string | null;
}

// Event handler types
export type ConversationSelectHandler = (conversationId: string) => void;
export type MessageSendHandler = (content: string) => void;
export type CallActionHandler = () => void;
export type UserSelectHandler = (user: import('./user').User) => void;
export type TypingHandler = (isTyping: boolean) => void;
export type VolumeChangeHandler = (volume: number) => void;
export type SearchHandler = (query: string) => void;

// Constants
export const MESSAGE_LIMITS = {
    CONTENT_MAX_LENGTH: 2000,
    HISTORY_PAGE_SIZE: 50,
    SEARCH_DEBOUNCE_MS: 300,
} as const;

export const CALL_LIMITS = {
    MAX_DURATION_HOURS: 4,
    CONNECTION_TIMEOUT_MS: 30000,
    RECONNECT_ATTEMPTS: 3,
} as const;

export const WEBSOCKET_CONFIG = {
    RECONNECT_INTERVAL_MS: 1000,
    MAX_RECONNECT_ATTEMPTS: 5,
    HEARTBEAT_INTERVAL_MS: 30000,
} as const;