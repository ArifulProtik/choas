# Requirements Document

## Introduction

This feature redesigns the conversation list component to match Discord's user interface design, providing a more familiar and intuitive messaging experience. The redesign focuses on creating a clean, dark-themed interface with prominent search functionality, navigation sections, and a streamlined direct messages list that emphasizes user avatars and online status indicators.

## Requirements

### Requirement 1

**User Story:** As a user, I want a Discord-style search bar at the top of the conversation list, so that I can quickly find or start conversations.

#### Acceptance Criteria

1. WHEN the conversation list loads THEN the system SHALL display a search input with placeholder text "Find or start a conversation"
2. WHEN a user types in the search bar THEN the system SHALL filter conversations in real-time
3. WHEN the search bar is focused THEN the system SHALL highlight the input with appropriate styling
4. WHEN the search bar is empty THEN the system SHALL show all conversations

### Requirement 2

**User Story:** As a user, I want navigation sections (Friends, Nitro, Shop) above the direct messages, so that I can access different areas of the application.

#### Acceptance Criteria

1. WHEN the conversation list loads THEN the system SHALL display three navigation sections: Friends, Nitro, and Shop
2. WHEN a user clicks on Friends THEN the system SHALL navigate to the friends management section
3. WHEN a user clicks on Nitro THEN the system SHALL display Nitro-related features (placeholder for now)
4. WHEN a user clicks on Shop THEN the system SHALL display shop-related features (placeholder for now)
5. WHEN a navigation item is active THEN the system SHALL highlight it with appropriate styling

### Requirement 3

**User Story:** As a user, I want a "Direct Messages" section header with an add button, so that I can clearly identify the messaging area and start new conversations.

#### Acceptance Criteria

1. WHEN the conversation list loads THEN the system SHALL display a "Direct Messages" section header
2. WHEN the Direct Messages header is displayed THEN the system SHALL show a plus (+) icon button next to it
3. WHEN a user clicks the plus button THEN the system SHALL open a modal to start a new conversation
4. WHEN there are unread messages THEN the system SHALL display the total count next to the section header

### Requirement 4

**User Story:** As a user, I want conversation items to display with user avatars, names, and status indicators in a Discord-style layout, so that I can quickly identify contacts and their availability.

#### Acceptance Criteria

1. WHEN displaying conversation items THEN the system SHALL show user avatars as the primary visual element
2. WHEN displaying conversation items THEN the system SHALL show user names prominently next to avatars
3. WHEN a user is online THEN the system SHALL display a green status indicator on their avatar
4. WHEN a user is offline THEN the system SHALL display a gray status indicator on their avatar
5. WHEN a user is in a voice call THEN the system SHALL display a voice indicator and "In voice" text
6. WHEN there are unread messages THEN the system SHALL display the conversation with higher visual prominence
7. WHEN a conversation is selected THEN the system SHALL highlight it with appropriate background styling

### Requirement 5

**User Story:** As a user, I want the conversation list to have a dark theme matching Discord's visual design, so that I have a consistent and familiar interface experience.

#### Acceptance Criteria

1. WHEN the conversation list loads THEN the system SHALL use a dark background color scheme
2. WHEN displaying text THEN the system SHALL use appropriate contrast colors for readability
3. WHEN showing interactive elements THEN the system SHALL use hover states with subtle color changes
4. WHEN displaying status indicators THEN the system SHALL use Discord-standard colors (green for online, gray for offline)
5. WHEN showing selected items THEN the system SHALL use appropriate highlight colors

### Requirement 6

**User Story:** As a user, I want conversation items to show additional context like voice call status and user activity, so that I can understand what contacts are currently doing.

#### Acceptance Criteria

1. WHEN a user is in a voice call THEN the system SHALL display a voice icon and "In voice" status
2. WHEN a user has a custom status THEN the system SHALL display it below their name
3. WHEN a user is typing THEN the system SHALL show a typing indicator
4. WHEN displaying timestamps THEN the system SHALL show them in a subtle, non-intrusive way
5. WHEN a conversation has special properties THEN the system SHALL display appropriate indicators (e.g., close button for active conversations)
