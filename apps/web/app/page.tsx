import Link from "next/link";
import { ArrowRight, MapPinned, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const benefitCards = [
  {
    title: "A better signal than random enquiry forms",
    description:
      "Instead of asking for your phone first, we understand what you actually want to buy, how close you are, and how to route the demand responsibly."
  },
  {
    title: "Location-aware routing",
    description:
      "Pincode, city, and locality help identify relevant dealer coverage without turning the journey into a spam trap."
  },
  {
    title: "Built for real-world matching",
    description:
      "Your demand is stored with a reference ID so it can later be reviewed against dealer outcomes and conversion quality."
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Intent Confidence Score</div>
          <div className="hidden text-sm text-slate md:block">
            Structured demand capture for thoughtful car buying
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <Badge>Auto demand journey</Badge>
              <h1 className="font-display text-5xl leading-[1.05] text-ink sm:text-6xl">
                Share your car-buying demand once. Get matched more thoughtfully.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate">
                This is not a generic lead form. It is a structured journey that captures what you are actually
                looking for, how soon you plan to buy, and where the right dealer coverage should come from.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/journey">
                  Start Your Car Buying Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="#how-it-works">How it works</a>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[26px] border border-black/5 bg-white/75 p-5 shadow-soft">
                <Sparkles className="h-5 w-5 text-clay" />
                <p className="mt-3 text-sm font-semibold text-ink">Premium, low-noise capture</p>
                <p className="mt-2 text-sm leading-6 text-slate">Demand first. No forced identity collection up front.</p>
              </div>
              <div className="rounded-[26px] border border-black/5 bg-white/75 p-5 shadow-soft">
                <MapPinned className="h-5 w-5 text-clay" />
                <p className="mt-3 text-sm font-semibold text-ink">Dealer-ready routing</p>
                <p className="mt-2 text-sm leading-6 text-slate">Location is captured cleanly for later assignment.</p>
              </div>
              <div className="rounded-[26px] border border-black/5 bg-white/75 p-5 shadow-soft">
                <ShieldCheck className="h-5 w-5 text-clay" />
                <p className="mt-3 text-sm font-semibold text-ink">Trust-led experience</p>
                <p className="mt-2 text-sm leading-6 text-slate">Consent is explicit and data use is clearly explained.</p>
              </div>
            </div>
          </div>

          <Card className="mesh-panel overflow-hidden border-clay/10 shadow-panel">
            <CardContent className="space-y-6 p-6 md:p-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">How it works</p>
                <h2 className="font-display text-3xl leading-tight text-ink">
                  A cleaner route from intent to the right dealer conversation.
                </h2>
              </div>
              <div className="space-y-4">
                {[
                  "Tell us what kind of car, shortlist, timeline, and buying context you have in mind.",
                  "We capture behavioural and demand signals in the background to understand how considered the journey looks.",
                  "Your demand is stored with a unique reference ID and prepared for dealer matching by location."
                ].map((item, index) => (
                  <div key={item} className="flex items-start gap-4 rounded-[24px] border border-black/5 bg-white/80 p-4">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-clay text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate">{item}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-[24px] border border-moss/15 bg-moss/8 p-4 text-sm leading-6 text-slate">
                <strong className="text-ink">Privacy note:</strong> we only collect structured demand, routing
                location, and explicit consent to connect you with relevant dealers or partners.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {benefitCards.map((card) => (
            <Card key={card.title} className="border-black/5 bg-white/80">
              <CardContent className="space-y-3 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Why this is better</p>
                <h3 className="font-display text-2xl leading-tight text-ink">{card.title}</h3>
                <p className="text-sm leading-7 text-slate">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
