# Design Document

## Overview

This design implements a comprehensive messaging and friends system API that extends the existing backend architecture. The system follows the established patterns using Ent.go for data modeling, service layer for business logic, and controller layer for HTTP handling. The design includes real-time WebSocket communication for instant messaging and notifications, while maintaining consistency with the current authentication and error handling patterns.

## Architecture

### High-Level Architecture

The system extends the existing three-layer architecture:

1. **Data Layer**: Ent.go schemas for Friend, Conversation, Message, Notification, and Block entities
2. **Service Layer**: Business logic services for friend management, messaging, notifications, and WebSocket handling
3. **Controller Layer**: HTTP endpoints and WebSocket handlers following existing patterns
4. **Real-time Layer**: WebSocket connection management and message broadcasting

### Database Schema Design

Following the existing BaseMixin pattern with UUID-based IDs and timestamps:

```
User (existing)
├── Friends (many-to-many through Friend entity)
├── Conversations (many-to-many through conversation_participants)
├── Messages (one-to-many)
├── Notifications (one-to-many)
└── Blocked Users (many-to-many through Block entity)

Friend
├── requester_id (User)
├── addressee_id (User)
├── status (pending, accepted, declined)
└── BaseMixin fields

Conversation
├── type (direct, group - for future expansion)
├── name (optional, for group chats)
├── last_message_at
├── is_archived (default: false)
├── is_muted (default: false)
└── BaseMixin fields

Message
├── conversation_id (Conversation)
├── sender_id (User)
├── content
├── message_type (text, image, file - for future expansion)
├── is_deleted (default: false)
├── edited_at (optional)
└── BaseMixin fields

Notification
├── user_id (User)
├── type (friend_request, message, friend_accepted)
├── title
├── content
├── is_read (default: false)
├── related_user_id (optional, for friend notifications)
├── related_conversation_id (optional, for message notifications)
└── BaseMixin fields

Block
├── blocker_id (User)
├── blocked_id (User)
└── BaseMixin fields

ConversationParticipant (junction table)
├── conversation_id (Conversation)
├── user_id (User)
├── joined_at
├── last_read_at (for unread message tracking)
├── is_archived (user-specific)
├── is_muted (user-specific)
└── BaseMixin fields

Call
├── caller_id (User)
├── callee_id (User)
├── call_type (voice, video - for future expansion)
├── status (pending, ringing, accepted, declined, ended, missed, failed)
├── started_at (when call was initiated)
├── answered_at (when call was answered, optional)
├── ended_at (when call ended, optional)
├── duration (calculated field in seconds, optional)
└── BaseMixin fields
```

## Components and Interfaces

### Service Layer Components

#### FriendService

```go
type FriendService interface {
    SendFriendRequest(ctx context.Context, requesterID, addresseeID string) error
    AcceptFriendRequest(ctx context.Context, requesterID, addresseeID string) error
    DeclineFriendRequest(ctx context.Context, requesterID, addresseeID string) error
    RemoveFriend(ctx context.Context, userID, friendID string) error
    GetFriends(ctx context.Context, userID string) ([]*ent.User, error)
    GetPendingRequests(ctx context.Context, userID string) ([]*ent.Friend, error)
    AreFriends(ctx context.Context, userID1, userID2 string) (bool, error)
    IsBlocked(ctx context.Context, userID1, userID2 string) (bool, error)
}
```

#### MessagingService

```go
type MessagingService interface {
    SendMessage(ctx context.Context, senderID, conversationID, content string) (*ent.Message, error)
    GetOrCreateDirectConversation(ctx context.Context, userID1, userID2 string) (*ent.Conversation, error)
    GetUserConversations(ctx context.Context, userID string, limit, offset int) ([]*ConversationWithDetails, error)
    GetConversationMessages(ctx context.Context, conversationID string, userID string, limit, offset int) ([]*ent.Message, error)
    MarkMessagesAsRead(ctx context.Context, conversationID, userID string) error
    DeleteMessage(ctx context.Context, messageID, userID string) error
    SearchMessages(ctx context.Context, userID, query string, limit, offset int) ([]*MessageSearchResult, error)
}
```

#### NotificationService

```go
type NotificationService interface {
    CreateNotification(ctx context.Context, userID, notificationType, title, content string, relatedUserID, relatedConversationID *string) (*ent.Notification, error)
    GetUserNotifications(ctx context.Context, userID string, limit, offset int) ([]*ent.Notification, error)
    MarkNotificationAsRead(ctx context.Context, notificationID, userID string) error
    MarkAllNotificationsAsRead(ctx context.Context, userID string) error
    DeleteNotification(ctx context.Context, notificationID, userID string) error
}
```

#### WebSocketService

