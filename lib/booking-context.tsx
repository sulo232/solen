'use client';

import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import type { BookingContextType, BookingFormData, BookingStep, SelectedService } from './booking-state';

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BOOKING_DRAFT_TTL_MS = 45 * 60 * 1000;
const BOOKING_DRAFT_VERSION = 2;

export interface StoredBookingDraft {
  v: number;
  salonId: string;
  savedAt: number;
  services: SelectedService[];
  selectedStaffId: string;
  selectedDate: string | null;
}

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function browserDraftStorage(): DraftStorage | null {
  return typeof window === 'undefined' ? null : window.sessionStorage;
}

export function draftStorageKey(salonId: string): string {
  return `solen-booking-draft:${salonId}`;
}

function isSelectedService(value: unknown): value is SelectedService {
  if (!value || typeof value !== 'object') return false;
  const service = value as Record<string, unknown>;
  return (
    typeof service.id === 'string' &&
    service.id.length > 0 &&
    typeof service.name_de === 'string' &&
    typeof service.name_en === 'string' &&
    typeof service.price === 'number' &&
    Number.isFinite(service.price) &&
    service.price >= 0 &&
    typeof service.duration_minutes === 'number' &&
    Number.isSafeInteger(service.duration_minutes) &&
    service.duration_minutes > 0
  );
}

function isSelectedServiceList(value: unknown): value is SelectedService[] {
  if (!Array.isArray(value) || !value.every(isSelectedService)) return false;
  return new Set(value.map((service) => service.id)).size === value.length;
}

function isCanonicalIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

export function readFreshDraft(
  salonId: string,
  storage?: DraftStorage | null,
  now = Date.now(),
): StoredBookingDraft | null {
  const key = draftStorageKey(salonId);
  try {
    const draftStorage = storage === undefined ? browserDraftStorage() : storage;
    if (!draftStorage) return null;
    const raw = draftStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredBookingDraft>;
    const savedAt = parsed.savedAt;
    const valid =
      parsed.v === BOOKING_DRAFT_VERSION &&
      parsed.salonId === salonId &&
      typeof savedAt === 'number' &&
      Number.isSafeInteger(savedAt) &&
      savedAt > 0 &&
      savedAt <= now &&
      now - savedAt <= BOOKING_DRAFT_TTL_MS &&
      isSelectedServiceList(parsed.services) &&
      typeof parsed.selectedStaffId === 'string' &&
      parsed.selectedStaffId.length > 0 &&
      (parsed.selectedDate === null || isCanonicalIsoTimestamp(parsed.selectedDate));
    if (!valid) {
      draftStorage.removeItem(key);
      return null;
    }
    return {
      v: BOOKING_DRAFT_VERSION,
      salonId,
      savedAt,
      services: (parsed.services as SelectedService[]).map((service) => ({
        id: service.id,
        name_de: service.name_de,
        name_en: service.name_en,
        price: service.price,
        duration_minutes: service.duration_minutes,
      })),
      selectedStaffId: parsed.selectedStaffId as string,
      selectedDate: parsed.selectedDate as string | null,
    };
  } catch (err) {
    console.error('[booking-context] failed to read stored booking draft:', err);
    try {
      const draftStorage = storage === undefined ? browserDraftStorage() : storage;
      draftStorage?.removeItem(key);
    } catch (removeErr) {
      console.error('[booking-context] failed to remove invalid booking draft:', removeErr);
    }
    return null;
  }
}

export function persistBookingDraft(
  salonId: string,
  formData: BookingFormData,
  storage?: DraftStorage | null,
  now = Date.now(),
): void {
  const key = draftStorageKey(salonId);
  try {
    const draftStorage = storage === undefined ? browserDraftStorage() : storage;
    if (!draftStorage) return;
    if (!formData.services.length && !formData.selectedDate) {
      draftStorage.removeItem(key);
      return;
    }
    const draft: StoredBookingDraft = {
      v: BOOKING_DRAFT_VERSION,
      salonId,
      savedAt: now,
      services: formData.services.map((service) => ({
        id: service.id,
        name_de: service.name_de,
        name_en: service.name_en,
        price: service.price,
        duration_minutes: service.duration_minutes,
      })),
      selectedStaffId: formData.selectedStaffId,
      selectedDate: formData.selectedDate?.toISOString() ?? null,
    };
    draftStorage.setItem(key, JSON.stringify(draft));
  } catch (err) {
    console.error('[booking-context] failed to persist booking draft:', err);
  }
}

