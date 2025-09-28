"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { reviewsAPI, type Review } from "@/lib/api";
import { TopAlert } from "@/components/TopAlert";
import { AlertCircleIcon } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { BookmarkButton } from "@/components/BookmarkButton";
import MapImage from "@/components/MapImage";
import { ReviewModal } from "@/components/ReviewModal";
import { POPULAR_NEIGHBORHOODS } from "@/lib/philadelphia";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
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
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

export default function ReviewsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<Review | null>(null);

  useEffect(() => {
    try {
      const authed = !!localStorage.getItem("rml_auth");
      if (!authed) {
        const next = encodeURIComponent(pathname || "/reviews");
        router.replace(`/signin?next=${next}`);
        return;
      }

      // Fetch reviews if authenticated
      fetchReviews();
    } catch {
      router.replace(`/signin?next=${encodeURIComponent(pathname || "/reviews")}`);
    }
  }, [router, pathname]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await reviewsAPI.list(50); // Get up to 50 reviews
      setReviews(data);
      setFilteredReviews(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load reviews';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter reviews based on search query and neighborhood
  useEffect(() => {
    let filtered = reviews;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(review =>
        review.landlord_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.property_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.formatted_address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by neighborhood
    if (selectedNeighborhood) {
      filtered = filtered.filter(review =>
        review.property_address?.toLowerCase().includes(selectedNeighborhood.toLowerCase()) ||
        review.formatted_address?.toLowerCase().includes(selectedNeighborhood.toLowerCase())
      );
    }

    setFilteredReviews(filtered);
  }, [searchQuery, selectedNeighborhood, reviews]);

  return (
    <main className="min-h-screen bg-gray-50 pt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div
          className="absolute inset-0 bg-cover bg-auto bg-no-repeat opacity-30"
          style={{
            backgroundImage: 'url(/reviews.png)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.3) 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.3) 80%, transparent 100%)'
          }}
        />
        <div className="main-top-content relative">


          <div className="relative z-10">
            <Reveal>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-black">Philadelphia Landlord Reviews</h1>
                <p className="mt-2 text-lg text-gray-600">Search Philly rentals by neighborhood, address, or landlord name</p>
              </div>
            </Reveal>

            <Reveal>
              <div className="mb-8">
                <div className="relative max-w-2xl mx-auto">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Fishtown, Northern Liberties, Graduate Hospital..."
                    className="w-full h-14 pl-6 pr-12 text-lg rounded-lg border-2 bg-white shadow-sm focus:outline-none focus:ring-2 border-[#00ac64]"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="mb-6">
                <div className="max-w-2xl mx-auto">
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => setSelectedNeighborhood("")}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${!selectedNeighborhood
                          ? 'bg-[#00ac64] text-white border-[#00ac64]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#00ac64]'
                        }`}
                    >
                      All Neighborhoods
                    </button>
                    {POPULAR_NEIGHBORHOODS.map((neighborhood) => (
                      <button
                        key={neighborhood}
                        onClick={() => setSelectedNeighborhood(neighborhood)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${selectedNeighborhood === neighborhood
                            ? 'bg-[#00ac64] text-white border-[#00ac64]'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#00ac64]'
                          }`}
                      >
                        {neighborhood}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ac64]"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        )}

        <TopAlert
          open={!!error}
          onOpenChange={(open) => !open && setError(null)}
          title="Failed to load reviews"
          description={
            error ? (
              <>
                <p>{error}</p>
                <button onClick={fetchReviews} className="mt-2 text-sm font-medium underline">
                  Try again
                </button>
              </>
            ) : undefined
          }
          variant="destructive"
          icon={<AlertCircleIcon className="text-red-600" />}
        />

        {!isLoading && !error && (
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredReviews.length} result{filteredReviews.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((review, idx) => (
              <Reveal key={review.id} delay={idx * 40}>
                <div
                  className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow cursor-pointer border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-black">{review.landlord_name}</h3>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.overall_rating} />
                      <BookmarkButton
                        reviewId={review.id}
                        isBookmarked={review.is_bookmarked || false}
                        size="sm"
                      />
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {review.formatted_address || review.property_address || 'Address not specified'}
                  </p>

                  {(review.formatted_address || review.property_address) && (
                    <div className="mb-4">
                      <MapImage
                        address={(review.formatted_address || review.property_address) as string}
                        className="w-full rounded-md border border-gray-200"
                        width={400}
                        height={250}
                        fov={90}
                        pitch={10}
                      />
                    </div>
                  )}

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

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {review.is_anonymous ? 'Anonymous' : review.author_email || 'User'}
                    </span>
                    <span>{formatDate(review.created_at)}</span>
                  </div>

                  <button
                    onClick={() => { setActiveReview(review); setIsModalOpen(true); }}
                    className="mt-4 w-full py-2 px-4 rounded-md text-sm font-medium border transition-colors bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                  >
                    View Full Review
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {!isLoading && !error && filteredReviews.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try searching with different keywords or check your spelling.</p>
          </div>
        )}

        {!isLoading && !error && reviews.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600">Be the first to submit a landlord review!</p>
          </div>
        )}
        <ReviewModal
          open={isModalOpen}
          onClose={() => { setIsModalOpen(false); setActiveReview(null); }}
          review={activeReview}
        />
      </div>
    </main>
  );
}
