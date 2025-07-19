"use client";

import { useState, useEffect } from "react";
import { Search, Users, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResults } from "@/components/search/search-results";
import { EmptyState } from "@/components/shared/empty-state";
import { useSearchStore, SearchResult } from "@/components/store/search-store";

export default function SearchPage() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const {
    query,
    results,
    recentSearches,
    isSearching,
    clearResults,
    clearRecentSearches,
  } = useSearchStore();

  const hasResults = results.length > 0;
  const hasRecentSearches = recentSearches.length > 0;
  const showResults = query.trim() && (hasResults || !isSearching);

  const handleSearchResults = (searchResults: SearchResult[]) => {
    // Results are automatically handled by the store
  };

  const handleUserSelect = (user: SearchResult) => {
    // Handle user selection (e.g., navigate to profile, start conversation)
    console.log("User selected:", user);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Search Users</h1>
          </div>

          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearResults}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Search bar */}
        <div className="px-4 pb-4">
          <SearchBar
            onSearchResults={handleSearchResults}
            onUserSelect={handleUserSelect}
            placeholder="Search for users by name or username..."
            className="max-w-2xl"
          />
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {activeFilters.map((filter) => (
                <Badge key={filter} variant="secondary" className="text-xs">
                  {filter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() =>
                      setActiveFilters((prev) =>
                        prev.filter((f) => f !== filter)
                      )
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs h-auto p-1"
              >
                Clear all
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 max-w-6xl mx-auto">
          {showResults ? (
            <SearchResults onUserSelect={handleUserSelect} className="w-full" />
          ) : (
            <div className="space-y-8">
              {/* Welcome state */}
              {!query && (
                <div className="text-center py-12">
                  <EmptyState
                    icon={<Search className="h-16 w-16" />}
                    title="Discover Users"
                    description="Search for other users to connect, chat, and make friends"
                  />
                </div>
              )}

              {/* Recent searches */}
              {hasRecentSearches && !query && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Recent Searches
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="text-muted-foreground"
                    >
                      Clear all
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {recentSearches.slice(0, 6).map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        </div>
                        {user.isFriend && (
                          <Badge variant="secondary" className="text-xs">
                            Friend
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Search tips */}
              <Card className="p-6">
                <h2 className="text-lg font-medium mb-4">Search Tips</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium text-sm mb-2">Find users by:</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Full name or display name</li>
                      <li>• Username (with or without @)</li>
                      <li>• Partial matches</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-2">
                      Filter results by:
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Friends only</li>
                      <li>• Online status</li>
                      <li>• Recent activity</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
