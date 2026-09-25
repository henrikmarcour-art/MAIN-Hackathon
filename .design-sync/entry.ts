// Design-sync entry: the MaasNow UI pieces exposed to Claude Design as
// window.MaasNow. Sync-only; the app does not import this file.
// Scope: self-contained controls and cards. MapView and the large
// state-wired panels (EventSheet, CreatePanel, ProfilePanel,
// AttendeeListSheet) are deliberately left out.
export { Avatar, AvatarStack } from "@/components/Avatar";
export { default as BottomNav } from "@/components/BottomNav";
export { default as TopBar } from "@/components/TopBar";
export { InviteCard, InviteChip } from "@/components/InviteCard";
export { default as ForYouPanel } from "@/components/ForYouPanel";
export { default as BrandPill } from "@/components/map/BrandPill";
export { default as DiscoveryChips } from "@/components/map/DiscoveryChips";
export { default as DiscoveryRail } from "@/components/map/DiscoveryRail";
export { default as MapActions } from "@/components/map/MapActions";
export { default as MapModeSheet } from "@/components/map/MapModeSheet";
export { default as MapNotice } from "@/components/map/MapNotice";
export { default as SearchCapsule } from "@/components/map/SearchCapsule";
export { default as TimeScrubber, TimeClock } from "@/components/map/TimeScrubber";
export * from "@/components/map/icons";

// Seed data, so designs can use realistic Maastricht venues and people.
export { venues, people, currentUser, friends, invitations, categoryMeta } from "@/data/events";
