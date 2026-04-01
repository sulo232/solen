// Shared component library — Dev 3 imports from here
// All customer-facing components live in this barrel export.

export { default as Spinner } from "@/components/ui/Spinner";
export { default as ExpandableTabs } from "@/components/ui/ExpandableTabs";
export type { Tab } from "@/components/ui/ExpandableTabs";
export { default as GlassModal } from "@/components/ui/GlassModal";
export { default as EmptyState } from "@/components/ui/EmptyState";
export { default as InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
export { default as Skeleton } from "@/components/ui/Skeleton";
export { default as TrustBadges } from "@/components/ui/TrustBadges";
export { default as ExpandableNavTabs } from "@/components/ui/expandable-tabs";
export { default as StickyMobileCTA } from "@/components/ui/StickyMobileCTA";
export { default as SolenDatePicker } from "@/components/ui/date-picker";
export { ToastProvider, useToast } from "@/components/ui/Toast";
export { default as CategoryTree } from "@/components/ui/CategoryTree";
export { default as QuickPreviewSheet } from "@/components/ui/QuickPreviewSheet";

export { default as Header } from "@/components/layout/Header";

export { default as SalonCard } from "@/components/SalonCard";
export { default as ServiceTile } from "@/components/ServiceTile";
export { default as LastMinuteCard } from "@/components/LastMinuteCard";
export { default as FilterBar } from "@/components/ui/FilterBar";
export { default as FilterBottomSheet } from "@/components/ui/FilterBottomSheet";
export { default as FilterDrawer } from "@/components/ui/FilterDrawer";
export { default as CategoryPage } from "@/components/CategoryPage";
export { default as HomePage } from "@/components/HomePage";
export { default as MapView } from "@/components/MapView";
export { default as BookingCalendar } from "@/components/BookingCalendar";
export { default as ChatWindow } from "@/components/ChatWindow";
export { default as SignIn } from "@/components/auth/SignIn";
export { default as TutorialTour } from "@/components/TutorialTour";
export { default as RecentlyViewed, trackSalonView } from "@/components/RecentlyViewed";
export { default as TrustStatsBanner } from "@/components/TrustStatsBanner";
export { default as BrowseByCitySection } from "@/components/BrowseByCitySection";
export { default as ReviewBreakdown } from "@/components/ReviewBreakdown";
export { default as NearbySalons } from "@/components/NearbySalons";
