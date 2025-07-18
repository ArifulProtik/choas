# Implementation Plan

- [x] 1. Design frontend TypeScript interfaces and data models

  - Create TypeScript interfaces for User, Conversation, Message, Call, and UserPresence
  - Define frontend data structures based on UI requirements and user interactions
  - Create comprehensive mock data for development
  - Write type validation utilities and helper functions
  - Add friend system types (FriendRequest, Friendship) and related WebSocket/API types
  - Include friend-related utility functions for friendship status and permissions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 3.1, 4.1, 5.7, 6.1_

- [x] 2. Create frontend messaging store with Zustand

  - Implement messaging store with conversation and message state management
  - Add actions for conversation CRUD operations and message handling
  - Create unread count tracking and typing indicator state
  - Add user presence and online status state management
  - _Requirements: 1.4, 2.3, 2.4, 3.1, 6.1_

- [x] 3. Build conversation list UI component

  - Create conversation list component with mock data integration
  - Add unread message count display and last message preview
  - Implement conversation selection and active state management
  - Add user search interface for starting new conversations
  - _Requirements: 1.1, 1.3, 1.4, 2.3, 8.3_

- [x] 4. Implement chat window UI component

  - Create message display component with scrollable message list
  - Build message input component with send functionality
  - Add typing indicator display and user presence in chat header
  - Create message status indicators (sent, delivered, read)
  - _Requirements: 2.1, 2.2, 2.4, 2.6, 3.1, 6.1_

- [x] 5. Add message history and pagination to chat window

  - Implement infinite scroll functionality for loading older messages
  - Add message timestamp display and formatting
  - Create message search functionality within conversations
  - Add loading states and skeleton components for better UX
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6. Create call state management store

  - Implement call store with active call and incoming call state
  - Add call status tracking (idle, calling, ringing, connected, ended)
  - Create actions for call initiation, acceptance, decline, and termination
  - Add audio control state (mute, volume, connection quality)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3_

- [ ] 7. Build call interface UI components

  - Create incoming call notification modal with accept/decline buttons
  - Implement active call interface with audio controls (mute, volume, end call)
  - Add call status indicators and connection quality display
  - Create call initiation button integrated into chat window
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4_

- [ ] 8. Implement conversation management UI features

  - Add conversation deletion functionality with confirmation dialogs
  - Create user blocking and unblocking interface
  - Implement conversation archiving system with archive view
  - Add blocked user list management interface
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Add notification system UI components

  - Create in-app notification components for messages and calls
  - Add unread message badge counts throughout the UI
  - Implement notification preferences and settings interface
  - Create toast notifications for various user actions
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10. Build WebSocket client for real-time communication

  - Create WebSocket client class with connection management
  - Implement automatic reconnection logic with exponential backoff
  - Add message sending and receiving handlers
  - Integrate WebSocket client with messaging store
  - Write tests for connection handling and message flow
  - _Requirements: 2.1, 2.2, 2.5, 2.6_

- [ ] 11. Implement WebRTC client for voice calls

  - Create WebRTC client class with peer connection management
  - Implement offer/answer creation and handling
  - Add ICE candidate processing and connection establishment
  - Create media stream management for audio
  - Write unit tests for WebRTC connection logic
  - _Requirements: 4.1, 4.3, 5.1, 5.4_

- [ ] 12. Set up database schema and core models

  - Create Ent schema files for Conversation, Message, UserPresence, and BlockedUser entities
  - Generate Ent code and run database migrations
  - Write unit tests for schema validation and relationships
  - Ensure schema matches frontend data structure requirements
  - _Requirements: 1.2, 2.1, 3.1, 6.4, 7.3_

- [ ] 13. Implement conversation service layer

  - Create conversation service with CRUD operations for conversations and messages
  - Implement user search functionality with blocking checks
  - Add conversation participant validation and authorization
  - Write unit tests for all service methods
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.3_

- [ ] 14. Build REST API endpoints for conversations

  - Implement conversation management endpoints (create, list, delete)
  - Add message endpoints (send, retrieve history, mark as read)
  - Create user search and blocking endpoints
  - Add request validation and error handling
  - Write integration tests for all endpoints
  - _Requirements: 1.1, 1.2, 1.4, 6.1, 6.2, 6.4, 7.1, 7.2, 7.3, 7.4_

- [ ] 15. Implement user presence tracking service

  - Create presence service to track online/offline status
  - Add last seen timestamp management
  - Implement presence update methods with database persistence
  - Write unit tests for presence tracking logic
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 16. Set up WebSocket server infrastructure

  - Create WebSocket hub for connection management
  - Implement connection authentication using JWT tokens
  - Add message broadcasting and user-specific message routing
  - Create WebSocket message types and handlers
  - Write tests for connection management and message routing
  - _Requirements: 2.1, 2.2, 2.6, 3.2_

- [ ] 17. Implement real-time messaging via WebSocket

  - Add message sending and receiving through WebSocket connections
  - Implement typing indicators with debouncing
  - Create message delivery confirmation system
  - Add presence updates through WebSocket
  - Write integration tests for real-time message flow
  - _Requirements: 2.1, 2.2, 2.3, 2.6, 3.2_

- [ ] 18. Set up WebRTC signaling server

  - Create signaling server for WebRTC call coordination
  - Implement offer/answer/ICE candidate message handling
  - Add call state management and participant tracking
  - Create call session cleanup and timeout handling
  - Write unit tests for signaling message processing
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

- [ ] 19. Implement call management REST API

  - Create call initiation, acceptance, and decline endpoints
  - Add call state tracking and validation
  - Implement call history logging for conversations
  - Add authorization checks for call participants
  - Write integration tests for call management endpoints
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

- [ ] 20. Integrate frontend and backend with end-to-end testing
  - Connect all frontend components with backend services
  - Test complete conversation creation and messaging flow
  - Verify voice call initiation, acceptance, and termination
  - Test real-time features across multiple browser sessions
  - Add performance optimizations and validate effectiveness
  - _Requirements: All requirements integration testing_
