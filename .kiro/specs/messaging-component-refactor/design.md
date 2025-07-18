# Design Document

## Overview

This design outlines the refactoring of the large `chat-window.tsx` and `conversation-list.tsx` components into smaller, focused, and maintainable components. The refactoring will follow React best practices, maintain existing functionality, and improve code organization through proper separation of concerns.

## Architecture

### Current Structure Issues

- `chat-window.tsx` (600+ lines) contains multiple responsibilities: message display, input handling, typing indicators, and header management
- `conversation-list.tsx` (400+ lines) handles conversation items, search modal, and list management
- Both components have embedded sub-components that should be extracted
- Unused imports and variables need cleanup

### New Component Architecture

```
ui/components/messaging/
├── chat-window/
│   ├── chat-window.tsx (main container)
│   ├── chat-header.tsx
│   ├── message-list.tsx
│   ├── message-item.tsx
│   ├── typing-indicator.tsx
│   └── chat-input.tsx
├── conversation-list/
│   ├── conversation-list.tsx (main container)
│   ├── conversation-list-header.tsx
│   ├── conversation-item.tsx
│   └── user-search-modal.tsx
├── shared/
│   ├── user-avatar.tsx
│   ├── message-preview.tsx
│   ├── loading-spinner.tsx
│   └── empty-state.tsx
└── (existing files remain)
```

## Components and Interfaces

### Chat Window Components

#### ChatWindow (Main Container)

```typescript
interface ChatWindowProps {
  // No props - uses store directly
}
```

- Orchestrates all chat window sub-components
- Manages overall layout and state coordination
- Handles scroll management and auto-scroll logic

#### ChatHeader

```typescript
interface ChatHeaderProps {
  otherUser: User;
  userPresence: UserPresence | null;
  isOnline: boolean;
  canCall: { canCall: boolean; reason?: string };
  onCallClick: () => void;
}
```

- Displays user info, avatar, and online status
- Shows call button with permission checking
- Handles user status text and last seen information

#### MessageList

```typescript
interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  error: string | null;
  onRetryMessage: (messageId: string) => void;
}
```

- Renders scrollable list of messages
- Handles loading and error states
- Manages empty state display
- Controls message grouping logic

#### MessageItem

```typescript
interface MessageItemProps {
  message: Message;
  isFromCurrentUser: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onRetry?: (messageId: string) => void;
}
```

- Renders individual message with proper styling
- Handles different message types (text, call events)
- Shows message status indicators
- Manages retry functionality for failed messages

#### TypingIndicator

```typescript
interface TypingIndicatorProps {
  typingUsers: string[];
  currentUserId: string;
}
```

- Shows animated typing indicator
- Handles multiple users typing
- Displays appropriate text based on typing user count

#### ChatInput

```typescript
interface ChatInputProps {
  conversationId: string;
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  placeholder?: string;
}
```

- Manages message input state
- Handles typing indicators
- Provides emoji and attachment buttons (placeholder)
- Manages form submission and keyboard shortcuts

### Conversation List Components

#### ConversationList (Main Container)

```typescript
interface ConversationListProps {
  // No props - uses store directly
}
```

- Orchestrates conversation list sub-components
- Manages overall layout and state coordination
- Handles search and filtering logic

#### ConversationListHeader

```typescript
interface ConversationListHeaderProps {
  totalUnreadCount: number;
  onStartConversation: () => void;
}
```

- Shows "Direct Messages" header with unread count
- Provides "+" button to start new conversations
- Displays section navigation

#### ConversationItem

```typescript
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onSelect: (conversationId: string) => void;
  onArchive?: (conversationId: string) => void;
}
```

- Renders individual conversation with user info
- Shows last message preview and timestamp
- Displays unread count badge
- Handles online status and typing indicators

#### UserSearchModal

```typescript
interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}
```

- Provides modal for searching and selecting users
- Handles friend list filtering
- Manages search input state

### Shared Components

#### UserAvatar

