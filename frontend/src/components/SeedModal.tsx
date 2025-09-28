"use client";

import { useState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, DatabaseIcon, RefreshCwIcon } from "lucide-react";

interface SeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SeedModal({ isOpen, onClose }: SeedModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    output?: string;
    error?: string;
  } | null>(null);
  const [forceMode, setForceMode] = useState(false);

  const handleSeed = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setResult({
          success: false,
          message: "Authentication required",
          error: "You must be signed in to seed the database"
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/seed-database`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ force: forceMode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to seed database");
      }

      setResult({
        success: true,
        message: data.message,
        output: data.output
      });
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to seed database",
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setForceMode(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0">
              <DatabaseIcon className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-black">Seed Database</h2>
          </div>
          
          <p className="text-gray-700 mb-4">
            This will populate the database with sample reviews for development and testing purposes.
          </p>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={forceMode}
                onChange={(e) => setForceMode(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                disabled={isLoading}
              />
              <span className="text-gray-700">
                Force mode (clears existing sample data first)
              </span>
            </label>
          </div>

          {result && (
            <div className={`mb-4 p-4 rounded-lg border ${
              result.success 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}>
                    {result.message}
                  </p>
                  {result.output && (
                    <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                      {result.output}
                    </pre>
                  )}
                  {result.error && (
                    <p className="mt-1 text-sm text-red-600">{result.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSeed}
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white border border-green-700/50 shadow-none transition-colors hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
            >
              {isLoading ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <DatabaseIcon className="h-4 w-4" />
                  Seed Database
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
