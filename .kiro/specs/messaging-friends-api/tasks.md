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

- [ ] 4. Implement Block service and controller for user blocking

  - Create block_service.go with BlockUser, UnblockUser, GetBlockedUsers methods
  - Create block_controller.go with POST /blocks, DELETE /blocks/:userID, GET /blocks endpoints
  - Integrate blocking checks into friend service methods
  - Add IsBlocked validation to prevent interactions between blocked users
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 5. Create Messaging service layer for conversations and messages

  - Create messaging_service.go with SendMessage and GetOrCreateDirectConversation methods
  - Implement GetUserConversations with pagination and conversation details
  - Implement GetConversationMessages with pagination and read status tracking
  - Add MarkMessagesAsRead and DeleteMessage methods with soft deletion
  - Implement SearchMessages method with content matching
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 7.1, 7.5_

- [ ] 6. Create Messaging controller with conversation and message endpoints

  - Create messaging_controller.go following existing patterns
  - Implement POST /conversations/:conversationID/messages endpoint
  - Implement GET /conversations and GET /conversations/:conversationID endpoints
  - Implement GET /conversations/:conversationID/messages with pagination
  - Implement PUT /conversations/:conversationID/read and DELETE /messages/:messageID endpoints
  - Add GET /messages/search endpoint with query parameters
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 7.1_

- [ ] 7. Implement Notification service layer

  - Create notification_service.go with CreateNotification method for different notification types
  - Implement GetUserNotifications with pagination
  - Add MarkNotificationAsRead, MarkAllNotificationsAsRead methods
  - Implement DeleteNotification with soft deletion
  - Create helper methods for friend request and message notifications
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 8. Create Notification controller with notification management endpoints

  - Create notification_controller.go following existing controller patterns
  - Implement GET /notifications endpoint with pagination
  - Implement PUT /notifications/:notificationID/read endpoint
  - Implement PUT /notifications/read-all endpoint for bulk operations
  - Implement DELETE /notifications/:notificationID endpoint
  - Add proper authorization to ensure users can only access their notifications
  - _Requirements: 3.4, 3.5, 3.6_

- [ ] 9. Implement WebSocket connection management and authentication

  - Create websocket_service.go with connection tracking and user management
  - Implement JWT authentication for WebSocket connections
  - Create connection pool management with user ID mapping
  - Add HandleConnection method with authentication validation
  - Implement DisconnectUser and IsUserOnline methods
  - Create WebSocket message types and data structures
  - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [ ] 10. Create WebSocket broadcasting system for real-time communication

  - Implement BroadcastToUser method for sending messages to specific users
  - Create BroadcastToConversation method for conversation participants
  - Add message queuing for offline users (store in database)
  - Implement WebSocket message handlers for different message types
  - Create real-time message delivery system
  - _Requirements: 4.4, 4.5, 4.6, 4.8_

- [ ] 11. Create WebSocket controller and HTTP upgrade handler

  - Create websocket_controller.go with WebSocket endpoint handler
  - Implement GET /ws endpoint with JWT token validation
  - Add WebSocket upgrade logic following Echo framework patterns
  - Create message routing system for different WebSocket message types
  - Implement connection lifecycle management (connect, disconnect, error handling)
  - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [ ] 12. Integrate real-time notifications with friend and messaging services

  - Modify friend service to trigger notifications on friend requests and acceptances
  - Update messaging service to trigger notifications on new messages
  - Integrate WebSocket broadcasting with notification creation
  - Add real-time friend request notifications
  - Implement real-time message notifications for conversation participants
  - _Requirements: 3.1, 3.2, 3.3, 4.4, 4.5_

- [ ] 13. Add conversation management features

  - Extend messaging service with ArchiveConversation and UnarchiveConversation methods
  - Implement MuteConversation and UnmuteConversation methods
  - Add conversation filtering by archived and muted status
  - Create SearchConversations method by participant names
  - Update messaging controller with conversation management endpoints
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.2, 7.3, 7.4_

- [ ] 14. Implement permission validation and security middleware

  - Create middleware for validating friend relationships before messaging
  - Add conversation participant validation for message access
  - Implement blocking validation across all friend and messaging operations
  - Create rate limiting for message sending and friend requests
  - Add input validation and sanitization for all endpoints
  - _Requirements: 1.8, 2.7, 6.3, 6.4, 6.5_

- [ ] 15. Update main.go routing to include all new endpoints

  - Add friend management routes to AttachRoutes function
  - Include messaging and conversation routes
  - Add notification management routes
  - Include block management routes
  - Add WebSocket endpoint route
  - Ensure all routes use existing authentication middleware
  - _Requirements: All endpoint requirements_

- [ ] 16. Add database indexes and performance optimizations
  - Create database indexes for frequently queried fields (user_id, conversation_id, created_at)
  - Add composite indexes for friend relationships and conversation participants
  - Implement efficient pagination queries for messages and notifications
  - Optimize friend relationship queries with proper joins
  - Add database constraints for data integrity
  - _Requirements: Performance optimization for all features_