```typescript
interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  userPresence?: UserPresence | null;
  className?: string;
}
```

- Reusable avatar component with status indicator
- Supports different sizes
- Handles fallback initials
- Shows online status dot when enabled

#### MessagePreview

```typescript
interface MessagePreviewProps {
  message: Message | null;
  isFromCurrentUser: boolean;
  isTyping?: boolean;
  typingUserName?: string;
  unreadCount: number;
}
```

- Renders last message preview with proper formatting
- Handles different message types
- Shows typing indicator when applicable
- Applies unread styling

#### LoadingSpinner

```typescript
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

- Reusable loading spinner component
- Supports different sizes
- Consistent styling across the app

#### EmptyState

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

- Reusable empty state component
- Supports custom icons and actions
- Consistent messaging across different empty states

## Data Models

The refactoring will use existing data models from the messaging schema:

- `Message` - Individual message data
- `Conversation` - Conversation metadata
- `User` - User information
- `UserPresence` - User online status
- All existing TypeScript interfaces remain unchanged

## Error Handling

### Component-Level Error Boundaries

- Each major component will handle its own error states
- Loading states will be managed at the appropriate component level
- Error messages will be displayed inline where relevant

### Retry Mechanisms

- Failed message sending will show retry buttons
- Network errors will be handled gracefully
- Loading states will prevent duplicate actions

## Testing Strategy

### Component Testing Approach

1. **Unit Tests**: Each extracted component will have focused unit tests
2. **Integration Tests**: Test component interactions and data flow
3. **Visual Regression Tests**: Ensure UI remains unchanged
4. **Accessibility Tests**: Verify keyboard navigation and screen reader support

### Test Coverage Goals

- 90%+ coverage for new extracted components
- Maintain existing functionality through integration tests
- Test error states and edge cases
- Verify TypeScript type safety

### Testing Tools

- Jest for unit testing
- React Testing Library for component testing
- Mock messaging store for isolated testing
- Storybook for component documentation (future enhancement)

## Implementation Phases

### Phase 1: Shared Components

1. Extract `UserAvatar` component
2. Create `LoadingSpinner` component
3. Build `EmptyState` component
4. Implement `MessagePreview` component

### Phase 2: Chat Window Refactor

1. Extract `ChatHeader` component
2. Create `MessageItem` component
3. Build `TypingIndicator` component
4. Extract `ChatInput` component
5. Create `MessageList` container
6. Refactor main `ChatWindow` component

### Phase 3: Conversation List Refactor

1. Extract `ConversationItem` component
2. Create `ConversationListHeader` component
3. Extract `UserSearchModal` component
4. Refactor main `ConversationList` component

### Phase 4: Integration and Cleanup

1. Update imports and remove unused code
2. Verify all functionality works correctly
3. Clean up unused variables and imports
4. Update component exports

## Migration Strategy

### Backward Compatibility

- All existing props and interfaces will be maintained
- Store integration remains unchanged
- No breaking changes to parent components

### Gradual Migration

- Components will be extracted one at a time
- Each extraction will be tested independently
- Main components will be updated to use new sub-components
- Original functionality will be preserved throughout

### Rollback Plan

- Each component extraction will be a separate commit
- Easy rollback to previous working state if issues arise
- Comprehensive testing before each merge

## Performance Considerations

### Optimization Strategies

- Use React.memo for components that don't need frequent re-renders
- Optimize re-render cycles by proper prop passing
- Maintain existing scroll performance in message lists
- Preserve typing indicator performance

### Bundle Size Impact

- Component extraction should not significantly increase bundle size
- Tree shaking will remove unused code
- Shared components will reduce code duplication

## Accessibility

### Existing Accessibility Features

- Keyboard navigation support
- Screen reader compatibility
- Focus management
- ARIA labels and roles

### Maintained Standards

- All existing accessibility features will be preserved
- Component extraction will not break accessibility
- Focus management will remain intact
- Keyboard shortcuts will continue to work
