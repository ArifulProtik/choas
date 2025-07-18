# Design Document

## Overview

The Discord-style conversation list redesign transforms the existing messaging interface into a familiar, Discord-like experience. The design emphasizes visual hierarchy, user avatars, and status indicators while maintaining clean, dark theming. The component will be restructured to match Discord's layout patterns with a search bar, navigation sections, and a streamlined direct messages list.

## Architecture

### Component Structure

```
ConversationList
├── SearchBar
├── NavigationSection
│   ├── FriendsButton
│   ├── NitroButton
│   └── ShopButton
├── DirectMessagesHeader
│   ├── SectionTitle
│   └── AddButton
└── ConversationItems
    └── ConversationItem[]
        ├── UserAvatar (with status indicator)
        ├── UserInfo
        │   ├── UserName
        │   ├── UserStatus/Activity
        │   └── VoiceIndicator (if applicable)
        └── ConversationActions
```

### State Management

The component will integrate with the existing messaging store but with enhanced state for:

- Navigation section active states
- Search functionality
- Voice call status tracking
- Enhanced user presence data

## Components and Interfaces

### SearchBar Component

```typescript
interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

**Design Specifications:**

- Full-width input with rounded corners
- Dark background with subtle border
- Search icon on the left
- Placeholder text: "Find or start a conversation"
- Focus state with highlighted border

### NavigationSection Component

```typescript
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  onClick: () => void;
  isActive?: boolean;
}

interface NavigationSectionProps {
  items: NavigationItem[];
}
```

**Design Specifications:**

- Three horizontal buttons: Friends, Nitro, Shop
- Icons with text labels
- Hover and active states
- Consistent spacing and alignment

### DirectMessagesHeader Component

```typescript
interface DirectMessagesHeaderProps {
  title: string;
  unreadCount?: number;
  onAddClick: () => void;
}
```

**Design Specifications:**

- Section title with optional unread count badge
- Plus icon button aligned to the right
- Subtle separator line below

### Enhanced ConversationItem Component

```typescript
interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  isActive: boolean;
  onSelect: (id: string) => void;
  showCloseButton?: boolean;
  onClose?: (id: string) => void;
}

interface UserPresenceExtended {
  status: "online" | "idle" | "dnd" | "offline";
  activity?: string;
  inVoice?: boolean;
  customStatus?: string;
}
```

**Design Specifications:**

- Larger user avatars (48px) with status indicators
- User name as primary text
- Secondary text for activity/status
- Voice call indicators with icons
- Hover states and selection highlighting
- Optional close button for active conversations

## Data Models

### Enhanced User Presence

```typescript
interface UserPresence {
  userId: string;
  status: "online" | "idle" | "dnd" | "offline";
  lastSeen?: Date;
  activity?: {
    type: "playing" | "listening" | "watching" | "custom";
    name: string;
    details?: string;
  };
  voiceState?: {
    channelId: string;
    channelName: string;
    muted: boolean;
    deafened: boolean;
  };
  customStatus?: {
    text: string;
    emoji?: string;
  };
}
```

### Navigation State

```typescript
interface NavigationState {
  activeSection: "friends" | "nitro" | "shop" | "messages";
  searchQuery: string;
  showUserSearch: boolean;
}
```

## Error Handling

### Search Functionality

- Handle empty search results gracefully
- Debounce search input to prevent excessive API calls
- Show loading states during search operations

### User Presence

- Fallback to offline status when presence data is unavailable
- Handle missing avatar images with appropriate fallbacks
- Graceful degradation when voice state is unavailable

### Navigation

- Handle navigation errors with user-friendly messages
- Maintain state consistency when switching between sections
- Provide fallback content for unavailable sections

## Testing Strategy

### Unit Tests

- SearchBar component functionality and event handling
- NavigationSection active state management
- ConversationItem rendering with various user states
- User presence status indicator logic

### Integration Tests

- Search functionality with messaging store
- Navigation between different sections
- Conversation selection and state updates
- Voice call status integration

### Visual Tests

- Component rendering with different themes
- Status indicator colors and positioning
- Hover and active state styling
- Responsive behavior on different screen sizes

### Accessibility Tests

- Keyboard navigation through conversation items
- Screen reader compatibility for status indicators
- Focus management in search and navigation
- Color contrast compliance for dark theme

## Implementation Notes

### Styling Approach

- Use CSS-in-JS or Tailwind classes for Discord-like styling
- Implement consistent spacing using design tokens
- Create reusable status indicator components
- Ensure proper dark theme color palette

### Performance Considerations

- Virtualize conversation list for large datasets
- Optimize avatar image loading and caching
- Debounce search input and presence updates
- Minimize re-renders with proper memoization

### Accessibility

- Proper ARIA labels for status indicators
- Keyboard navigation support
- Screen reader announcements for status changes
- High contrast mode compatibility
