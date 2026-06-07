"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ListingMode,
  ListingPropertyKind,
  SavedList,
  SavedSearch,
  Screen,
} from "@/lib/types";
import { DEFAULT_SAVED_IDS, SAVED_LISTS, SAVED_SEARCHES } from "@/data/saved";

export interface User {
  name: string;
  phone: string;
  initials: string;
}

export interface MyPlace {
  id: string;
  kind: "home" | "work" | "school" | "daycare" | "other";
  label: string;
  lat: number;
  lng: number;
}

export interface AIChatMessage {
  role: "user" | "bot";
  text: string;
  suggestions?: string[];
}

export interface InterestsProfile {
  id: number;
  name: string;
  lifestyle: string;
  mode: ListingMode;
  budgetMin: number | null;
  budgetMax: number | null;
  bedrooms: number[];
  bathroomsMin: number;
  office: boolean;
  districts: string[];
  mustHaves: string[];
  vibe?: string;
  purpose?: string;
  subTypes?: string[];
  budgetAny?: boolean;
  conditions?: string[];
  notifChannels?: string[];
  updatedAt: number;
}

export type UserTier = "free" | "pro";
export type UserTierPlan = "monthly" | "yearly" | null;

interface StoreState {
  // Search mode + UI
  mode: ListingMode;
  currentListingId: number | null;
  highlightedId: number | null;
  highlightSource: "map" | "list" | null;

  // Filters
  filterPropertyKind: ListingPropertyKind | null;
  filterDistrict: string | null;
  filterRooms: number[] | null;
  filterBusStop: string | null;
  filterLifestyle: string[];
  filterVerified: boolean;
  filterIpoteh: boolean;
  filterNewProject: boolean;
  filterSchool: boolean;
  filterIncome: boolean;
  filterPriceMin: number | null;
  filterPriceMax: number | null;
  filterPpmMin: number | null;
  filterPpmMax: number | null;
  priceFilterMode: "total" | "ppm";
  filterAreaMin: number | null;
  filterAreaMax: number | null;
  aiQuery: string;
  aiExtracted: string[] | null;

  // List / pagination
  sortBy: "newest" | "price-asc" | "price-desc" | "area-asc" | "area-desc" | "ppm-asc";
  page: number;
  pageSize: number;
  viewMode: "list" | "map";
  fullMap: boolean;
  mobileView: "list" | "map";
  mapMode: "pins" | "heatmap";

  // Property page
  mediaTab: "photos" | "floorplan" | "tour" | "video";

  // Saved tabs
  savedTab: "listings" | "searches";
  savedListId: number;

  // Polygon
  drawingPolygon: boolean;
  drawnPolygon: { x: number; y: number }[] | null;

  // Loan calculator
  loanBankId: string;
  loanDownPct: number;
  loanYears: number;

  // Rental management
  rentalMgmtTab: "overview" | "properties" | "tenants" | "contracts" | "income";

  // Schedule viewing
  scheduleDate: string | null;
  scheduleTime: string | null;
  scheduleListingId: number | null;

  // Home AI chat
  homeAIChat: AIChatMessage[];
  homeAIChatCollapsed: boolean;

  // Map state
  mapZoom: number;
  mapPanX: number;
  mapPanY: number;

  // Places
  myPlaces: MyPlace[];
  placePicker: { editId?: string; kind: MyPlace["kind"]; label: string } | null;

  // Auth
  isLoggedIn: boolean;
  currentUser: User | null;
  authPhoneDraft: string;
  authResendLeft: number;

  // Saved listings
  savedListingIds: number[];
  savedLists: SavedList[];
  savedSearches: SavedSearch[];

  // Viewed listings
  viewedIds: number[];

  // Compare / tour
  compareIds: number[];

  // Interests
  userInterests: InterestsProfile | null;
  userInterestsList: InterestsProfile[];
  activeInterestsId: number | null;
  userTier: UserTier;
  userTierPlan: UserTierPlan;
  userTierActivatedAt: string | null;
  interestsWizardStep: number;
  interestsWizardMode: "edit" | "create";
  interestsDismissedIds: number[];

