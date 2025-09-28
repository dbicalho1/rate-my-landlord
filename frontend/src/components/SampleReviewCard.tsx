"use client";

import * as React from "react";

function Star({ filled }: { filled?: boolean }) {
  return (
    <svg
      className={`w-4 h-4 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function SampleReviewCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-black">Jane Smith</h3>
          <p className="text-xs text-gray-500">123 Main St, Springfield</p>
        </div>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(i => (
            <Star key={i} filled={i <= 5} />
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-700 line-clamp-3">
        "Responsive and fair. Maintenance issues were handled within a day and communication
        was always clear. I'd definitely rent again."
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>Anonymous</span>
        <span>2 weeks ago</span>
      </div>
    </div>
  );
}

