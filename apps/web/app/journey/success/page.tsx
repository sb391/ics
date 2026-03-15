"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, MapPinned, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DemandStatusResponse {
  demandId: string;
  message: string;
  city: string | null;
  pincode: string | null;
  routingStatus: string | null;
  dealerMatchStatus: string | null;
  createdAt: string;
}

function JourneySuccessContent() {
  const searchParams = useSearchParams();
  const demandId = searchParams.get("demandId");
  const [status, setStatus] = useState<DemandStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!demandId) {
      setError("We could not find the reference for this demand.");
      return;
    }

    fetch(`/api/consumer-demand/${demandId}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | DemandStatusResponse
          | { error?: { message?: string } }
          | null;

        if (!response.ok || !payload || !("demandId" in payload)) {
          throw new Error(payload && "error" in payload ? payload.error?.message : undefined);
        }

        setStatus(payload);
      })
      .catch((issue: unknown) => {
        setError(issue instanceof Error ? issue.message : "We could not load the demand status.");
      });
  }, [demandId]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="mesh-panel w-full overflow-hidden border-clay/10 shadow-panel">
        <CardContent className="space-y-6 p-6 md:p-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Demand recorded</p>
            <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">
              Your demand has been recorded.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate">
              We are identifying relevant options and dealers in your area. We do not show internal scoring logic here,
              but your submission is now available for routing and later outcome validation.
            </p>
          </div>

          {error ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          {!status && !error ? (
            <div className="rounded-[24px] border border-black/5 bg-white/80 px-5 py-6 text-sm text-slate">
              Loading your demand reference...
            </div>
          ) : null}

          {status ? (
            <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5 rounded-[28px] border border-black/5 bg-white/85 p-6">
                <div className="flex items-start gap-4">
                  <ReceiptText className="mt-1 h-5 w-5 text-clay" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Reference ID</p>
                    <p className="text-2xl font-semibold text-ink">{status.demandId}</p>
                    <p className="text-sm leading-6 text-slate">{status.message}</p>
                  </div>
                </div>
                <div className="rounded-[24px] border border-black/5 bg-sand/70 px-4 py-4 text-sm leading-6 text-slate">
                  Save this reference if you want to check back later or if support needs to locate this demand.
                </div>
              </div>

              <div className="space-y-4 rounded-[28px] border border-black/5 bg-white/85 p-6">
                <div className="flex items-start gap-4">
                  <MapPinned className="mt-1 h-5 w-5 text-clay" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Routing</p>
                    <p className="text-lg font-semibold text-ink">
                      {status.city ?? "City pending"} {status.pincode ? `- ${status.pincode}` : ""}
                    </p>
                  </div>
                </div>
                <dl className="space-y-3 text-sm text-slate">
                  <div className="flex items-center justify-between gap-3">
                    <dt>Routing status</dt>
                    <dd className="font-semibold text-ink">{status.routingStatus ?? "captured"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Dealer match status</dt>
                    <dd className="font-semibold text-ink">{status.dealerMatchStatus ?? "pending"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/journey">
                Submit another demand
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">Return to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function JourneySuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <Card className="mesh-panel w-full overflow-hidden border-clay/10 shadow-panel">
            <CardContent className="p-6 text-sm text-slate md:p-8">Loading your demand reference...</CardContent>
          </Card>
        </main>
      }
    >
      <JourneySuccessContent />
    </Suspense>
  );
}