  // Modal
  modal: { content: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" } | null;
  // Toast queue
  toasts: { id: number; text: string; tone?: "info" | "success" | "danger" }[];
}

interface StoreActions {
  setMode: (mode: ListingMode) => void;
  setSort: (s: StoreState["sortBy"]) => void;
  setPage: (p: number) => void;
  setViewMode: (v: "list" | "map") => void;
  setFullMap: (v: boolean) => void;
  setMobileView: (v: "list" | "map") => void;
  setMapMode: (v: "pins" | "heatmap") => void;
  setHighlightedId: (id: number | null, source?: "map" | "list") => void;
  setCurrentListingId: (id: number | null) => void;
  setMediaTab: (t: StoreState["mediaTab"]) => void;
  setSavedTab: (t: "listings" | "searches") => void;
  setSavedListId: (id: number) => void;

  // Filters
  setFilterPropertyKind: (k: ListingPropertyKind | null) => void;
  setFilterDistrict: (d: string | null) => void;
  setFilterRooms: (r: number[] | null) => void;
  setFilterBusStop: (id: string | null) => void;
  toggleLifestyle: (key: string) => void;
  setLifestyle: (keys: string[]) => void;
  toggleVerified: () => void;
  toggleIpoteh: () => void;
  toggleNewProject: () => void;
  toggleSchool: () => void;
  toggleIncome: () => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setPpmRange: (min: number | null, max: number | null) => void;
  setPriceFilterMode: (m: "total" | "ppm") => void;
  setAreaRange: (min: number | null, max: number | null) => void;
  setAiQuery: (q: string, extracted?: string[] | null) => void;
  clearAllFilters: () => void;

  // Polygon
  setDrawingPolygon: (v: boolean) => void;
  setDrawnPolygon: (poly: { x: number; y: number }[] | null) => void;

  // Loan
  setLoanBank: (id: string) => void;
  setLoanDownPct: (pct: number) => void;
  setLoanYears: (y: number) => void;

  // Schedule
  setScheduleDate: (d: string | null) => void;
  setScheduleTime: (t: string | null) => void;
  setScheduleListingId: (id: number | null) => void;
  resetSchedule: () => void;

  // Home AI chat
  pushAIChat: (m: AIChatMessage) => void;
  setHomeAIChatCollapsed: (v: boolean) => void;
  clearAIChat: () => void;

  // Auth
  signIn: (user: User) => void;
  signOut: () => void;
  setAuthPhoneDraft: (s: string) => void;
  setAuthResendLeft: (n: number) => void;

  // Saved listings
  toggleSavedListing: (id: number) => void;
  isSaved: (id: number) => boolean;

  // Saved searches
  addSavedSearch: (s: Omit<SavedSearch, "id">) => SavedSearch;
  updateSavedSearch: (id: number, patch: Partial<SavedSearch>) => void;
  removeSavedSearch: (id: number) => void;

  // Viewed
  markViewed: (id: number) => void;

  // Compare
  toggleCompare: (id: number) => void;
  clearCompare: () => void;

  // Places
  addOrUpdatePlace: (place: MyPlace) => void;
  removePlace: (id: string) => void;
  openPlacePicker: (p: StoreState["placePicker"]) => void;
  closePlacePicker: () => void;

  // Interests
  setInterestsList: (list: InterestsProfile[]) => void;
  setActiveInterestsId: (id: number | null) => void;
  upsertInterestProfile: (p: InterestsProfile) => void;
  removeInterestProfile: (id: number) => void;
  setUserTier: (tier: UserTier, plan?: UserTierPlan) => void;
  dismissInterestListing: (id: number) => void;
  clearDismissedInterests: () => void;
  setInterestsWizardStep: (s: number) => void;
  setInterestsWizardMode: (m: "edit" | "create") => void;

  // Modal
  openModal: (content: React.ReactNode, size?: "sm" | "md" | "lg" | "xl") => void;
  closeModal: () => void;