export function clearBookingDraft(
  salonId: string,
  storage?: DraftStorage | null,
): void {
  try {
    const draftStorage = storage === undefined ? browserDraftStorage() : storage;
    draftStorage?.removeItem(draftStorageKey(salonId));
  } catch (err) {
    console.error('[booking-context] failed to clear stored booking draft:', err);
  }
}

export function restoredDraftPatch({
  draft,
  knownServices,
  knownStaffIds,
  hasInitialServices,
  hasInitialStaff,
  hasInitialDate,
}: {
  draft: StoredBookingDraft;
  knownServices?: SelectedService[];
  knownStaffIds?: string[];
  hasInitialServices: boolean;
  hasInitialStaff: boolean;
  hasInitialDate: boolean;
}): Partial<BookingFormData> {
  const patch: Partial<BookingFormData> = {};
  if (!hasInitialServices && knownServices) {
    const liveById = new Map(knownServices.map((service) => [service.id, service]));
    const services = draft.services
      .map((service) => liveById.get(service.id))
      .filter((service): service is SelectedService => Boolean(service));
    patch.services = services;
    patch.totalPrice = services.reduce((sum, service) => sum + service.price, 0);
    patch.totalDuration = services.reduce((sum, service) => sum + service.duration_minutes, 0);
  }
  if (!hasInitialStaff && draft.selectedStaffId) {
    const staffIsLive =
      draft.selectedStaffId === 'any' ||
      Boolean(knownStaffIds?.includes(draft.selectedStaffId));
    patch.selectedStaffId = staffIsLive ? draft.selectedStaffId : 'any';
  }
  if (!hasInitialDate && draft.selectedDate) {
    patch.selectedDate = new Date(draft.selectedDate);
  }
  return patch;
}

// GAP #5 punch (round 2, 2026-07-18): own redundant copy of the round-trip calendar-date
// check (defense-in-depth alongside booking/page.tsx's server-side validation). A NaN-only
// Date() check does not catch day-of-month overflow (JS silently normalizes "2026-02-30" ->
// "2026-03-02"), so this round-trips the y/m/d through a LOCAL-time Date and requires them
// to read back identically before initialDate is ever allowed to seed selectedDate.
function isRealCalendarDate(ymd: string): boolean {
  const [y, m, d] = ymd.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;
}

interface BookingAction {
  type: 'SET_STEP' | 'UPDATE_DATA' | 'SET_ERROR' | 'SET_LOADING' | 'RESET';
  payload?: any;
}

const initialFormData: BookingFormData = {
  services: [],
  selectedStaffId: 'any',
  selectedDate: null,
  selectedTime: null,
  totalDuration: 0,
  totalPrice: 0,
  addonIds: [],
  promoCode: '',
  giftCardCode: '',
  referralCode: '',
  paymentMethod: null,
};

const initialState = {
  currentStep: 'services-staff' as BookingStep,
  formData: initialFormData,
  isLoading: false,
  error: null,
};

