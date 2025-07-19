"use client";

import { create } from "zustand";
import { User } from "@/lib/schemas/user";

export interface SearchResult extends User {
  isFriend?: boolean;
  hasConversation?: boolean;
  isBlocked?: boolean;
}

interface SearchState {
  // Search state
  query: string;
  results: SearchResult[];
  suggestions: SearchResult[];
  isSearching: boolean;
  isLoadingSuggestions: boolean;
  recentSearches: SearchResult[];

  // Search actions
  setQuery: (query: string) => void;
  searchUsers: (query: string) => Promise<void>;
  getSuggestions: (query: string) => Promise<void>;
  clearResults: () => void;
  clearSuggestions: () => void;
  addToRecentSearches: (user: SearchResult) => void;
  clearRecentSearches: () => void;

  // Filter actions
  filterResults: (filters: SearchFilters) => SearchResult[];
  sortResults: (sortBy: SearchSortBy) => SearchResult[];
}

export interface SearchFilters {
  showFriendsOnly?: boolean;
  showOnlineOnly?: boolean;
  excludeBlocked?: boolean;
}

export type SearchSortBy = "relevance" | "name" | "recent" | "online";

export const useSearchStore = create<SearchState>((set, get) => ({
  // Initial state
  query: "",
  results: [],
  suggestions: [],
  isSearching: false,
  isLoadingSuggestions: false,
  recentSearches: [],

  // Search actions
  setQuery: (query: string) => {
    set({ query });

    // Clear suggestions if query is empty
    if (!query.trim()) {
      set({ suggestions: [] });
    }
  },

  searchUsers: async (query: string) => {
    if (!query.trim()) {
      set({ results: [], isSearching: false });
      return;
    }

    set({ isSearching: true });

    try {
      // Mock API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Mock search results
      const mockResults: SearchResult[] = [
        {
          id: "1",
          name: "John Doe",
          username: "johndoe",
          email: "john@example.com",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
          isFriend: false,
          hasConversation: false,
          isBlocked: false,
        },
        {
          id: "2",
          name: "Jane Smith",
          username: "janesmith",
          email: "jane@example.com",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
          isFriend: true,
          hasConversation: true,
          isBlocked: false,
        },
        {
          id: "3",
          name: "Bob Wilson",
          username: "bobwilson",
          email: "bob@example.com",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
          isFriend: false,
          hasConversation: false,
          isBlocked: false,
        },
      ].filter(
        (user) =>
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.username.toLowerCase().includes(query.toLowerCase())
      );

      set({ results: mockResults, isSearching: false });
    } catch (error) {
      console.error("Search failed:", error);
      set({ results: [], isSearching: false });
    }
  },

  getSuggestions: async (query: string) => {
    if (!query.trim()) {
      set({ suggestions: [] });
      return;
    }

    set({ isLoadingSuggestions: true });

    try {
      // Mock API call for suggestions
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Mock suggestions (subset of search results)
      const mockSuggestions: SearchResult[] = [
        {
          id: "1",
          name: "John Doe",
          username: "johndoe",
          email: "john@example.com",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
          isFriend: false,
          hasConversation: false,
          isBlocked: false,
        },
        {
          id: "2",
          name: "Jane Smith",
          username: "janesmith",
          email: "jane@example.com",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
          isFriend: true,
          hasConversation: true,
          isBlocked: false,
        },
      ]
        .filter(
          (user) =>
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.username.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5); // Limit suggestions

      set({ suggestions: mockSuggestions, isLoadingSuggestions: false });
    } catch (error) {
      console.error("Suggestions failed:", error);
      set({ suggestions: [], isLoadingSuggestions: false });
    }
  },

  clearResults: () => set({ results: [], query: "" }),

  clearSuggestions: () => set({ suggestions: [] }),

  addToRecentSearches: (user: SearchResult) => {
    const { recentSearches } = get();
    const filtered = recentSearches.filter((u) => u.id !== user.id);
    const updated = [user, ...filtered].slice(0, 10); // Keep last 10
    set({ recentSearches: updated });
  },

  clearRecentSearches: () => set({ recentSearches: [] }),

  filterResults: (filters: SearchFilters) => {
    const { results } = get();

    return results.filter((user) => {
      if (filters.showFriendsOnly && !user.isFriend) return false;
      if (filters.excludeBlocked && user.isBlocked) return false;
      // Note: showOnlineOnly would require presence data
      return true;
    });
  },

  sortResults: (sortBy: SearchSortBy) => {
    const { results } = get();

    const sorted = [...results].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "recent":
          // Would need recent interaction data
          return 0;
        case "online":
          // Would need presence data
          return 0;
        case "relevance":
        default:
          // Friends first, then by name
          if (a.isFriend && !b.isFriend) return -1;
          if (!a.isFriend && b.isFriend) return 1;
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  },
}));
