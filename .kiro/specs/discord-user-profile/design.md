# Design Document

## Overview

The Discord-style user profile component will be redesigned to closely match Discord's DM user profile panel. The component will feature a dark theme, proper visual hierarchy, and interactive elements that mirror Discord's user experience. The design focuses on maintaining the existing React component structure while updating the visual presentation and adding new sections.

## Architecture

The component will maintain its current React functional component architecture with the following enhancements:

- **Component Structure**: Single functional component with clear section divisions
- **State Management**: Utilize existing Zustand stores for user data and messaging state
- **Styling**: Tailwind CSS classes matching Discord's design system
- **Props Interface**: Maintain existing UserProfileProps with potential extensions

## Components and Interfaces

### Main Component Structure

```typescript
interface UserProfileProps {
  user: User;
  onClose?: () => void;
}

interface VoiceChannelInfo {
  channelName: string;
  participants: User[];
  isUserInChannel: boolean;
}

interface UserBio {
  aboutMe?: string;
  memberSince: Date;
}
```

### Section Components

1. **Header Section**

   - User action buttons (settings, more options)
   - Dark background with proper button styling

2. **Avatar Section**

   - Large circular avatar (80-100px)
   - Status indicator with proper positioning
   - Discord-style visual treatment

3. **User Info Section**

   - Username with proper typography
   - Discriminator/handle display
   - Status badges and verification indicators

4. **Voice Section** (conditional)

   - "In voice" header
   - Channel information with participant avatars
   - Join Voice button

5. **About Me Section** (conditional)

   - Bio text with proper text wrapping
   - Member since information

6. **Mutual Connections Section**

   - Mutual Servers with count and arrow
   - Mutual Friends with count and arrow
   - Hover states and click handlers

7. **Footer Section**
   - View Full Profile button

## Data Models

### Enhanced User Model Usage

```typescript
interface ExtendedUserProfile {
  user: User;
  bio?: string;
  voiceChannel?: VoiceChannelInfo;
  mutualServers: number;
  mutualFriends: number;
  memberSince: Date;
}
```

### Voice Channel Model

```typescript
interface VoiceChannelInfo {
  id: string;
  name: string;
  participants: {
    user: User;
    avatar: string;
  }[];
  maxParticipants?: number;
}
```

## Visual Design Specifications

### Color Scheme (shadcn/ui Theme)

- Background: `background` (bg-background)
- Secondary Background: `muted` (bg-muted)
- Text Primary: `foreground` (text-foreground)
- Text Secondary: `muted-foreground` (text-muted-foreground)
- Accent: `primary` (bg-primary)
- Hover States: `accent` (hover:bg-accent)

### Typography

- Username: `text-xl font-semibold text-foreground`
- Discriminator: `text-sm text-muted-foreground`
- Section Headers: `text-sm font-medium text-foreground`
- Body Text: `text-sm text-muted-foreground`

### Spacing and Layout

- Component Width: `320px` (w-80)
- Section Padding: `16px` (p-4)
- Avatar Size: `80px` (h-20 w-20)
- Status Indicator: `16px` (h-4 w-4)
- Button Heights: `32px` (h-8)

### Interactive Elements

- Hover transitions: `transition-colors duration-200`
- Button hover states with background color changes
- Clickable sections with proper cursor and hover feedback

## Component Layout Structure

```
┌─────────────────────────────────┐
│ Header (Settings, More Options) │
├─────────────────────────────────┤
│                                 │
│        Avatar + Status          │
│                                 │
├─────────────────────────────────┤
│     Username + Discriminator    │
│         Status Badges           │
├─────────────────────────────────┤
│         In Voice (if active)    │
│    Channel Info + Join Button   │
├─────────────────────────────────┤
│           About Me              │
│        Bio + Member Since       │
├─────────────────────────────────┤
│       Mutual Servers →          │
│       Mutual Friends →          │
├─────────────────────────────────┤
│      View Full Profile          │
└─────────────────────────────────┘
```

## Error Handling

### Missing Data Scenarios

- **No Avatar**: Display initials fallback with proper styling
- **No Bio**: Hide About Me section entirely
- **No Voice Channel**: Hide voice section
- **Zero Mutual Connections**: Show "0" or hide sections based on UX preference

### Loading States

- Skeleton loading for avatar and user information
- Graceful degradation for missing optional data

### Error Boundaries

- Component-level error handling for data fetching failures
- Fallback UI for critical errors

## Testing Strategy

### Unit Tests

- Component rendering with various user data scenarios
- Conditional section display logic
- Click handler functionality
- Accessibility compliance

### Integration Tests

- Store integration for user data and presence
- Voice channel data integration
- Navigation and routing integration

### Visual Regression Tests

- Screenshot comparisons for Discord design accuracy
- Responsive behavior testing
- Theme consistency validation

### Accessibility Tests

- Screen reader compatibility
- Keyboard navigation
- Color contrast validation
- ARIA label verification

## Performance Considerations

### Optimization Strategies

- Memoization of expensive calculations (mutual friends/servers)
- Lazy loading of optional data (bio, voice info)
- Efficient re-rendering with React.memo if needed

### Bundle Size

- Minimize additional dependencies
- Reuse existing UI components and utilities
- Optimize icon usage

## Implementation Notes

### Existing Code Reuse

- Maintain existing Avatar, Button, and ScrollArea components
- Utilize current store patterns and utilities
- Preserve existing TypeScript interfaces where possible

### New Dependencies

- No additional external dependencies required
- Leverage existing Tailwind CSS and Lucide icons
- Use current component library (shadcn/ui)

### Migration Strategy

- Update component in place to maintain existing usage
- Ensure backward compatibility with current props
- Test integration with existing parent components
