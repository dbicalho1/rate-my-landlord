"use client";

import { useState } from "react";
import { BookmarkIcon } from "lucide-react";
import { bookmarksAPI } from "@/lib/api";

interface BookmarkButtonProps {
  reviewId: number;
  isBookmarked: boolean;
  onToggle?: (isBookmarked: boolean) => void;
  size?: "sm" | "md" | "lg";
}

export function BookmarkButton({ 
  reviewId, 
  isBookmarked: initialBookmarked, 
  onToggle,
  size = "md" 
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    try {
      setIsLoading(true);
      
      if (isBookmarked) {
        await bookmarksAPI.remove(reviewId);
        setIsBookmarked(false);
        onToggle?.(false);
      } else {
        await bookmarksAPI.create(reviewId);
        setIsBookmarked(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      // You could add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  const buttonSizeClasses = {
    sm: "p-1",
    md: "p-2",
    lg: "p-3"
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`${buttonSizeClasses[size]} rounded-full transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <BookmarkIcon 
        className={`${sizeClasses[size]} transition-colors ${
          isBookmarked 
            ? "text-[#00ac64] fill-current" 
            : "text-gray-400 hover:text-[#00ac64]"
        }`}
      />
    </button>
  );
}