function bookingReducer(state: typeof initialState, action: BookingAction) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'UPDATE_DATA':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function BookingProvider({
  children,
  salonId,
  knownServices,
  knownStaffIds,
  initialStaffId,
  initialService,
  initialServices,
  initialStart,
  initialDate,
  initialNote,
  initialBundleId,
}: {
  children: ReactNode;
  salonId: string;
  knownServices?: SelectedService[];
  knownStaffIds?: string[];
  initialStaffId?: string;
  initialService?: SelectedService;
  initialServices?: SelectedService[];
  initialStart?: string;
  /** GAP #5: ?date=YYYY-MM-DD from a search result / PDP link. Seeds ONLY selectedDate
   *  (never selectedTime), so the user still picks a real slot. Ignored when initialStart
   *  is also present (a concrete slot already carries a more specific date and time). */
  initialDate?: string;
  /** ?note=… — the discovery cut-instruction auto-fills the booking note (HairStep reads formData.customerNote). */
  initialNote?: string;
  /** A5 BUG-1: ?bundle=<id> from the PDP bundle card. Seeds formData.bundleId so PayConfirmStep's POST includes bundle_id. */
  initialBundleId?: string;
}) {
  const [draftReadyForSalon, setDraftReadyForSalon] = useReducer(
    (_: string | null, next: string | null) => next,
    null,
  );
  const [state, dispatch] = useReducer(bookingReducer, initialState, (base) => {
    let fd = base.formData;
    if (initialStaffId) fd = { ...fd, selectedStaffId: initialStaffId };
    // V3-D379: arriving from a card slot pill (?service=<id>) seeds the cart with
    // that service + its totals, so the user lands mid-flow, not on an empty step.
    // V3-D (2026-06-09): ?services=<csv> (multi-select from the PDP "Alle ansehen" sheet)
    // seeds the cart with ALL chosen services; ?service=<id> (single) is the fallback.
    const seedServices =
      initialServices && initialServices.length
        ? initialServices
        : initialService
          ? [initialService]
          : null;
    if (seedServices) {
      fd = {
        ...fd,
        services: seedServices,
        totalPrice: seedServices.reduce((sum, s) => sum + (s.price || 0), 0),
        totalDuration: seedServices.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
      };
    }
    // V3-D380: ?start=<ISO> (the tapped slot's time) seeds the date + time so the
    // datetime step lands pre-filled on that slot. selectedTime is "HH:MM" (local,
    // 24h) to match DateTimeStep's slot.time format.
    if (initialStart) {
      const d = new Date(initialStart);
      if (!Number.isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        fd = { ...fd, selectedDate: d, selectedTime: `${hh}:${mm}` };
      }
    } else if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) && isRealCalendarDate(initialDate)) {
      // GAP #5: a searched date (already format/range/round-trip-validated server-side
      // in booking/page.tsx, re-checked here for defense-in-depth) seeds ONLY the date.
      // selectedTime stays null so the user still picks a real slot on the
      // DateTimePicker, exactly like a manual date tap. "T00:00:00" (no Z) forces
      // local-time parsing, avoiding the UTC-midnight date-only Date() gotcha that can
      // shift the day in negative-offset timezones.
      fd = { ...fd, selectedDate: new Date(`${initialDate}T00:00:00`) };
    }
    // Discovery "book this look": the cut-instruction arrives as ?note= and seeds the booking note, so the user
    // reaches the hair step with "how to cut it" already written (owner 2026-06-14).
    if (initialNote && initialNote.trim()) {
      fd = { ...fd, customerNote: initialNote.trim() };
    }
    // A5 BUG-1: ?bundle=<id> (validated server-side against the active bundles of this salon) rides
    // through to the POST /api/bookings body, so the server prices the discounted bundle, not the sum.
    if (initialBundleId) {
      fd = { ...fd, bundleId: initialBundleId };
    }
    return fd === base.formData ? base : { ...base, formData: fd };
  });

  useEffect(() => {
    const draft = readFreshDraft(salonId);
    if (draft) {
      const patch = restoredDraftPatch({
        draft,
        knownServices,
        knownStaffIds,
        hasInitialServices: Boolean((initialServices && initialServices.length) || initialService),
        hasInitialStaff: Boolean(initialStaffId),
        hasInitialDate: Boolean(initialStart || initialDate),
      });
      if (Object.keys(patch).length > 0) {
        dispatch({ type: 'UPDATE_DATA', payload: patch });
      }
    }
    setDraftReadyForSalon(salonId);
  }, [
    initialDate,
    initialService,
    initialServices,
    initialStaffId,
    initialStart,
    knownServices,
    knownStaffIds,
    salonId,
  ]);

  useEffect(() => {
    if (draftReadyForSalon !== salonId) return;
    persistBookingDraft(salonId, state.formData);
  }, [draftReadyForSalon, salonId, state.formData]);

  const goToStep = (step: BookingStep) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const updateFormData = (updates: Partial<BookingFormData>) => {
    dispatch({ type: 'UPDATE_DATA', payload: updates });
  };

  const resetForm = () => {
    clearBookingDraft(salonId);
    dispatch({ type: 'RESET' });
  };

  const value: BookingContextType = {
    ...state,
    goToStep,
    updateFormData,
    resetForm,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}
