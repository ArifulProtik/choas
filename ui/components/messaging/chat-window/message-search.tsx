"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Message } from "@/lib/schemas/messaging";

interface MessageSearchProps {
  messages: Message[];
  onSearchResults: (results: Message[], currentIndex: number) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  messages,
  onSearchResults,
  onClose,
  isVisible,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when search becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Search messages when query changes
  useEffect(() => {
    if (!query.trim()) {
      const newResults: Message[] = [];
      setResults(newResults);
      setCurrentIndex(0);
      onSearchResults(newResults, 0);
      return;
    }

    const searchResults = messages.filter((message) =>
      message.content.toLowerCase().includes(query.toLowerCase())
    );

    setResults(searchResults);
    setCurrentIndex(0);
    onSearchResults(searchResults, 0);
  }, [query, messages, onSearchResults]);

  const handlePrevious = () => {
    if (results.length === 0) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
    setCurrentIndex(newIndex);
    onSearchResults(results, newIndex);
  };

  const handleNext = () => {
    if (results.length === 0) return;
    const newIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onSearchResults(results, newIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevious();
      } else {
        handleNext();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2 p-3 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search messages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4"
        />
      </div>

      {results.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>
            {currentIndex + 1} of {results.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={results.length === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={results.length === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
