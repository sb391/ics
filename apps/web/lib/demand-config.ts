export type SignalTheme =
  | "urgency"
  | "product_clarity"
  | "commitment"
  | "affordability"
  | "consistency"
  | "purchase_readiness";

export interface ChoiceOption<TValue extends string = string> {
  value: TValue;
  label: string;
  hint?: string;
}

export const bodyStyleValues = ["hatchback", "sedan", "suv", "mpv", "luxury_suv"] as const;
export const budgetRangeValues = ["under_8_lakh", "8_12_lakh", "12_20_lakh", "20_plus_lakh"] as const;
export const primaryPreferenceValues = [
  "mileage",
  "safety",
  "features",
  "comfort",
  "performance",
  "resale",
  "brand_prestige",
  "after_sales",
  "maintenance",
  "ev_ecosystem"
] as const;
export const brandValues = [
  "hyundai",
  "kia",
  "tata",
  "mahindra",
  "maruti_suzuki",
  "toyota",
  "honda",
  "skoda",
  "volkswagen",
  "mg",
  "bmw",
  "mercedes_benz",
  "audi"
] as const;
export const fuelTypeValues = ["petrol", "diesel", "hybrid", "ev", "cng", "open"] as const;
export const usagePatternValues = [
  "city_commute",
  "family_use",
  "highway_travel",
  "business_use",
  "rideshare",
  "enthusiast"
] as const;
export const monthlyKmBandValues = ["under_500", "500_1000", "1000_2000", "2000_plus"] as const;
export const purchaseTimelineValues = ["immediate", "30_days", "90_days", "exploring"] as const;
export const purchaseReasonValues = [
  "first_car",
  "upgrade",
  "replacement",
  "additional_car",
  "fleet_expansion",
  "business_use_shift",
  "ev_shift",
  "other"
] as const;
export const currentVehicleAgeBandValues = ["none", "0_3_years", "4_7_years", "8_plus_years"] as const;
export const showroomVisitStatusValues = ["not_visited", "visited_once", "visited_multiple"] as const;
export const variantClarityValues = ["open", "trim_shortlist", "exact_variant"] as const;
export const testDriveReadinessValues = ["not_interested", "open", "scheduled_soon"] as const;
export const decisionMakerValues = ["self", "self_and_spouse", "family", "company"] as const;
export const financePreferenceValues = ["yes", "no", "undecided"] as const;
export const downPaymentBandValues = [
  "below_10_percent",
  "10_20_percent",
  "20_30_percent",
  "30_plus_percent"
] as const;
export const salaryBandValues = [
  "under_5_lakh",
  "5_10_lakh",
  "10_20_lakh",
  "20_35_lakh",
  "35_plus_lakh"
] as const;
export const monthlyEmiComfortBandValues = [
  "under_10k",
  "10k_20k",
  "20k_35k",
  "35k_plus",
  "not_sure"
] as const;
export const budgetFlexibilityValues = ["fixed", "slightly_flexible", "very_flexible"] as const;

export const bodyStyleOptions: ChoiceOption<(typeof bodyStyleValues)[number]>[] = [
  { value: "hatchback", label: "Hatchback", hint: "Compact and efficient for city driving." },
  { value: "sedan", label: "Sedan", hint: "Balanced comfort, boot space, and road presence." },
  { value: "suv", label: "SUV", hint: "Higher stance and family-ready versatility." },
  { value: "mpv", label: "MPV", hint: "For larger families or frequent group travel." },
  { value: "luxury_suv", label: "Premium SUV", hint: "Higher-end comfort and brand aspiration." }
];

export const budgetRangeOptions: ChoiceOption<(typeof budgetRangeValues)[number]>[] = [
  { value: "under_8_lakh", label: "Under Rs. 8 lakh" },
  { value: "8_12_lakh", label: "Rs. 8-12 lakh" },
  { value: "12_20_lakh", label: "Rs. 12-20 lakh" },
  { value: "20_plus_lakh", label: "Above Rs. 20 lakh" }
];

export const primaryPreferenceOptions: ChoiceOption<(typeof primaryPreferenceValues)[number]>[] = [
  { value: "mileage", label: "Mileage" },
  { value: "safety", label: "Safety" },
  { value: "features", label: "Features" },
  { value: "comfort", label: "Comfort" },
  { value: "performance", label: "Performance" },
  { value: "resale", label: "Resale value" },
  { value: "brand_prestige", label: "Brand prestige" },
  { value: "after_sales", label: "After-sales support" },
  { value: "maintenance", label: "Maintenance cost" },
  { value: "ev_ecosystem", label: "EV ecosystem" }
];

