"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSearchStore, SearchResult } from "@/components/store/search-store";
import { useMessagingStore } from "@/components/store/messaging-store";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onUserSelect?: (user: SearchResult) => void;
  onSearchResults?: (results: SearchResult[]) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  onUserSelect,
  onSearchResults,
  placeholder = "Search users...",
  className,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    query,
    suggestions,
    recentSearches,
    isLoadingSuggestions,
    setQuery,
    getSuggestions,
    clearSuggestions,
    addToRecentSearches,
    clearRecentSearches,
    searchUsers,
  } = useSearchStore();

  const { startConversation } = useMessagingStore();

  // Handle input changes with debounced suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim()) {
        getSuggestions(inputValue);
      } else {
        clearSuggestions();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue, getSuggestions, clearSuggestions]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setQuery(value);
    setIsOpen(true);
  };

  const handleSearch = async () => {
    if (!inputValue.trim()) return;

    await searchUsers(inputValue);
    const results = useSearchStore.getState().results;
    onSearchResults?.(results);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleUserSelect = (user: SearchResult) => {
    addToRecentSearches(user);
    onUserSelect?.(user);
    setInputValue("");
    setQuery("");
    setIsOpen(false);
    clearSuggestions();
  };

  const handleMessageUser = (user: SearchResult) => {
    startConversation(user.id);
    handleUserSelect(user);
  };

  const clearInput = () => {
    setInputValue("");
    setQuery("");
    clearSuggestions();
    inputRef.current?.focus();
  };

  const showSuggestions =
    isOpen && (suggestions.length > 0 || recentSearches.length > 0);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearInput}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* Loading state */}
          {isLoadingSuggestions && (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
              <span className="text-sm mt-2 block">Searching...</span>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                Suggestions
              </div>
              {suggestions.map((user) => (
                <UserSearchItem
                  key={user.id}
                  user={user}
                  onSelect={handleUserSelect}
                  onMessage={handleMessageUser}
                />
              ))}
            </div>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 &&
            !isLoadingSuggestions &&
            suggestions.length === 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Recent
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="h-auto p-0 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                {recentSearches.map((user) => (
                  <UserSearchItem
                    key={user.id}
                    user={user}
                    onSelect={handleUserSelect}
                    onMessage={handleMessageUser}
                  />
                ))}
              </div>
            )}

          {/* Empty state */}
          {!isLoadingSuggestions &&
            suggestions.length === 0 &&
            recentSearches.length === 0 &&
            inputValue.trim() && (
              <div className="p-4 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users found</p>
                <p className="text-xs mt-1">
                  Try searching with a different term
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

interface UserSearchItemProps {
  user: SearchResult;
  onSelect: (user: SearchResult) => void;
  onMessage: (user: SearchResult) => void;
}

function UserSearchItem({ user, onSelect, onMessage }: UserSearchItemProps) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer group">
      <div
        className="flex items-center gap-3 flex-1 min-w-0"
        onClick={() => onSelect(user)}
      >
        <UserAvatar user={user} size="sm" showStatus />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{user.name}</p>
            {user.isFriend && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                Friend
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            @{user.username}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onMessage(user);
          }}
          className="h-7 px-2 text-xs"
        >
          Message
        </Button>
      </div>
    </div>
  );
}
