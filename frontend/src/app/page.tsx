"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { isAuthenticated } from "@/lib/api";
import { CheckCircle2Icon } from "lucide-react";
import { TopAlert } from "@/components/TopAlert";
import { Reveal } from "@/components/Reveal";
import { SampleReviewCard } from "@/components/SampleReviewCard";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showLoggedOut, setShowLoggedOut] = useState(false);

  useEffect(() => {
    // Only check authentication after component mounts (hydration)
    setIsLoggedIn(isAuthenticated());
    setIsHydrated(true);
  }, []);

  // Detect logout flag in URL and then clean it up
  useEffect(() => {
    const flag = searchParams.get("logout");
    if (flag) {
      setShowLoggedOut(true);
      // Strip the flag from the URL so it doesn't persist
      const params = new URLSearchParams(searchParams.toString());
      params.delete("logout");
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    }
  }, [searchParams, router]);


  const goProtected = (target: string) => {
    if (!isLoggedIn) {
      router.push(`/signin?next=${encodeURIComponent(target)}`);
    } else {
      router.push(target);
    }
  };

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      <TopAlert
        open={showLoggedOut}
        onOpenChange={setShowLoggedOut}
        title="Signed out successfully"
        description="You have been logged out."
        icon={<CheckCircle2Icon className="text-green-600" />}
      />
      <div className="relative w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-top opacity-[0.60]"
          style={{
            backgroundImage: 'url(/image.png)',
            maskImage:
              'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 88%, rgba(0,0,0,0.25) 96%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 88%, rgba(0,0,0,0.25) 96%, transparent 100%)',
          }}
        />

        <section className="relative z-10 mx-auto max-w-6xl px-6 pt-24 md:pt-32 pb-48 md:pb-64 min-h-[70vh] md:min-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="text-left relative z-10">
              <Reveal>
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-black border border-green-300">Simple and fast</span>
              </Reveal>
              <Reveal delay={60}>
                <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-black">
                  Rate my <span className="text-green-600">Philly</span> Landlord
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-3 text-lg text-black/70 max-w-prose">
                  Share honest reviews about Philadelphia landlords and help fellow renters navigate the city's rental market.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <div className="mt-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <button
                    onClick={() => goProtected("/submit")}
                    className="inline-flex items-center justify-center rounded-md bg-green-600 px-5 py-3 text-base font-semibold text-white border border-green-700/50 shadow-none transition-colors hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
                  >
                    Start a review
                  </button>
                  <button
                    onClick={() => goProtected("/reviews")}
                    className="inline-flex items-center justify-center rounded-md bg-gray-100 px-5 py-3 text-base font-semibold text-gray-700 border border-gray-300 shadow-none transition-colors hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
                  >
                    Browse reviews
                  </button>
                </div>
              </Reveal>
            </div>

            <div className="relative z-10">
              <Reveal>
                <div className="absolute -top-6 -left-4 -z-10 size-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: '#00ac64' }} />
              </Reveal>
              <Reveal delay={100}>
                <SampleReviewCard />
              </Reveal>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-24 mt-12 md:mt-16">
        <Reveal>
          <h2 className="text-2xl font-extrabold tracking-tight text-black text-center">What we offer</h2>
        </Reveal>
        <div className="mt-10 space-y-12">
          <Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="order-1">
                <h3 className="text-xl font-bold text-black">Real experiences from Philly renters</h3>
                <p className="mt-2 text-black/70">Get the inside scoop on landlords across Philadelphia neighborhoods — from Center City to Fishtown, South Philly to Northern Liberties.</p>
              </div>
              <div className="order-2">
                <div className="w-full rounded-lg border border-green-300 bg-white p-5">
                  <ul className="space-y-2 text-black/80">
                    <li>• Honest reviews from verified locals</li>
                    <li>• Neighborhood context that actually helps</li>
                    <li>• Clear landlord track records at a glance</li>
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="order-2 md:order-1">
                <div className="w-full rounded-lg border border-green-300 bg-white p-5">
                  <ol className="space-y-2 text-black/80 list-decimal list-inside">
                    <li>Search the landlord or address</li>
                    <li>Share what went well (and what didn’t)</li>
                    <li>Submit anonymously if you prefer</li>
                  </ol>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-xl font-bold text-black">Fast and simple submissions</h3>
                <p className="mt-2 text-black/70">Share a review in minutes with a clean, focused form that gets the details that matter.</p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="order-1">
                <h3 className="text-xl font-bold text-black">Community transparency</h3>
                <p className="mt-2 text-black/70">Your insights help others avoid bad experiences and reward great landlords doing the right thing.</p>
              </div>
              <div className="order-2">
                <div className="w-full rounded-lg border border-green-300 bg-white p-5">
                  <ul className="space-y-2 text-black/80">
                    <li>• No pay-to-play or hidden boosts</li>
                    <li>• Clear community guidelines and moderation</li>
                    <li>• Bookmarks to save reviews for later</li>
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white relative overflow-hidden">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