export const brandOptions: ChoiceOption<(typeof brandValues)[number]>[] = [
  { value: "hyundai", label: "Hyundai" },
  { value: "kia", label: "Kia" },
  { value: "tata", label: "Tata" },
  { value: "mahindra", label: "Mahindra" },
  { value: "maruti_suzuki", label: "Maruti Suzuki" },
  { value: "toyota", label: "Toyota" },
  { value: "honda", label: "Honda" },
  { value: "skoda", label: "Skoda" },
  { value: "volkswagen", label: "Volkswagen" },
  { value: "mg", label: "MG" },
  { value: "bmw", label: "BMW" },
  { value: "mercedes_benz", label: "Mercedes-Benz" },
  { value: "audi", label: "Audi" }
];

export const fuelTypeOptions: ChoiceOption<(typeof fuelTypeValues)[number]>[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "ev", label: "EV" },
  { value: "cng", label: "CNG" },
  { value: "open", label: "Open to the right fit" }
];

export const usagePatternOptions: ChoiceOption<(typeof usagePatternValues)[number]>[] = [
  { value: "city_commute", label: "Daily city commute" },
  { value: "family_use", label: "Family use" },
  { value: "highway_travel", label: "Long highway travel" },
  { value: "business_use", label: "Business use" },
  { value: "rideshare", label: "Commercial or rideshare use" },
  { value: "enthusiast", label: "Driving enjoyment" }
];

export const monthlyKmBandOptions: ChoiceOption<(typeof monthlyKmBandValues)[number]>[] = [
  { value: "under_500", label: "Under 500 km" },
  { value: "500_1000", label: "500-1000 km" },
  { value: "1000_2000", label: "1000-2000 km" },
  { value: "2000_plus", label: "More than 2000 km" }
];

export const purchaseTimelineOptions: ChoiceOption<(typeof purchaseTimelineValues)[number]>[] = [
  { value: "immediate", label: "Immediately", hint: "I am actively trying to move now." },
  { value: "30_days", label: "Within 30 days" },
  { value: "90_days", label: "Within 3 months" },
  { value: "exploring", label: "Still exploring" }
];

export const purchaseReasonOptions: ChoiceOption<(typeof purchaseReasonValues)[number]>[] = [
  { value: "first_car", label: "My first car" },
  { value: "upgrade", label: "Family or lifestyle upgrade" },
  { value: "replacement", label: "Replacing my current car" },
  { value: "additional_car", label: "Adding another car at home" },
  { value: "fleet_expansion", label: "Fleet expansion" },
  { value: "business_use_shift", label: "Business requirement has changed" },
  { value: "ev_shift", label: "Moving toward EV ownership" },
  { value: "other", label: "Another reason" }
];

export const currentVehicleAgeBandOptions: ChoiceOption<(typeof currentVehicleAgeBandValues)[number]>[] = [
  { value: "none", label: "I do not currently own a car" },
  { value: "0_3_years", label: "Current car is 0-3 years old" },
  { value: "4_7_years", label: "Current car is 4-7 years old" },
  { value: "8_plus_years", label: "Current car is 8+ years old" }
];

export const showroomVisitStatusOptions: ChoiceOption<(typeof showroomVisitStatusValues)[number]>[] = [
  { value: "not_visited", label: "Not yet" },
  { value: "visited_once", label: "Visited once" },
  { value: "visited_multiple", label: "Visited multiple times" }
];

export const variantClarityOptions: ChoiceOption<(typeof variantClarityValues)[number]>[] = [
  { value: "open", label: "Still open on variants" },
  { value: "trim_shortlist", label: "Shortlisted trim levels" },
  { value: "exact_variant", label: "Know the exact variant" }
];

export const testDriveReadinessOptions: ChoiceOption<(typeof testDriveReadinessValues)[number]>[] = [
  { value: "not_interested", label: "Not planning one right now" },
  { value: "open", label: "Open to a test drive" },
  { value: "scheduled_soon", label: "Want one scheduled soon" }
];

export const decisionMakerOptions: ChoiceOption<(typeof decisionMakerValues)[number]>[] = [
  { value: "self", label: "I decide myself" },
  { value: "self_and_spouse", label: "Joint decision at home" },
  { value: "family", label: "Family decision" },
  { value: "company", label: "Company or business decision" }
];

export const financePreferenceOptions: ChoiceOption<(typeof financePreferenceValues)[number]>[] = [
  { value: "yes", label: "Yes, likely financing" },
  { value: "no", label: "No, likely self-funded" },
  { value: "undecided", label: "Still deciding" }
];

export const downPaymentBandOptions: ChoiceOption<(typeof downPaymentBandValues)[number]>[] = [
  { value: "below_10_percent", label: "Below 10%" },
  { value: "10_20_percent", label: "10-20%" },
  { value: "20_30_percent", label: "20-30%" },
  { value: "30_plus_percent", label: "30%+" }
];