  // Toast
  pushToast: (text: string, tone?: "info" | "success" | "danger") => void;
  removeToast: (id: number) => void;
}

const initialState: StoreState = {
  mode: "sale",
  currentListingId: null,
  highlightedId: null,
  highlightSource: null,

  filterPropertyKind: null,
  filterDistrict: null,
  filterRooms: null,
  filterBusStop: null,
  filterLifestyle: [],
  filterVerified: false,
  filterIpoteh: false,
  filterNewProject: false,
  filterSchool: false,
  filterIncome: false,
  filterPriceMin: null,
  filterPriceMax: null,
  filterPpmMin: null,
  filterPpmMax: null,
  priceFilterMode: "total",
  filterAreaMin: null,
  filterAreaMax: null,
  aiQuery: "",
  aiExtracted: null,

  sortBy: "newest",
  page: 1,
  pageSize: 8,
  viewMode: "list",
  fullMap: false,
  mobileView: "list",
  mapMode: "pins",
  mediaTab: "photos",
  savedTab: "listings",
  savedListId: 1,

  drawingPolygon: false,
  drawnPolygon: null,

  loanBankId: "khan",
  loanDownPct: 30,
  loanYears: 20,

  rentalMgmtTab: "overview",

  scheduleDate: null,
  scheduleTime: null,
  scheduleListingId: null,

  homeAIChat: [],
  homeAIChatCollapsed: false,

  mapZoom: 1,
  mapPanX: 0,
  mapPanY: 0,

  myPlaces: [],
  placePicker: null,

  isLoggedIn: false,
  currentUser: null,
  authPhoneDraft: "",
  authResendLeft: 0,

  savedListingIds: DEFAULT_SAVED_IDS,
  savedLists: SAVED_LISTS,
  savedSearches: SAVED_SEARCHES,

  viewedIds: [],
  compareIds: [],

  userInterests: null,
  userInterestsList: [],
  activeInterestsId: null,
  userTier: "free",
  userTierPlan: null,
  userTierActivatedAt: null,
  interestsWizardStep: 1,
  interestsWizardMode: "edit",
  interestsDismissedIds: [],

  modal: null,
  toasts: [],
};

let toastSeq = 0;

export const useStore = create<StoreState & StoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setMode: (mode) => set({ mode, page: 1 }),
      setSort: (sortBy) => set({ sortBy }),
      setPage: (page) => set({ page }),
      setViewMode: (viewMode) => set({ viewMode }),
      setFullMap: (fullMap) => set({ fullMap }),
      setMobileView: (mobileView) => set({ mobileView }),
      setMapMode: (mapMode) => set({ mapMode }),
      setHighlightedId: (highlightedId, highlightSource) =>
        set({ highlightedId, highlightSource: highlightedId ? highlightSource ?? null : null }),
      setCurrentListingId: (currentListingId) => set({ currentListingId }),
      setMediaTab: (mediaTab) => set({ mediaTab }),
      setSavedTab: (savedTab) => set({ savedTab }),
      setSavedListId: (savedListId) => set({ savedListId }),

