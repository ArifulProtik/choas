# Implementation Plan

- [x] 1. Create Ent.go schemas for messaging and friends system

  - Create Friend schema with requester/addressee relationships and status field
  - Create Conversation schema with type, name, and metadata fields
  - Create Message schema with conversation, sender relationships and content
  - Create Notification schema with user relationship and notification types
  - Create Block schema for user blocking functionality
  - Create ConversationParticipant schema for many-to-many conversation membership
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 6.1_

- [x] 2. Implement Friend service layer with core friendship operations

  - Create friend_service.go with SendFriendRequest, AcceptFriendRequest, DeclineFriendRequest methods
  - Implement RemoveFriend, GetFriends, GetPendingRequests methods
  - Add AreFriends and IsBlocked helper methods for permission checking
  - Integrate with existing Services struct and dependency injection pattern
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 3. Create Friend controller with HTTP endpoints

  - Create friend_controller.go following existing controller patterns
  - Implement POST /friends/request endpoint with validation
  - Implement POST /friends/accept and POST /friends/decline endpoints
  - Implement DELETE /friends/:friendID and GET /friends endpoints
  - Implement GET /friends/requests endpoint for pending requests
  - Add proper error handling using existing ErrorResponse pattern
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 4. Implement Block service and controller for user blocking

  - Create block_service.go with BlockUser, UnblockUser, GetBlockedUsers methods
  - Create block_controller.go with POST /blocks, DELETE /blocks/:userID, GET /blocks endpoints
  - Integrate blocking checks into friend service methods
  - Add IsBlocked validation to prevent interactions between blocked users
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 5. Create Messaging service layer for conversations and messages

  - Create messaging_service.go with SendMessage and GetOrCreateDirectConversation methods
  - Implement GetUserConversations with pagination and conversation details
  - Implement GetConversationMessages with pagination and read status tracking
  - Add MarkMessagesAsRead and DeleteMessage methods with soft deletion
  - Implement SearchMessages method with content matching
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 7.1, 7.5_

- [x] 6. Create Messaging controller with conversation and message endpoints

  - Create messaging_controller.go following existing patterns
  - Implement POST /conversations/:conversationID/messages endpoint
  - Implement GET /conversations and GET /conversations/:conversationID endpoints
  - Implement GET /conversations/:conversationID/messages with pagination
  - Implement PUT /conversations/:conversationID/read and DELETE /messages/:messageID endpoints
  - Add GET /messages/search endpoint with query parameters
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 7.1_

- [x] 7. Implement Notification service layer

  - Create notification_service.go with CreateNotification method for different notification types
  - Implement GetUserNotifications with pagination
  - Add MarkNotificationAsRead, MarkAllNotificationsAsRead methods
  - Implement DeleteNotification with soft deletion
  - Create helper methods for friend request and message notifications
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 8. Create Notification controller with notification management endpoints

  - Create notification_controller.go following existing controller patterns
  - Implement GET /notifications endpoint with pagination
  - Implement PUT /notifications/:notificationID/read endpoint
  - Implement PUT /notifications/read-all endpoint for bulk operations
  - Implement DELETE /notifications/:notificationID endpoint
  - Add proper authorization to ensure users can only access their notifications
  - _Requirements: 3.4, 3.5, 3.6_

- [x] 9. Implement WebSocket connection management and authentication

  - Create websocket_service.go with connection tracking and user management
  - Implement JWT authentication for WebSocket connections
  - Create connection pool management with user ID mapping
  - Add HandleConnection method with authentication validation
  - Implement DisconnectUser and IsUserOnline methods
  - Create WebSocket message types and data structures
  - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [x] 10. Create WebSocket broadcasting system for real-time communication

  - Implement BroadcastToUser method for sending messages to specific users
  - Create BroadcastToConversation method for conversation participants
  - Add message queuing for offline users (store in database)
  - Implement WebSocket message handlers for different message types
  - Create real-time message delivery system
  - _Requirements: 4.4, 4.5, 4.6, 4.8_

- [x] 11. Create WebSocket controller and HTTP upgrade handler

  - Create websocket_controller.go with WebSocket endpoint handler
  - Implement GET /ws endpoint with JWT token validation
  - Add WebSocket upgrade logic following Echo framework patterns
  - Create message routing system for different WebSocket message types
  - Implement connection lifecycle management (connect, disconnect, error handling)
  - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [x] 12. Integrate real-time notifications with friend and messaging services

  - Modify friend service to trigger notifications on friend requests and acceptances
  - Update messaging service to trigger notifications on new messages
  - Integrate WebSocket broadcasting with notification creation
  - Add real-time friend request notifications
  - Implement real-time message notifications for conversation participants
  - _Requirements: 3.1, 3.2, 3.3, 4.4, 4.5_

