import type { ScorePayload } from "../scoring/scoring.types";
import type { DealerRoutingRecord } from "../submissions/submission.types";

interface DealerDirectoryEntry {
  id: string;
  name: string;
  cities: string[];
  pincodePrefixes: string[];
}

const DEALER_DIRECTORY: DealerDirectoryEntry[] = [
  {
    id: "dealer_delhi_ncr_01",
    name: "Northline Auto Hub",
    cities: ["delhi", "gurugram", "noida"],
    pincodePrefixes: ["110", "122", "201"]
  },
  {
    id: "dealer_mumbai_01",
    name: "Harbor Drive Motors",
    cities: ["mumbai", "thane", "navi mumbai"],
    pincodePrefixes: ["400"]
  },
  {
    id: "dealer_bengaluru_01",
    name: "Garden City Wheels",
    cities: ["bengaluru", "bangalore"],
    pincodePrefixes: ["560"]
  },
  {
    id: "dealer_hyderabad_01",
    name: "Deccan Mobility House",
    cities: ["hyderabad"],
    pincodePrefixes: ["500"]
  }
];

function normalizeCity(city: string) {
  return city.trim().toLowerCase();
}

function findDealerMatch(routing: NonNullable<ScorePayload["routing"]>) {
  const normalizedCity = normalizeCity(routing.city);

  return (
    DEALER_DIRECTORY.find((dealer) => dealer.pincodePrefixes.some((prefix) => routing.pincode.startsWith(prefix))) ??
    DEALER_DIRECTORY.find((dealer) => dealer.cities.includes(normalizedCity)) ??
    null
  );
}

export function prepareDealerRouting(routing: NonNullable<ScorePayload["routing"]>): DealerRoutingRecord {
  const matchedDealer = findDealerMatch(routing);
  const matchedAt = matchedDealer ? new Date().toISOString() : null;

  return {
    pincode: routing.pincode,
    city: routing.city,
    locality: routing.locality,
    addressLine: routing.addressLine ?? null,
    assignedDealerId: matchedDealer?.id ?? null,
    matchedDealerName: matchedDealer?.name ?? null,
    dealerMatchStatus: matchedDealer ? "matched" : "unmatched",
    routingStatus: matchedDealer ? "ready_for_assignment" : "captured",
    matchedAt
  };
}
