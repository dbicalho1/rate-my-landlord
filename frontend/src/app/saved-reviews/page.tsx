"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { bookmarksAPI, isAuthenticated, type Bookmark } from "@/lib/api";
import { BookmarkButton } from "@/components/BookmarkButton";
import { Reveal } from "@/components/Reveal";
import { TopAlert } from "@/components/TopAlert";
import { AlertCircleIcon, SearchIcon } from "lucide-react";
import { ReviewModal } from "@/components/ReviewModal";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) !== 1 ? 's' : ''} ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diffInDays / 365)} year${Math.floor(diffInDays / 365) !== 1 ? 's' : ''} ago`;
}

export default function SavedReviewsPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<BookmarksReview | null>(null);

  // Helper type to avoid importing Review; derive from Bookmark["review"]
  type BookmarksReview = Bookmark["review"];

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bookmarksAPI.list();
      setBookmarks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load saved reviews';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmarkRemove = (reviewId: number) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.review.id !== reviewId));
  };

  useEffect(() => {
    // Check authentication
    try {
      if (!isAuthenticated()) {
        const next = encodeURIComponent('/saved-reviews');
        router.replace(`/signin?next=${next}`);
        return;
      }

      // Fetch bookmarks if authenticated
      fetchBookmarks();
    } catch {
      // If auth check fails, redirect to signin
      const next = encodeURIComponent('/saved-reviews');
      router.replace(`/signin?next=${next}`);
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50 pt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <Reveal>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-black">Saved Reviews</h1>
            <p className="mt-2 text-lg text-gray-600">Reviews you've bookmarked for later</p>
          </div>
        </Reveal>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ac64]"></div>
            <p className="mt-4 text-gray-600">Loading saved reviews...</p>
          </div>
        )}

        <TopAlert
          open={!!error}
          onOpenChange={(open) => !open && setError(null)}
          title="Failed to load saved reviews"
          description={
            error ? (
              <>
                <p>{error}</p>
                <button onClick={fetchBookmarks} className="mt-2 text-sm font-medium underline">
                  Try again
                </button>
              </>
            ) : undefined
          }
          variant="destructive"
          icon={<AlertCircleIcon className="text-red-600" />}
        />

        {!isLoading && !error && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {bookmarks.length} saved review{bookmarks.length !== 1 ? 's' : ''}
              </p>
              <Link
                href="/reviews"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#00ac64] hover:bg-[#008a52] transition-colors"
              >
                <SearchIcon className="w-4 h-4" />
                Browse Reviews
              </Link>
            </div>

            {bookmarks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarks.map((bookmark, idx) => {
                  const review = bookmark.review;
                  return (
                    <Reveal key={bookmark.id} delay={idx * 40}>
                      <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-black">{review.landlord_name}</h3>
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.overall_rating} />
                            <BookmarkButton
                              reviewId={review.id}
                              isBookmarked={true}
                              size="sm"
                              onToggle={(isBookmarked) => {
                                if (!isBookmarked) {
                                  handleBookmarkRemove(review.id);
                                }
                              }}
                            />
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {review.formatted_address || review.property_address || 'Address not specified'}
                        </p>

                        <div className="space-y-2 mb-4">
                          {review.maintenance_rating && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Maintenance:</span>
                              <StarRating rating={review.maintenance_rating} />
                            </div>
                          )}
                          {review.communication_rating && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Communication:</span>
                              <StarRating rating={review.communication_rating} />
                            </div>
                          )}
                        </div>

                        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                          {review.review_text}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>
                            {review.is_anonymous ? 'Anonymous' : review.author_email || 'User'}
                          </span>
                          <span>{formatDate(review.created_at)}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                          <span>Saved {formatDate(bookmark.created_at)}</span>
                        </div>

                        <button
                          onClick={() => { setActiveReview(review); setIsModalOpen(true); }}
                          className="w-full py-2 px-4 rounded-md text-sm font-medium border transition-colors bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                        >
                          View Full Review
                        </button>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved reviews</h3>
                <p className="text-gray-600 mb-4">You haven't bookmarked any reviews yet.</p>
                <Link
                  href="/reviews"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#00ac64] hover:bg-[#008a52] transition-colors"
                >
                  <SearchIcon className="w-4 h-4" />
                  Browse Reviews to Save
                </Link>
              </div>
            )}
          </>
        )}
      </div>
      <ReviewModal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setActiveReview(null); }}
        review={activeReview}
      />
    </main>
  );
}
