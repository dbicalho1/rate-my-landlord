"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { reviewsAPI, type ReviewCreate } from "@/lib/api";
import { sanitizeString } from "@/lib/sanitize";
import { TopAlert } from "@/components/TopAlert";
import { AlertCircleIcon } from "lucide-react";
import { Reveal } from "@/components/Reveal";

type FormDataState = Partial<ReviewCreate>;

export default function SubmitPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Form state
  const [formData, setFormData] = useState<FormDataState>({
    landlord_name: '',
    property_address: '',
    overall_rating: 0,
    maintenance_rating: undefined,
    communication_rating: undefined,
    respect_rating: undefined,
    rent_value_rating: undefined,
    would_rent_again: undefined,
    monthly_rent: undefined,
    move_in_date: '',
    move_out_date: '',
    is_anonymous: false,
    review_text: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    try {
      const authed = !!localStorage.getItem("rml_auth");
      if (!authed) {
        const next = encodeURIComponent(pathname || "/submit");
        router.replace(`/signin?next=${next}`);
      }
    } catch {
      router.replace(`/signin?next=${encodeURIComponent(pathname || "/submit")}`);
    }
  }, [router, pathname]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let nextValue: any = value;

    if (type === 'checkbox') {
      nextValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      nextValue = value ? Number(value) : undefined;
    } else if (
      name === 'overall_rating' ||
      name === 'maintenance_rating' ||
      name === 'communication_rating' ||
      name === 'respect_rating' ||
      name === 'rent_value_rating'
    ) {
      nextValue = value === '' ? undefined : Number(value);
    } else if (name === 'would_rent_again') {
      nextValue = value === '' ? undefined : value === 'true';
    }

    setFormData(prev => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setShowValidation(false);

    try {
      // Validate required fields
      const missingLandlord = !formData.landlord_name?.trim();
      const missingOverall = !formData.overall_rating;
      const missingReview = !formData.review_text?.trim();

      if (missingLandlord || missingOverall || missingReview) {
        setShowValidation(true);
        setError('Please fill all required fields highlighted in red');
        // Focus the first invalid input
        if (missingLandlord) {
          (document.getElementById('landlord_name') as HTMLInputElement | null)?.focus();
        } else if (missingOverall) {
          (document.getElementById('overall_rating') as HTMLSelectElement | null)?.focus();
        } else if (missingReview) {
          (document.getElementById('review_text') as HTMLTextAreaElement | null)?.focus();
        }
        return;
      }

      if ((formData.review_text || '').length < 20) {
        setShowValidation(true);
        setError('Review must be at least 20 characters long');
        (document.getElementById('review_text') as HTMLTextAreaElement | null)?.focus();
        return;
      }

      // Clamp and sanitize just before submit
      const overall = Math.max(1, Math.min(5, Number(formData.overall_rating)));
      const reviewData: ReviewCreate = {
        landlord_name: sanitizeString(formData.landlord_name || ''),
        property_address: sanitizeString(formData.property_address || '') || undefined,
        overall_rating: overall,
        maintenance_rating: formData.maintenance_rating ? Math.max(1, Math.min(5, Number(formData.maintenance_rating))) : undefined,
        communication_rating: formData.communication_rating ? Math.max(1, Math.min(5, Number(formData.communication_rating))) : undefined,
        respect_rating: formData.respect_rating ? Math.max(1, Math.min(5, Number(formData.respect_rating))) : undefined,
        rent_value_rating: formData.rent_value_rating ? Math.max(1, Math.min(5, Number(formData.rent_value_rating))) : undefined,
        would_rent_again: typeof formData.would_rent_again === 'boolean' ? formData.would_rent_again : undefined,
        monthly_rent: formData.monthly_rent !== undefined && formData.monthly_rent !== null
          ? Number(formData.monthly_rent)
          : undefined,
        move_in_date: formData.move_in_date || undefined,
        move_out_date: formData.move_out_date || undefined,
        is_anonymous: !!formData.is_anonymous,
        review_text: sanitizeString(formData.review_text || ''),
      };

      await reviewsAPI.create(reviewData);

      // Redirect to reviews page on success
      window.location.href = '/reviews';
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit review";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to style inputs conditionally when invalid after submit
  const inputClasses = (invalid?: boolean) =>
    `mt-2 block w-full rounded-md border bg-white px-3 py-2 text-black placeholder-black/40 focus:outline-none focus:ring-2 ${invalid ? 'border-red-500 focus:ring-red-600' : 'border-[#00ac64] focus:ring-[#00ac64]'}`;
  const selectClasses = (invalid?: boolean) =>
    `mt-2 block w-full rounded-md border bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 ${invalid ? 'border-red-500 focus:ring-red-600' : 'border-[#00ac64] focus:ring-[#00ac64]'}`;
  const textareaClasses = inputClasses;

  const landlordInvalid = showValidation && !formData.landlord_name?.trim();
  const overallInvalid = showValidation && !formData.overall_rating;
  const reviewTooShort = showValidation && !!formData.review_text && formData.review_text.length > 0 && formData.review_text.length < 20;
  const reviewInvalid = showValidation && (!formData.review_text?.trim() || reviewTooShort);

  return (
    <main className="min-h-screen bg-white pt-20">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white border-0" style={{ backgroundColor: '#00ac64' }}>Share your experience</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-black">Submit a Review</h1>
            <p className="mt-2 text-black/70">Help renters make informed decisions by sharing an honest review.</p>
          </div>
        </Reveal>

        <TopAlert
          open={!!error}
          onOpenChange={(open) => !open && setError(null)}
          title="Submission error"
          description={error || undefined}
          variant="destructive"
          icon={<AlertCircleIcon className="text-red-600" />}
        />

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">

          <div>
            <label htmlFor="landlord_name" className="block text-sm font-semibold text-black">
              Landlord name <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="landlord_name"
              name="landlord_name"
              type="text"
              required
              value={formData.landlord_name}
              onChange={handleInputChange}
              placeholder="e.g. John Doe"
              aria-invalid={landlordInvalid || undefined}
              className={inputClasses(landlordInvalid)}
            />
          </div>

          <div>
            <label htmlFor="property_address" className="block text-sm font-semibold text-black">
              Property address
            </label>
            <input
              id="property_address"
              name="property_address"
              type="text"
              value={formData.property_address}
              onChange={handleInputChange}
              placeholder="e.g. 123 Main St, Springfield, IL"
              className="mt-2 block w-full rounded-md border bg-white px-3 py-2 text-black placeholder-black/40 focus:outline-none focus:ring-2 border-[#00ac64]"
            />
          </div>

          

          <div>
            <label htmlFor="overall_rating" className="block text-sm font-semibold text-black">
              Overall rating <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <select
              id="overall_rating"
              name="overall_rating"
              required
              value={formData.overall_rating}
              onChange={handleInputChange}
              aria-invalid={overallInvalid || undefined}
              className={selectClasses(overallInvalid)}
            >
              <option value={0} disabled>Choose a rating</option>
              <option value={1}>1 - Poor</option>
              <option value={2}>2 - Fair</option>
              <option value={3}>3 - Good</option>
              <option value={4}>4 - Very Good</option>
              <option value={5}>5 - Excellent</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="maintenance_rating" className="block text-sm font-semibold text-black">
                Maintenance
              </label>
              <select
                id="maintenance_rating"
                name="maintenance_rating"
                value={formData.maintenance_rating || ''}
                onChange={handleInputChange}
                className={selectClasses(false)}
              >
                <option value="">Not rated</option>
                <option value={1}>1 - Poor</option>
                <option value={2}>2 - Fair</option>
                <option value={3}>3 - Good</option>
                <option value={4}>4 - Very Good</option>
                <option value={5}>5 - Excellent</option>
              </select>
            </div>
            <div>
              <label htmlFor="communication_rating" className="block text-sm font-semibold text-black">
                Communication
              </label>
              <select
                id="communication_rating"
                name="communication_rating"
                value={formData.communication_rating || ''}
                onChange={handleInputChange}
                className={selectClasses(false)}
              >
                <option value="">Not rated</option>
                <option value={1}>1 - Poor</option>
                <option value={2}>2 - Fair</option>
                <option value={3}>3 - Good</option>
                <option value={4}>4 - Very Good</option>
                <option value={5}>5 - Excellent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="respect_rating" className="block text-sm font-semibold text-black">
                Respect & Fairness
              </label>
              <select
                id="respect_rating"
                name="respect_rating"
                value={formData.respect_rating || ''}
                onChange={handleInputChange}
                className={selectClasses(false)}
              >
                <option value="">Not rated</option>
                <option value={1}>1 - Poor</option>
                <option value={2}>2 - Fair</option>
                <option value={3}>3 - Good</option>
                <option value={4}>4 - Very Good</option>
                <option value={5}>5 - Excellent</option>
              </select>
            </div>
            <div>
              <label htmlFor="rent_value_rating" className="block text-sm font-semibold text-black">
                Rent Value
              </label>
              <select
                id="rent_value_rating"
                name="rent_value_rating"
                value={formData.rent_value_rating || ''}
                onChange={handleInputChange}
                className="mt-2 block w-full rounded-md border bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 border-[#00ac64]"
              >
                <option value="">Not rated</option>
                <option value={1}>1 - Poor</option>
                <option value={2}>2 - Fair</option>
                <option value={3}>3 - Good</option>
                <option value={4}>4 - Very Good</option>
                <option value={5}>5 - Excellent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="monthly_rent" className="block text-sm font-semibold text-black">
                Monthly Rent ($)
              </label>
              <input
                id="monthly_rent"
                name="monthly_rent"
                type="number"
                min="0"
                value={formData.monthly_rent || ''}
                onChange={handleInputChange}
                placeholder="e.g. 1500"
                className={inputClasses(false)}
              />
            </div>
            <div>
              <label htmlFor="would_rent_again" className="block text-sm font-semibold text-black">
                Would rent again?
              </label>
              <select
                id="would_rent_again"
                name="would_rent_again"
                value={formData.would_rent_again === undefined ? '' : String(formData.would_rent_again)}
                onChange={handleInputChange}
                className={selectClasses(false)}
              >
                <option value="">Not specified</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="move_in_date" className="block text-sm font-semibold text-black">
                Move-in date
              </label>
              <input
                id="move_in_date"
                name="move_in_date"
                type="date"
                value={formData.move_in_date}
                onChange={handleInputChange}
                className={inputClasses(false)}
              />
            </div>
            <div>
              <label htmlFor="move_out_date" className="block text-sm font-semibold text-black">
                Move-out date
              </label>
              <input
                id="move_out_date"
                name="move_out_date"
                type="date"
                value={formData.move_out_date}
                onChange={handleInputChange}
                className={inputClasses(false)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="review_text" className="block text-sm font-semibold text-black">
              Review <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <textarea
              id="review_text"
              name="review_text"
              rows={6}
              required
              value={formData.review_text}
              onChange={handleInputChange}
              placeholder="What should renters know? Consider responsiveness, maintenance, communication, fairness, etc. (minimum 20 characters)"
              aria-invalid={reviewInvalid || undefined}
              className={textareaClasses(reviewInvalid)}
            />
            <p className="mt-1 text-xs text-gray-600">{formData.review_text?.length || 0}/20 characters minimum</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_anonymous"
              name="is_anonymous"
              type="checkbox"
              checked={formData.is_anonymous}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border text-black"
              style={{ borderColor: '#00ac64', accentColor: '#00ac64' }}
            />
            <label htmlFor="is_anonymous" className="text-sm text-black">
              Post anonymously (your email won't be shown)
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-base font-semibold text-white border-0 transition-colors bg-[#00ac64] hover:bg-[#008a52] disabled:bg-gray-400 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {isLoading ? "Submitting..." : "Submit Review"}
            </button>
            <Link href="/" className="text-sm font-medium underline underline-offset-4 hover:opacity-80" style={{ color: '#00ac64', textDecorationColor: '#00ac64' }}>
              Cancel
            </Link>
          </div>
        </form>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold border transition-colors hover:opacity-80"
            style={{ borderColor: '#00ac64', color: '#00ac64' }}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