export const salaryBandOptions: ChoiceOption<(typeof salaryBandValues)[number]>[] = [
  { value: "under_5_lakh", label: "Under Rs. 5 lakh" },
  { value: "5_10_lakh", label: "Rs. 5-10 lakh" },
  { value: "10_20_lakh", label: "Rs. 10-20 lakh" },
  { value: "20_35_lakh", label: "Rs. 20-35 lakh" },
  { value: "35_plus_lakh", label: "Rs. 35 lakh+" }
];

export const monthlyEmiComfortBandOptions: ChoiceOption<(typeof monthlyEmiComfortBandValues)[number]>[] = [
  { value: "under_10k", label: "Under Rs. 10k / month" },
  { value: "10k_20k", label: "Rs. 10k-20k / month" },
  { value: "20k_35k", label: "Rs. 20k-35k / month" },
  { value: "35k_plus", label: "Rs. 35k+ / month" },
  { value: "not_sure", label: "Not sure yet" }
];

export const budgetFlexibilityOptions: ChoiceOption<(typeof budgetFlexibilityValues)[number]>[] = [
  { value: "fixed", label: "Budget is fixed" },
  { value: "slightly_flexible", label: "Can stretch slightly" },
  { value: "very_flexible", label: "Can stretch for the right car" }
];

export interface QuestionDescriptor {
  id: string;
  label: string;
  helper: string;
  signals: SignalTheme[];
}

export const questionDescriptors: Record<string, QuestionDescriptor> = {
  "answers.bodyStyle": {
    id: "answers.bodyStyle",
    label: "Which type of car are you considering?",
    helper: "We use this to understand the shape of demand, not just generic interest.",
    signals: ["product_clarity", "consistency"]
  },
  "answers.budgetRange": {
    id: "answers.budgetRange",
    label: "What budget range are you considering?",
    helper: "A broad band helps avoid mismatched dealer and variant suggestions.",
    signals: ["affordability", "consistency"]
  },
  "answers.primaryPreference": {
    id: "answers.primaryPreference",
    label: "What matters most in your next car?",
    helper: "Your priority helps us understand what a good fit really means for you.",
    signals: ["product_clarity", "consistency"]
  },
  "answers.brandsComparing": {
    id: "answers.brandsComparing",
    label: "Which brands are you seriously considering?",
    helper: "Choose up to five brands you would actually compare.",
    signals: ["product_clarity", "commitment", "consistency"]
  },
  "answers.fuelType": {
    id: "answers.fuelType",
    label: "Which fuel type are you leaning toward?",
    helper: "This helps us read whether you have already translated need into product direction.",
    signals: ["product_clarity", "affordability"]
  },
  "answers.usagePattern": {
    id: "answers.usagePattern",
    label: "What will the car mainly be used for?",
    helper: "Usage sharpens body style, fuel, and ownership-fit checks.",
    signals: ["product_clarity", "consistency"]
  },
  "answers.monthlyKmBand": {
    id: "answers.monthlyKmBand",
    label: "How much do you expect to drive each month?",
    helper: "Distance matters for fuel economics and ownership fit.",
    signals: ["product_clarity", "affordability", "consistency"]
  },
  "answers.purchaseTimeline": {
    id: "answers.purchaseTimeline",
    label: "When are you planning to buy?",
    helper: "This helps us separate active buying windows from passive research.",
    signals: ["urgency", "purchase_readiness"]
  },
  "answers.purchaseReason": {
    id: "answers.purchaseReason",
    label: "What is triggering this purchase?",
    helper: "A replacement or upgrade often tells a different story from open-ended exploration.",
    signals: ["urgency", "product_clarity", "commitment"]
  },
  "answers.currentVehicleAgeBand": {
    id: "answers.currentVehicleAgeBand",
    label: "What best describes your current car situation?",
    helper: "This helps us understand whether there is a real replacement cycle or this is your first purchase.",
    signals: ["urgency", "consistency", "purchase_readiness"]
  },
  "answers.showroomVisitStatus": {
    id: "answers.showroomVisitStatus",
    label: "Have you already visited a showroom?",
    helper: "We use this only as a demand-stage signal, not as a sales pressure trigger.",
    signals: ["urgency", "commitment", "purchase_readiness"]
  },
  "answers.variantClarity": {
    id: "answers.variantClarity",
    label: "How specific is your shortlist today?",
    helper: "Knowing a trim or exact variant is a strong sign of specific demand.",
    signals: ["product_clarity", "commitment", "purchase_readiness"]
  },
  "answers.testDriveReadiness": {
    id: "answers.testDriveReadiness",
    label: "Would you like a test drive?",
    helper: "This is one of the strongest bridges between interest and real action.",
    signals: ["urgency", "commitment", "purchase_readiness"]
  },
  "answers.decisionMaker": {
    id: "answers.decisionMaker",
    label: "Are you the final decision-maker?",
    helper: "We want to understand how directly this demand can move forward.",
    signals: ["commitment", "purchase_readiness"]
  },
  "answers.timelineConfidencePercent": {
    id: "answers.timelineConfidencePercent",
    label: "How certain are you about buying within your selected timeline?",
    helper: "This helps distinguish soft interest from a stronger buying posture.",
    signals: ["urgency", "commitment"]
  },
  "answers.financePreference": {
    id: "answers.financePreference",
    label: "Will you finance the car?",
    helper: "A chosen payment path often signals more serious planning.",
    signals: ["affordability", "commitment", "purchase_readiness"]
  },
  "answers.downPaymentBand": {
    id: "answers.downPaymentBand",
    label: "What down payment feels comfortable?",
    helper: "We use a band, never an exact amount.",
    signals: ["affordability", "commitment", "purchase_readiness"]
  },
  "answers.salaryBand": {
    id: "answers.salaryBand",
    label: "Which income band fits you best?",
    helper: "Only a broad range, used to avoid unrealistic recommendations.",
    signals: ["affordability", "consistency"]
  },
  "answers.monthlyEmiComfortBand": {
    id: "answers.monthlyEmiComfortBand",
    label: "What monthly EMI range feels comfortable?",
    helper: "This often gives a better affordability signal than income alone.",
    signals: ["affordability", "purchase_readiness"]
  },
  "answers.budgetFlexibility": {
    id: "answers.budgetFlexibility",
    label: "How flexible is your budget?",
    helper: "This helps us know whether to keep matching conservative or slightly exploratory.",
    signals: ["affordability", "purchase_readiness"]
  },
  "answers.openToBudgetIncrease": {
    id: "answers.openToBudgetIncrease",
    label: "Would you consider stretching slightly for the right car?",
    helper: "Only used to understand openness, not to push higher-priced options.",
    signals: ["affordability", "purchase_readiness"]
  },
  "answers.tradeInAvailable": {
    id: "answers.tradeInAvailable",
    label: "Would you want to exchange your current vehicle?",
    helper: "Trade-in readiness is often a practical signal of commitment.",
    signals: ["commitment", "purchase_readiness"]
  },
  "routing.pincode": {
    id: "routing.pincode",
    label: "Pincode",
    helper: "Used for dealer routing and location-aware matching.",
    signals: ["purchase_readiness"]
  },
  "routing.city": {
    id: "routing.city",
    label: "City",
    helper: "We use this to identify nearby options and partners.",
    signals: ["purchase_readiness"]
  },
  "routing.locality": {
    id: "routing.locality",
    label: "Area or locality",
    helper: "A precise area helps route demand more intelligently than city alone.",
    signals: ["purchase_readiness"]
  }
};

