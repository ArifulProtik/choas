"use client";

import { useState } from "react";
import {
  MessageCircle,
  UserPlus,
  UserCheck,
  UserX,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  useSearchStore,
  SearchResult,
  SearchFilters,
  SearchSortBy,
} from "@/components/store/search-store";
import { useMessagingStore } from "@/components/store/messaging-store";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
  results?: SearchResult[];
  isLoading?: boolean;
  onUserSelect?: (user: SearchResult) => void;
  className?: string;
}

export function SearchResults({
  results: propResults,
  isLoading: propIsLoading,
  onUserSelect,
  className,
}: SearchResultsProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<SearchSortBy>("relevance");

  const {
    results: storeResults,
    isSearching,
    query,
    filterResults,
    sortResults,
  } = useSearchStore();

  const { startConversation } = useMessagingStore();

  // Use prop results if provided, otherwise use store results
  const results = propResults || storeResults;
  const isLoading = propIsLoading !== undefined ? propIsLoading : isSearching;

  // Apply filters and sorting
  const filteredResults = filterResults(filters);
  const sortedResults = sortResults(sortBy);
  const displayResults = propResults
    ? results
    : sortedResults.length > 0
    ? sortedResults
    : filteredResults;

  const handleMessageUser = (user: SearchResult) => {
    startConversation(user.id);
    onUserSelect?.(user);
  };

  const handleAddFriend = (user: SearchResult) => {
    // TODO: Implement friend request functionality
    console.log("Add friend:", user);
  };

  const handleViewProfile = (user: SearchResult) => {
    // TODO: Implement profile view
    console.log("View profile:", user);
    onUserSelect?.(user);
  };

  const handleBlockUser = (user: SearchResult) => {
    // TODO: Implement block functionality
    console.log("Block user:", user);
  };

  const toggleFilter = (key: keyof SearchFilters) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <LoadingSpinner />
        <div className="text-center text-muted-foreground">
          <p>Searching users...</p>
        </div>
      </div>
    );
  }

  if (!query && !propResults) {
    return (
      <div className={cn("", className)}>
        <EmptyState
          icon={<Filter className="h-12 w-12" />}
          title="Search for users"
          description="Enter a name or username to find other users"
        />
      </div>
    );
  }

  if (displayResults.length === 0) {
    return (
      <div className={cn("", className)}>
        <EmptyState
          icon={<UserX className="h-12 w-12" />}
          title="No users found"
          description={`No users match "${query}". Try a different search term.`}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search header with filters and sorting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">
            {displayResults.length} user{displayResults.length !== 1 ? "s" : ""}{" "}
            found
          </h3>
          {query && (
            <Badge variant="secondary" className="text-xs">
              "{query}"
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleFilter("showFriendsOnly")}>
                <UserCheck className="h-4 w-4 mr-2" />
                Friends only
                {filters.showFriendsOnly && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleFilter("showOnlineOnly")}>
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2 ml-1"></div>
                Online only
                {filters.showOnlineOnly && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleFilter("excludeBlocked")}>
                <UserX className="h-4 w-4 mr-2" />
                Exclude blocked
                {filters.excludeBlocked && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort: {sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("relevance")}>
                Relevance{" "}
                {sortBy === "relevance" && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                Name {sortBy === "name" && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("online")}>
                Online status{" "}
                {sortBy === "online" && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("recent")}>
                Recent activity{" "}
                {sortBy === "recent" && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayResults.map((user) => (
          <UserResultCard
            key={user.id}
            user={user}
            onMessage={handleMessageUser}
            onAddFriend={handleAddFriend}
            onViewProfile={handleViewProfile}
            onBlock={handleBlockUser}
          />
        ))}
      </div>
    </div>
  );
}

interface UserResultCardProps {
  user: SearchResult;
  onMessage: (user: SearchResult) => void;
  onAddFriend: (user: SearchResult) => void;
  onViewProfile: (user: SearchResult) => void;
  onBlock: (user: SearchResult) => void;
}

function UserResultCard({
  user,
  onMessage,
  onAddFriend,
  onViewProfile,
  onBlock,
}: UserResultCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="md" showStatus />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{user.name}</h4>
            <p className="text-xs text-muted-foreground truncate">
              @{user.username}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewProfile(user)}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onBlock(user)}
              className="text-destructive"
            >
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* User bio/description if available */}
      {user.bio && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {user.bio}
        </p>
      )}

      {/* Status badges */}
      <div className="flex items-center gap-1 mb-3">
        {user.isFriend && (
          <Badge variant="secondary" className="text-xs">
            <UserCheck className="h-3 w-3 mr-1" />
            Friend
          </Badge>
        )}
        {user.hasConversation && (
          <Badge variant="outline" className="text-xs">
            <MessageCircle className="h-3 w-3 mr-1" />
            Chat
          </Badge>
        )}
        {user.isBlocked && (
          <Badge variant="destructive" className="text-xs">
            <UserX className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onMessage(user)}
          className="flex-1"
          disabled={user.isBlocked}
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          Message
        </Button>

        {!user.isFriend && !user.isBlocked && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddFriend(user)}
            className="flex-1"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Add Friend
          </Button>
        )}
      </div>
    </Card>
  );
}
