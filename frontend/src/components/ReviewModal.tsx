"use client";

import React from "react";
import { type Review } from "@/lib/api";
import MapImage from "@/components/MapImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  review: Review | null;
}

function formatTenancyDate(dateString: string | null | undefined): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  } catch {
    return dateString; // Return original if parsing fails
  }
}

function formatTenancyPeriod(moveInDate: string | null | undefined, moveOutDate: string | null | undefined): string {
  const moveIn = formatTenancyDate(moveInDate) || "?";
  const moveOut = formatTenancyDate(moveOutDate) || "Present";

  return `${moveIn} — ${moveOut}`;
}

export function ReviewModal({ open, onClose, review }: ReviewModalProps) {
  if (!review) return null;

  const address = review.formatted_address || review.property_address;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-black">
            {review.landlord_name}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {address || "Address not specified"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5">
          {address && (
            <div className="rounded-md overflow-hidden border border-gray-200">
              <MapImage
                address={address}
                className="w-full"
                width={640}
                height={320}
                fov={90}
                pitch={10}
              />
            </div>
          )}

          <div className="space-y-3">
            <RatingRow label="Overall" value={review.overall_rating} />
            {review.maintenance_rating != null && (
              <RatingRow label="Maintenance" value={review.maintenance_rating} />
            )}
            {review.communication_rating != null && (
              <RatingRow label="Communication" value={review.communication_rating} />
            )}
            {review.respect_rating != null && (
              <RatingRow label="Respect" value={review.respect_rating} />
            )}
            {review.rent_value_rating != null && (
              <RatingRow label="Value" value={review.rent_value_rating} />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              {review.monthly_rent != null && (
                <p className="text-gray-700">
                  <span className="text-gray-500">Monthly rent:</span> ${review.monthly_rent}
                </p>
              )}
              {review.would_rent_again != null && (
                <p className="text-gray-700">
                  <span className="text-gray-500">Would rent again:</span>{" "}
                  {review.would_rent_again ? "Yes" : "No"}
                </p>
              )}
            </div>
            <div className="space-y-1">
              {(review.move_in_date || review.move_out_date) && (
                <p className="text-gray-700">
                  <span className="text-gray-500">Tenancy:</span>{" "}
                  {formatTenancyPeriod(review.move_in_date, review.move_out_date)}
                </p>
              )}
              <p className="text-gray-700">
                <span className="text-gray-500">Author:</span>{" "}
                {review.is_anonymous ? "Anonymous" : (review.author_email || "User")}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-black mb-1">Review</h4>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {review.review_text}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RatingRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 ${star <= Math.round(value) ? 'text-yellow-400' : 'text-gray-300'
                }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-sm font-semibold text-gray-800 min-w-[2rem]">
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
