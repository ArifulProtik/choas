# Requirements Document

## Introduction

This feature implements a comprehensive messaging and friends system API that supports the existing UI components. The system includes friend management (add, remove, list friends), private messaging between users, conversation management, notifications, and real-time communication via authenticated WebSocket connections. The API follows the existing backend architecture patterns using Ent.go schemas, service layers, and controller layers.

## Requirements

### Requirement 1: Friend Management System

**User Story:** As a user, I want to manage my friend relationships, so that I can connect with other users and control my social network.

#### Acceptance Criteria

1. WHEN a user sends a friend request THEN the system SHALL create a pending friendship record with status "pending"
2. WHEN a user receives a friend request THEN the system SHALL allow them to accept or decline the request
3. WHEN a friend request is accepted THEN the system SHALL create bidirectional friendship records with status "accepted"
4. WHEN a friend request is declined THEN the system SHALL delete the pending friendship record
5. WHEN a user removes a friend THEN the system SHALL delete both friendship records
6. WHEN a user requests their friend list THEN the system SHALL return all accepted friendships with user details
7. WHEN a user requests pending friend requests THEN the system SHALL return all incoming pending requests
8. IF a friendship already exists THEN the system SHALL prevent duplicate friend requests
9. WHEN a user blocks another user THEN the system SHALL prevent all friend interactions between them

### Requirement 2: Private Messaging System

**User Story:** As a user, I want to send and receive private messages with my friends, so that I can communicate privately and maintain conversation history.

#### Acceptance Criteria

1. WHEN a user sends a message to a friend THEN the system SHALL create a message record in the appropriate conversation
2. WHEN a conversation doesn't exist between two users THEN the system SHALL create a new conversation automatically
3. WHEN a user requests their conversations THEN the system SHALL return all conversations with the latest message and unread count
4. WHEN a user requests messages from a conversation THEN the system SHALL return paginated message history
5. WHEN a user marks messages as read THEN the system SHALL update the read status and timestamp
6. WHEN a user deletes a message THEN the system SHALL soft-delete the message (mark as deleted but preserve record)
7. IF users are not friends THEN the system SHALL prevent message sending between them
8. WHEN a message is sent THEN the system SHALL update the conversation's last_message_at timestamp

### Requirement 3: Real-time Notifications System

**User Story:** As a user, I want to receive real-time notifications for friend requests, messages, and other activities, so that I can stay updated on important events.

#### Acceptance Criteria

1. WHEN a user receives a friend request THEN the system SHALL create a notification record and send real-time notification
2. WHEN a user receives a new message THEN the system SHALL create a notification record and send real-time notification
3. WHEN a friend request is accepted THEN the system SHALL notify the requester in real-time
4. WHEN a user requests their notifications THEN the system SHALL return paginated notification history
5. WHEN a user marks notifications as read THEN the system SHALL update the read status
6. WHEN a user deletes a notification THEN the system SHALL soft-delete the notification record
7. IF a user is offline THEN the system SHALL store notifications for delivery when they reconnect

### Requirement 4: Authenticated WebSocket Communication

**User Story:** As a user, I want real-time communication capabilities, so that I can receive instant updates for messages, notifications, and friend activities.

#### Acceptance Criteria

1. WHEN a user connects via WebSocket THEN the system SHALL authenticate them using JWT token
2. WHEN authentication succeeds THEN the system SHALL establish a persistent connection and track the user as online
3. WHEN a user disconnects THEN the system SHALL clean up the connection and update their online status
4. WHEN a real-time event occurs THEN the system SHALL broadcast to relevant connected users
5. WHEN a user sends a message via WebSocket THEN the system SHALL process it and broadcast to the recipient
6. WHEN multiple devices are connected for the same user THEN the system SHALL handle multiple connections properly
7. IF authentication fails THEN the system SHALL reject the WebSocket connection
8. WHEN connection is lost THEN the system SHALL handle reconnection gracefully

### Requirement 5: Conversation Management