      setFilterPropertyKind: (filterPropertyKind) => set({ filterPropertyKind, page: 1 }),
      setFilterDistrict: (filterDistrict) => set({ filterDistrict, page: 1 }),
      setFilterRooms: (filterRooms) => set({ filterRooms, page: 1 }),
      setFilterBusStop: (filterBusStop) => set({ filterBusStop, page: 1 }),
      toggleLifestyle: (key) =>
        set((s) => ({
          filterLifestyle: s.filterLifestyle.includes(key)
            ? s.filterLifestyle.filter((k) => k !== key)
            : [...s.filterLifestyle, key],
          page: 1,
        })),
      setLifestyle: (keys) => set({ filterLifestyle: keys, page: 1 }),
      toggleVerified: () => set((s) => ({ filterVerified: !s.filterVerified, page: 1 })),
      toggleIpoteh: () => set((s) => ({ filterIpoteh: !s.filterIpoteh, page: 1 })),
      toggleNewProject: () => set((s) => ({ filterNewProject: !s.filterNewProject, page: 1 })),
      toggleSchool: () => set((s) => ({ filterSchool: !s.filterSchool, page: 1 })),
      toggleIncome: () => set((s) => ({ filterIncome: !s.filterIncome, page: 1 })),
      setPriceRange: (filterPriceMin, filterPriceMax) =>
        set({ filterPriceMin, filterPriceMax, page: 1 }),
      setPpmRange: (filterPpmMin, filterPpmMax) =>
        set({ filterPpmMin, filterPpmMax, page: 1 }),
      setPriceFilterMode: (priceFilterMode) => set({ priceFilterMode }),
      setAreaRange: (filterAreaMin, filterAreaMax) =>
        set({ filterAreaMin, filterAreaMax, page: 1 }),
      setAiQuery: (aiQuery, aiExtracted = null) => set({ aiQuery, aiExtracted, page: 1 }),
      clearAllFilters: () =>
        set({
          filterPropertyKind: null,
          filterDistrict: null,
          filterRooms: null,
          filterBusStop: null,
          filterLifestyle: [],
          filterVerified: false,
          filterIpoteh: false,
          filterNewProject: false,
          filterSchool: false,
          filterIncome: false,
          filterPriceMin: null,
          filterPriceMax: null,
          filterPpmMin: null,
          filterPpmMax: null,
          filterAreaMin: null,
          filterAreaMax: null,
          aiQuery: "",
          aiExtracted: null,
          drawnPolygon: null,
          page: 1,
        }),

      setDrawingPolygon: (drawingPolygon) => set({ drawingPolygon }),
      setDrawnPolygon: (drawnPolygon) => set({ drawnPolygon, page: 1 }),

      setLoanBank: (loanBankId) => set({ loanBankId }),
      setLoanDownPct: (loanDownPct) => set({ loanDownPct }),
      setLoanYears: (loanYears) => set({ loanYears }),

      setScheduleDate: (scheduleDate) => set({ scheduleDate }),
      setScheduleTime: (scheduleTime) => set({ scheduleTime }),
      setScheduleListingId: (scheduleListingId) => set({ scheduleListingId }),
      resetSchedule: () => set({ scheduleDate: null, scheduleTime: null, scheduleListingId: null }),

      pushAIChat: (m) => set((s) => ({ homeAIChat: [...s.homeAIChat, m] })),
      setHomeAIChatCollapsed: (homeAIChatCollapsed) => set({ homeAIChatCollapsed }),
      clearAIChat: () => set({ homeAIChat: [] }),

      signIn: (currentUser) => set({ isLoggedIn: true, currentUser }),
      signOut: () => set({ isLoggedIn: false, currentUser: null }),
      setAuthPhoneDraft: (authPhoneDraft) => set({ authPhoneDraft }),
      setAuthResendLeft: (authResendLeft) => set({ authResendLeft }),

      toggleSavedListing: (id) =>
        set((s) => ({
          savedListingIds: s.savedListingIds.includes(id)
            ? s.savedListingIds.filter((x) => x !== id)
            : [...s.savedListingIds, id],
        })),
      isSaved: (id) => get().savedListingIds.includes(id),

      addSavedSearch: (draft) => {
        const id =
          get().savedSearches.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        const next: SavedSearch = { ...draft, id };
        set((s) => ({ savedSearches: [...s.savedSearches, next] }));
        return next;
      },
      updateSavedSearch: (id, patch) =>
        set((s) => ({
          savedSearches: s.savedSearches.map((x) =>
            x.id === id ? { ...x, ...patch } : x
          ),
        })),
      removeSavedSearch: (id) =>
        set((s) => ({
          savedSearches: s.savedSearches.filter((x) => x.id !== id),
        })),

      markViewed: (id) =>
        set((s) =>
          s.viewedIds.includes(id)
            ? s
            : { viewedIds: [id, ...s.viewedIds].slice(0, 30) }
        ),

      toggleCompare: (id) =>
        set((s) => ({
          compareIds: s.compareIds.includes(id)
            ? s.compareIds.filter((x) => x !== id)
            : s.compareIds.length >= 4
              ? s.compareIds
              : [...s.compareIds, id],
        })),
      clearCompare: () => set({ compareIds: [] }),

