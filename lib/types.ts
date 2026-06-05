export type ListingMode = "sale" | "rent";
export type ListingStatus = "new" | "active" | "hot" | "drop" | "reserved" | "sold";

export interface PricePoint {
  d: string;
  p: number;
}

export interface Listing {
  id: number;
  mode: ListingMode;
  district: string;
  khoroo: string;
  khotkhon: string;
  rooms: number;
  area: number;
  floor: string;
  year: number;
  price: number;
  photos: number;
  status: ListingStatus;
  listedDays: number;
  viewCount: number;
  viewingCount: number;
  features: string[];
  agentId: number;
  lat: number;
  lng: number;
  desc?: string;
  priceHistory?: PricePoint[];
  photoSeeds?: (string | number)[];
}

export interface Agent {
  id: number;
  name: string;
  initials: string;
  agency: string;
  verified: boolean;
  phone: string;
  activity: string;
  listings: number;
  rating: number;
  reviewCount: number;
}

export interface Bank {
  id: string;
  name: string;
  short: string;
  rate: number;
  maxYears: number;
  minDownPct: number;
  badge?: string;
  color: string;
  tag: string;
}

export interface BusStop {
  id: string;
  name: string;
  district: string;
  routes: string[];
  lat: number;
  lng: number;
}

export interface MapLabel {
  name: string;
  x: number;
  y: number;
}

export interface DistrictZone {
  name: string;
  points: string;
  label: { x: number; y: number };
}

export interface PropertyType {
  key: string;
  label: string;
  icon: string;
  mode: ListingMode;
  count: number;
  hint: string;
}

export interface RoomType {
  key: string;
  label: string;
  tagGroup: string;
  group: string;
}

export interface SavedSearch {
  id: number;
  mode: ListingMode;
  name: string;
  districts: string[];
  rooms: number[];
  priceRange: [number, number];
  newMatches: number;
  alertFreq: "instant" | "daily" | "weekly";
  sms: boolean;
  email: boolean;
  push: boolean;
  lastAlert: string;
}

export interface SavedList {
  id: number;
  name: string;
  icon: string;
  listingIds: number[];
}

export interface Viewing {
  id: number;
  listingId: number;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  dayLabel?: string;
  countdown?: string;
  note?: string;
  outcome?: string;
}

export interface Message {
  id: number;
  agentId: number;
  lastMsg: string;
  time: string;
  unread: number;
  listingId: number;
}

export type Screen =
  | "home"
  | "results"
  | "property"
  | "schedule"
  | "confirmation"
  | "activity"
  | "saved"
  | "alerts"
  | "auth"
  | "profile"
  | "news"
  | "rental-mgmt"
  | "list-property"
  | "interests";