- [x] 13. Add conversation management features

  - Extend messaging service with ArchiveConversation and UnarchiveConversation methods
  - Implement MuteConversation and UnmuteConversation methods
  - Add conversation filtering by archived and muted status
  - Create SearchConversations method by participant names
  - Update messaging controller with conversation management endpoints
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.2, 7.3, 7.4_

- [x] 14. Implement permission validation and security middleware

  - Create middleware for validating friend relationships before messaging
  - Add conversation participant validation for message access
  - Implement blocking validation across all friend and messaging operations
  - Create rate limiting for message sending and friend requests
  - Add input validation and sanitization for all endpoints
  - _Requirements: 1.8, 2.7, 6.3, 6.4, 6.5_

- [x] 15. Update main.go routing to include all new endpoints

  - Add friend management routes to AttachRoutes function
  - Include messaging and conversation routes
  - Add notification management routes
  - Include block management routes
  - Add WebSocket endpoint route
  - Ensure all routes use existing authentication middleware
  - _Requirements: All endpoint requirements_

- [x] 16. Add database indexes and performance optimizations
  - Create database indexes for frequently queried fields (user_id, conversation_id, created_at)
  - Add composite indexes for friend relationships and conversation participants
  - Implement efficient pagination queries for messages and notifications
  - Optimize friend relationship queries with proper joins
  - Add database constraints for data integrity
  - _Requirements: Performance optimization for all features_
- [x] 17. Create Ent.go schema for voice calling system

  - Create Call schema with caller_id, callee_id, call_type, status, and timestamps
  - Add proper indexes for call queries (caller_id, callee_id, status, created_at)
  - Add database constraints for call state management
  - Extend Message schema to support "call_start" and "call_end" message types
  - _Requirements: 8.1, 8.2, 8.3, 8.5, 9.1, 9.2_

- [x] 18. Implement Call service layer with core calling operations

  - Create call_service.go with InitiateCall, AcceptCall, DeclineCall, EndCall methods
  - Add GetActiveCall, GetCallHistory methods with proper pagination
  - Implement HandleCallTimeout for automatic call expiration (30 seconds)
  - Add CreateCallMessages method to create call_start and call_end messages in conversations
  - Add permission validation for call operations (friends only, block checking)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.8, 8.9, 8.10, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 19. Implement Call controller with HTTP endpoints

  - Create call_controller.go following existing controller patterns
  - Implement POST /calls, POST /calls/:callID/accept, POST /calls/:callID/decline endpoints
  - Implement POST /calls/:callID/end, GET /calls/active, GET /calls/history endpoints
  - Add proper error handling and validation using existing patterns
  - Integrate with existing authentication and permission middleware
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4_

- [ ] 20. Integrate voice calling with WebSocket real-time communication

  - Extend WebSocket message types for call_request, call_response, and call_end
  - Implement real-time call invitation broadcasting to callee
  - Add call response broadcasting to caller (accepted/declined)
  - Integrate call end notifications to both participants
  - Add call timeout handling with WebSocket notifications
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.10_

- [ ] 21. Integrate call messages with conversation system

  - Extend messaging service to handle call_start and call_end message creation
  - Update conversation message queries to include call message types
  - Add proper formatting and display logic for call messages in conversations
  - Integrate call messages with existing message broadcasting system
  - Ensure call messages appear correctly in conversation history
  - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_

- [ ] 22. Update routing and integrate voice calling endpoints

  - Add call management routes to AttachRoutes function
  - Apply appropriate middleware for call permission validation
  - Add rate limiting for call initiation operations
  - Ensure all routes use existing authentication and validation middleware
  - Test end-to-end call flow with WebSocket integration
  - _Requirements: All voice calling endpoint requirements_

- [ ] 23. Add voice calling performance optimizations
  - Create database indexes for efficient call queries
  - Implement automatic cleanup of expired calls
  - Optimize call history queries with proper pagination
  - Add call message integration with existing message optimizations
  - Test call system performance under load
  - _Requirements: Performance optimization for voice calling features_