      addOrUpdatePlace: (place) =>
        set((s) => {
          const idx = s.myPlaces.findIndex((p) => p.id === place.id);
          if (idx >= 0) {
            const next = s.myPlaces.slice();
            next[idx] = place;
            return { myPlaces: next };
          }
          return { myPlaces: [...s.myPlaces, place] };
        }),
      removePlace: (id) => set((s) => ({ myPlaces: s.myPlaces.filter((p) => p.id !== id) })),
      openPlacePicker: (placePicker) => set({ placePicker }),
      closePlacePicker: () => set({ placePicker: null }),

      setInterestsList: (userInterestsList) => {
        const active = userInterestsList.find((p) => p.id === get().activeInterestsId) ?? userInterestsList[0] ?? null;
        set({
          userInterestsList,
          activeInterestsId: active?.id ?? null,
          userInterests: active,
        });
      },
      setActiveInterestsId: (activeInterestsId) => {
        const list = get().userInterestsList;
        set({
          activeInterestsId,
          userInterests: list.find((p) => p.id === activeInterestsId) ?? null,
        });
      },
      upsertInterestProfile: (p) =>
        set((s) => {
          const idx = s.userInterestsList.findIndex((x) => x.id === p.id);
          const next = idx >= 0 ? s.userInterestsList.slice() : [...s.userInterestsList, p];
          if (idx >= 0) next[idx] = p;
          return {
            userInterestsList: next,
            userInterests: p,
            activeInterestsId: p.id,
          };
        }),
      removeInterestProfile: (id) =>
        set((s) => {
          const next = s.userInterestsList.filter((x) => x.id !== id);
          const active = next[0] ?? null;
          return {
            userInterestsList: next,
            activeInterestsId: active?.id ?? null,
            userInterests: active,
          };
        }),
      setUserTier: (userTier, userTierPlan = null) =>
        set({
          userTier,
          userTierPlan,
          userTierActivatedAt: userTier === "pro" ? new Date().toISOString() : null,
        }),
      dismissInterestListing: (id) =>
        set((s) =>
          s.interestsDismissedIds.includes(id)
            ? s
            : { interestsDismissedIds: [...s.interestsDismissedIds, id] }
        ),
      clearDismissedInterests: () => set({ interestsDismissedIds: [] }),
      setInterestsWizardStep: (interestsWizardStep) => set({ interestsWizardStep }),
      setInterestsWizardMode: (interestsWizardMode) => set({ interestsWizardMode }),

      openModal: (content, size = "md") => set({ modal: { content, size } }),
      closeModal: () => set({ modal: null }),

      pushToast: (text, tone = "info") =>
        set((s) => ({ toasts: [...s.toasts, { id: ++toastSeq, text, tone }] })),
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: "neomap.store.v1",
      partialize: (s) => ({
        isLoggedIn: s.isLoggedIn,
        currentUser: s.currentUser,
        savedListingIds: s.savedListingIds,
        savedSearches: s.savedSearches,
        viewedIds: s.viewedIds,
        myPlaces: s.myPlaces,
        userInterestsList: s.userInterestsList,
        activeInterestsId: s.activeInterestsId,
        userTier: s.userTier,
        userTierPlan: s.userTierPlan,
        userTierActivatedAt: s.userTierActivatedAt,
        interestsDismissedIds: s.interestsDismissedIds,
        mode: s.mode,
      }),
    }
  )
);

export const selectFilteredCount = (): number => useStore.getState().savedListingIds.length;

export type Route =
  | "/"
  | `/results`
  | `/property/${number}`
  | `/saved`
  | `/auth`
  | `/profile`
  | `/activity`
  | `/alerts`
  | `/news`
  | `/rental-mgmt`
  | `/list-property`
  | `/interests`
  | `/schedule`
  | `/confirmation`;

export const screenToRoute: Record<Screen, string> = {
  home: "/",
  results: "/results",
  property: "/property",
  schedule: "/schedule",
  confirmation: "/confirmation",
  activity: "/activity",
  saved: "/saved",
  alerts: "/alerts",
  auth: "/auth",
  profile: "/profile",
  news: "/news",
  "rental-mgmt": "/rental-mgmt",
  "list-property": "/list-property",
  interests: "/interests",
};