```go
type WebSocketService interface {
    HandleConnection(conn *websocket.Conn, userID string) error
    BroadcastToUser(userID string, message WebSocketMessage) error
    BroadcastToConversation(conversationID string, message WebSocketMessage, excludeUserID string) error
    DisconnectUser(userID string) error
    IsUserOnline(userID string) bool
}
```

#### BlockService

```go
type BlockService interface {
    BlockUser(ctx context.Context, blockerID, blockedID string) error
    UnblockUser(ctx context.Context, blockerID, blockedID string) error
    GetBlockedUsers(ctx context.Context, userID string) ([]*ent.User, error)
    IsBlocked(ctx context.Context, userID1, userID2 string) (bool, error)
}
```

#### CallService

```go
type CallService interface {
    InitiateCall(ctx context.Context, callerID, calleeID string, callType string) (*ent.Call, error)
    AcceptCall(ctx context.Context, callID, userID string) error
    DeclineCall(ctx context.Context, callID, userID string) error
    EndCall(ctx context.Context, callID, userID string) error
    GetActiveCall(ctx context.Context, userID string) (*ent.Call, error)
    GetCallHistory(ctx context.Context, userID string, limit, offset int) ([]*ent.Call, error)
    HandleCallTimeout(ctx context.Context, callID string) error
    CreateCallMessages(ctx context.Context, call *ent.Call) error
}
```

### Controller Layer Components

Following the existing controller pattern with structured error responses:

#### FriendController

- `POST /friends/request` - Send friend request
- `POST /friends/accept` - Accept friend request
- `POST /friends/decline` - Decline friend request
- `DELETE /friends/:friendID` - Remove friend
- `GET /friends` - Get friend list
- `GET /friends/requests` - Get pending requests

#### MessagingController

- `POST /conversations/:conversationID/messages` - Send message
- `GET /conversations` - Get user conversations
- `GET /conversations/:conversationID` - Get conversation details
- `GET /conversations/:conversationID/messages` - Get conversation messages
- `PUT /conversations/:conversationID/read` - Mark messages as read
- `DELETE /messages/:messageID` - Delete message
- `GET /messages/search` - Search messages

#### NotificationController

- `GET /notifications` - Get user notifications
- `PUT /notifications/:notificationID/read` - Mark notification as read
- `PUT /notifications/read-all` - Mark all notifications as read
- `DELETE /notifications/:notificationID` - Delete notification

#### BlockController

- `POST /blocks` - Block user
- `DELETE /blocks/:blockedUserID` - Unblock user
- `GET /blocks` - Get blocked users

#### WebSocketController

- `GET /ws` - WebSocket connection endpoint with JWT authentication

#### CallController

- `POST /calls` - Initiate a new voice call
- `POST /calls/:callID/accept` - Accept an incoming call
- `POST /calls/:callID/decline` - Decline an incoming call
- `POST /calls/:callID/end` - End an active call
- `GET /calls/active` - Get current active call for user
- `GET /calls/history` - Get call history with pagination

## Data Models

### WebSocket Message Types

```go
type WebSocketMessage struct {
    Type      string      `json:"type"`
    Data      interface{} `json:"data"`
    Timestamp time.Time   `json:"timestamp"`
}

type MessageData struct {
    ConversationID string `json:"conversation_id"`
    Message        *ent.Message `json:"message"`
}

type NotificationData struct {
    Notification *ent.Notification `json:"notification"`
}

type FriendRequestData struct {
    Friend *ent.Friend `json:"friend"`
    User   *ent.User   `json:"user"`
}

type CallRequestData struct {
    Call *ent.Call `json:"call"`
}

type CallResponseData struct {
    CallID   string `json:"call_id"`
    Response string `json:"response"` // "accepted" or "declined"
    CallerID string `json:"caller_id"`
    CalleeID string `json:"callee_id"`
}

type CallEndData struct {
    CallID   string `json:"call_id"`
    Duration int    `json:"duration,omitempty"`
    EndedBy  string `json:"ended_by"`
}
```

### Response DTOs

```go
type ConversationWithDetails struct {
    *ent.Conversation
    Participants    []*ent.User `json:"participants"`
    LastMessage     *ent.Message `json:"last_message,omitempty"`
    UnreadCount     int         `json:"unread_count"`
    IsArchived      bool        `json:"is_archived"`
    IsMuted         bool        `json:"is_muted"`
}

type MessageSearchResult struct {
    *ent.Message
    ConversationID   string `json:"conversation_id"`
    ConversationName string `json:"conversation_name"`
    Highlight        string `json:"highlight"`
}

type CallWithDetails struct {
    *ent.Call
    Caller   *ent.User `json:"caller"`
    Callee   *ent.User `json:"callee"`
    Duration int       `json:"duration_seconds"`
}
```

