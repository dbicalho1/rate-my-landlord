"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export function WelcomeModal({ isOpen, onClose, email }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-black">
            🎉 Welcome back!
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Hello, <span className="font-semibold text-[#00ac64]">{email}</span>!
            <br />
            Great to see you again.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-[#00ac64]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500 text-center">
            You're all set to browse reviews and share your experiences.
          </p>
          <button
            onClick={onClose}
            className="mt-2 inline-flex items-center justify-center rounded-md px-6 py-2 text-sm font-semibold text-white bg-[#00ac64] hover:bg-[#008a52] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Get Started
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