export const demandJourneySteps = [
  {
    id: "demand-basics",
    eyebrow: "Step 1",
    title: "Define the car you are genuinely considering.",
    description: "We begin with product shape, budget, and shortlist quality.",
    fields: [
      "answers.bodyStyle",
      "answers.budgetRange",
      "answers.primaryPreference",
      "answers.brandsComparing",
      "answers.fuelType",
      "answers.usagePattern",
      "answers.monthlyKmBand"
    ]
  },
  {
    id: "intent-urgency",
    eyebrow: "Step 2",
    title: "Tell us how close this demand is to action.",
    description: "Urgency, shortlist maturity, and next-step readiness matter more than generic curiosity.",
    fields: [
      "answers.purchaseTimeline",
      "answers.purchaseReason",
      "answers.currentVehicleAgeBand",
      "answers.showroomVisitStatus",
      "answers.variantClarity",
      "answers.testDriveReadiness",
      "answers.decisionMaker",
      "answers.timelineConfidencePercent"
    ]
  },
  {
    id: "financial-seriousness",
    eyebrow: "Step 3",
    title: "Build a realistic ownership path.",
    description: "We use broad affordability signals so matching stays grounded.",
    fields: [
      "answers.financePreference",
      "answers.downPaymentBand",
      "answers.salaryBand",
      "answers.monthlyEmiComfortBand",
      "answers.budgetFlexibility",
      "answers.openToBudgetIncrease",
      "answers.tradeInAvailable"
    ]
  },
  {
    id: "routing-consent",
    eyebrow: "Step 4",
    title: "Add where the demand should be routed.",
    description: "Location is used for dealer matching. Consent is required before we connect you.",
    fields: [
      "routing.pincode",
      "routing.city",
      "routing.locality",
      "routing.addressLine",
      "consent.dealerContactConsent"
    ]
  }
] as const;