## Error Handling

Following the existing ErrorResponse pattern:

### Friend Management Errors

- `400 Bad Request` - Invalid input data
- `404 Not Found` - User not found
- `409 Conflict` - Friend request already exists, users are already friends
- `403 Forbidden` - User is blocked, cannot perform action

### Messaging Errors

- `400 Bad Request` - Invalid message content, invalid conversation ID
- `403 Forbidden` - Not a participant in conversation, user is blocked
- `404 Not Found` - Conversation not found, message not found
- `413 Payload Too Large` - Message content exceeds limit

### WebSocket Errors

- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - Token expired or invalid
- `429 Too Many Requests` - Rate limiting for message sending

### Notification Errors

- `404 Not Found` - Notification not found
- `403 Forbidden` - Not authorized to access notification

### Voice Calling Errors

- `400 Bad Request` - Invalid call parameters, invalid callee ID
- `403 Forbidden` - Not authorized to call user, user is blocked, not friends
- `404 Not Found` - Call not found, user not found
- `409 Conflict` - User already in a call, call already ended, invalid call state
- `410 Gone` - Call expired or timed out

## Testing Strategy

### Unit Testing

- Service layer methods with mocked Ent client
- Controller endpoints with mocked services
- WebSocket message handling logic
- Authentication middleware for WebSocket connections

### Integration Testing

- End-to-end friend request flow
- Message sending and receiving flow
- Real-time notification delivery
- WebSocket connection lifecycle

### Performance Testing

- WebSocket connection limits
- Message throughput testing
- Database query performance with large datasets
- Concurrent user handling

## Security Considerations

### Authentication & Authorization

- JWT token validation for all endpoints
- WebSocket authentication using JWT tokens
- User authorization for accessing conversations and messages
- Prevention of unauthorized friend operations

### Data Protection

- Soft deletion for messages and notifications
- Block functionality to prevent unwanted communication
- Input validation and sanitization
- Rate limiting for message sending

### WebSocket Security

- Connection rate limiting
- Message size limits
- Automatic disconnection for inactive connections
- Prevention of message flooding

## Real-time Communication Flow

### WebSocket Connection Flow

1. Client connects to `/ws` endpoint with JWT token
2. Server validates token and establishes connection
3. Server tracks user as online and stores connection
4. Server sends confirmation message to client

### Message Broadcasting Flow

1. User sends message via HTTP or WebSocket
2. Service validates permissions and saves message
3. Service triggers real-time broadcast to conversation participants
4. WebSocket service sends message to connected users
5. Offline users receive notifications when they reconnect

### Notification Flow

1. System event triggers notification creation
2. Notification service creates database record
3. WebSocket service broadcasts to target user if online
4. Notification appears in user's notification list

### Voice Call Flow

#### Call Initiation Flow

1. User initiates call via HTTP endpoint
2. Call service validates permissions (friends only, not blocked) and creates call record
3. WebSocket service broadcasts call_request to callee
4. Call service starts 30-second timeout timer for call expiration
5. Callee receives real-time call invitation notification

#### Call Response Flow

1. Callee accepts or declines call via HTTP endpoint
2. Call service updates call status (accepted/declined)
3. WebSocket service broadcasts call_response to caller
4. If accepted, call service creates "call_start" message in conversation
5. Frontend handles WebRTC connection establishment (client-side)

#### Call Termination Flow

1. Either participant ends call via HTTP endpoint
2. Call service calculates duration and updates call status to "ended"
3. Call service creates "call_end" message in conversation with duration
4. WebSocket service broadcasts call_end to both participants
5. Call appears in conversation history as system messages

## Performance Optimizations

### Database Optimizations

- Indexes on frequently queried fields (user_id, conversation_id, created_at)
- Pagination for message and notification lists
- Efficient friend relationship queries using proper joins
- Connection pooling for database connections

### WebSocket Optimizations

- Connection pooling and management
- Message queuing for offline users
- Efficient user lookup for broadcasting
- Automatic cleanup of stale connections

### Caching Strategy

- Cache online user status
- Cache recent conversations for quick access
- Cache friend relationships for permission checks
- Redis for WebSocket connection tracking (future enhancement)
- Cache active call sessions for quick lookup
- Cache WebRTC connection states

### Voice Calling Optimizations

#### Call Management Optimizations

- Efficient call state management with minimal database queries
- Automatic cleanup of expired calls (30-second timeout)
- Batch creation of call messages in conversations
- Optimized call history queries with proper indexing
- WebSocket connection reuse for call signaling

#### Message Integration Optimizations

- Efficient conversation lookup for call message creation
- Batch processing of call start/end messages
- Optimized message queries including call message types
- Proper indexing for call history retrieval
- Integration with existing message broadcasting system