**User Story:** As a user, I want to manage my conversations effectively, so that I can organize my communications and control conversation settings.

#### Acceptance Criteria

1. WHEN a user archives a conversation THEN the system SHALL mark it as archived but preserve all messages
2. WHEN a user unarchives a conversation THEN the system SHALL restore it to active status
3. WHEN a user mutes a conversation THEN the system SHALL prevent notifications for that conversation
4. WHEN a user unmutes a conversation THEN the system SHALL resume notifications
5. WHEN a user searches conversations THEN the system SHALL return matching conversations based on participant names
6. WHEN a user requests conversation details THEN the system SHALL return participant information and settings
7. IF a conversation has no messages for 30 days THEN the system SHALL automatically archive it

### Requirement 6: User Blocking System

**User Story:** As a user, I want to block other users, so that I can prevent unwanted communication and maintain my privacy.

#### Acceptance Criteria

1. WHEN a user blocks another user THEN the system SHALL create a block record and prevent all interactions
2. WHEN a user unblocks another user THEN the system SHALL remove the block record and restore normal interactions
3. WHEN a blocked user tries to send a message THEN the system SHALL reject the message silently
4. WHEN a blocked user tries to send a friend request THEN the system SHALL reject the request silently
5. WHEN a user requests their blocked users list THEN the system SHALL return all blocked user records
6. IF users have an existing friendship and one blocks the other THEN the system SHALL remove the friendship
7. WHEN a user is blocked THEN the system SHALL hide them from search results and friend suggestions

### Requirement 7: Message Search and Filtering

**User Story:** As a user, I want to search through my messages and filter conversations, so that I can quickly find specific information and conversations.

#### Acceptance Criteria

1. WHEN a user searches messages THEN the system SHALL return matching messages with conversation context
2. WHEN a user filters conversations by unread status THEN the system SHALL return only conversations with unread messages
3. WHEN a user filters conversations by archived status THEN the system SHALL return only archived conversations
4. WHEN a user searches by participant name THEN the system SHALL return matching conversations
5. WHEN search results are returned THEN the system SHALL highlight matching text in message content
6. IF no matches are found THEN the system SHALL return an empty result set with appropriate message

### Requirement 8: Voice Calling System

**User Story:** As a user, I want to make voice calls with my friends, so that I can have real-time voice communication and see call history in my conversations.

#### Acceptance Criteria

1. WHEN a user initiates a voice call THEN the system SHALL create a call record and send real-time call invitation to the target user
2. WHEN a user receives a call invitation THEN the system SHALL notify them in real-time via WebSocket and allow them to accept or decline
3. WHEN a call is accepted THEN the system SHALL update call status and create call_start message in the conversation
4. WHEN a call is declined or missed THEN the system SHALL update call status and notify the caller via WebSocket
5. WHEN a call ends THEN the system SHALL update call duration and create call_end message in the conversation
6. WHEN call messages are created THEN the system SHALL appear in conversation history as system messages
7. IF users are not friends THEN the system SHALL prevent voice calls between them
8. WHEN a user is already in a call THEN the system SHALL reject new incoming calls with busy status
9. IF a user blocks another user THEN the system SHALL prevent all voice call interactions between them
10. WHEN a call invitation expires (30 seconds) THEN the system SHALL automatically mark it as missed

### Requirement 9: Call History and Integration

**User Story:** As a user, I want to see my call history integrated with my conversations, so that I can track my communication history in one place.

#### Acceptance Criteria

1. WHEN a call starts THEN the system SHALL create a "call_start" message in the conversation
2. WHEN a call ends THEN the system SHALL create a "call_end" message with duration in the conversation
3. WHEN a user views conversation history THEN the system SHALL display call messages with appropriate formatting
4. WHEN a user requests recent calls THEN the system SHALL return calls from all conversations with pagination
5. WHEN call messages are displayed THEN the system SHALL show call duration, status, and timestamp
6. WHEN a call is missed THEN the system SHALL show missed call indicator in conversation
