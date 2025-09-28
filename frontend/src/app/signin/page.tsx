"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState, useEffect, Suspense } from "react";
import { sanitizeEmail, sanitizeString } from "@/lib/sanitize";
import { authAPI, setAuthToken, type User, isAuthenticated } from "@/lib/api";
import { WelcomeModal } from "@/components/WelcomeModal";
import { TopAlert } from "@/components/TopAlert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

function SignInContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<User | null>(null);
  const [alreadyAuthed, setAlreadyAuthed] = useState(false);

  const title = useMemo(() => (mode === "signin" ? "Sign in" : "Create account"), [mode]);
  const badge = useMemo(() => (mode === "signin" ? "Welcome back" : "Join us"), [mode]);

  const switchMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  // Detect if the user is already authenticated and surface a success Alert
  // without altering existing redirect behavior.
  useEffect(() => {
    try {
      setAlreadyAuthed(isAuthenticated());
    } catch {
      setAlreadyAuthed(false);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanEmail = sanitizeEmail(email);
      const cleanPassword = sanitizeString(password);
      const cleanConfirm = sanitizeString(confirmPassword);

      if (!cleanEmail) {
        setError("Please enter a valid email.");
        return;
      }

      if (cleanPassword.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (mode === "signup" && cleanPassword !== cleanConfirm) {
        setError("Passwords do not match.");
        return;
      }

      let tokenResponse;
      if (mode === "signup") {
        // Create new account
        await authAPI.signup({ email: cleanEmail, password: cleanPassword });
        // After signup, automatically sign in
        tokenResponse = await authAPI.login(cleanEmail, cleanPassword);
        setAuthToken(tokenResponse.access_token);
      } else {
        // Sign in
        tokenResponse = await authAPI.login(cleanEmail, cleanPassword);
        setAuthToken(tokenResponse.access_token);
      }

      // Show welcome modal if signin and user info is available
      if (mode === "signin" && tokenResponse.user) {
        setWelcomeUser(tokenResponse.user);
        setShowWelcomeModal(true);
      } else {
        // For signup or if no user info, redirect immediately
        const next = searchParams.get("next") || "/reviews";
        const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/reviews";
        window.location.href = safeNext;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
    const next = searchParams.get("next") || "/reviews";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/reviews";
    window.location.href = safeNext;
  };

  return (
    <>
      <main className="min-h-screen bg-white pt-20">
        <div className="mx-auto max-w-md px-6 py-16">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white border-0" style={{ backgroundColor: '#00ac64' }}>{badge}</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-black">{title}</h1>
            <p className="mt-2 text-black/70">
              {mode === "signin"
                ? "Access your account to submit and manage reviews."
                : "Create your account to start submitting reviews."}
            </p>
          </div>

          <TopAlert
            open={alreadyAuthed}
            onOpenChange={setAlreadyAuthed}
            title="You're already signed in"
            description="You can continue to your destination or sign out from the header."
            icon={<CheckCircle2Icon className="text-green-600" />}
          />

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-black">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-md border border-green-300 bg-white px-3 py-2 text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-black">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full rounded-md border border-green-300 bg-white px-3 py-2 text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-black">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 block w-full rounded-md border border-green-300 bg-white px-3 py-2 text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                />
              </div>
            )}

            <TopAlert
              open={!!error}
              onOpenChange={(open) => !open && setError(null)}
              title="Authentication error"
              description={error || undefined}
              variant="destructive"
              icon={<AlertCircleIcon className="text-red-600" />}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-base font-semibold text-white border-0 transition-colors bg-[#00ac64] hover:bg-[#008a52] disabled:bg-gray-400 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {isLoading ? "Please wait..." : (mode === "signin" ? "Sign In" : "Create Account")}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/" className="font-medium underline underline-offset-4 hover:opacity-80" style={{ color: '#00ac64', textDecorationColor: '#00ac64' }}>
              Back to home
            </Link>
            <button
              type="button"
              onClick={switchMode}
              className="font-medium underline underline-offset-4 hover:opacity-80"
              style={{ color: '#00ac64', textDecorationColor: '#00ac64' }}
            >
              {mode === "signin" ? "Don’t have an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </main>

      {welcomeUser && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={handleWelcomeClose}
          email={welcomeUser.email}
        />
      )}
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white pt-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <SignInContent />
    </Suspense>
  );
}
