# Solen Frontend — Current Component State (Deliverable 3)

> For each `components/**/*.tsx` file: introduction, rewrite count, last touch, drift flags vs the new green/amber/Anton/Figtree system, orphan check.

Generated: 2026-05-01

---

## Verdict legend
- **conformant**: no drift markers, used by ≥1 route, recently touched
- **drifted**: uses retired tokens (Fraunces/Bebas Neue/DM Sans/old coral/rounded-lg-xl-2xl/dark:/emoji UI/V5 Zone)
- **orphan**: not imported by any `app/` route
- **dead**: orphan + last-touched >30 days ago

---

## Components

| file | introduced | rewrites | last touch | drift markers | used by ≥1 app route | verdict |
|---|---|---|---|---|---|---|
| `components/BookingCalendar.tsx` | 8dd783d (2026-03-23) | 10 | b08e234 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/BookingSuccess.tsx` | 8dd783d (2026-03-23) | 3 | b08e234 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/BrowseByCitySection.tsx` | 9260aa1 (2026-04-01) | 3 | f7ed0a9 (2026-04-13) | font | NO | **orphan** |
| `components/CategoryHero.tsx` | 8dd783d (2026-03-23) | 4 | 98bda58 (2026-03-28) | — | NO | **orphan** |
| `components/CategoryPage.tsx` | 8dd783d (2026-03-23) | 12 | f7ed0a9 (2026-04-13) | font;dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ChatWindow.tsx` | 8dd783d (2026-03-23) | 7 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/CityPage.tsx` | 1336d1b (2026-03-26) | 1 | ae8be83 (2026-04-04) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/HomePage.tsx` | 8dd783d (2026-03-23) | 45 | 32ec080 (2026-04-21) | — | YES | **conformant** |
| `components/LastMinuteCard.tsx` | 8dd783d (2026-03-23) | 3 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/MapView.tsx` | 8dd783d (2026-03-23) | 5 | b08e234 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/NearbySalons.tsx` | 8dd783d (2026-03-23) | 3 | ba0b70a (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/PostHogProvider.tsx` | 8dd783d (2026-03-23) | 0 | bd67f9e (2026-03-23) | — | YES | **conformant** |
| `components/ProfilePage.tsx` | 8dd783d (2026-03-23) | 15 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/RecentlyViewed.tsx` | 8dd783d (2026-03-23) | 3 | f07a3c2 (2026-04-08) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ReviewBreakdown.tsx` | 8dd783d (2026-03-23) | 5 | 391d8bf (2026-04-02) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ReviewCarousel.tsx` | 8dd783d (2026-03-23) | 3 | 6ca0be0 (2026-04-02) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ReviewForm.tsx` | a591cd0 (2026-03-23) | 6 | 0de8582 (2026-04-21) | black;dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/SalonCard.tsx` | 8dd783d (2026-03-23) | 14 | b6c322b (2026-04-22) | — | YES | **conformant** |
| `components/ServiceTile.tsx` | 8dd783d (2026-03-23) | 3 | 6ca0be0 (2026-04-02) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/StaffPortfolio.tsx` | 8dd783d (2026-03-23) | 6 | 0bd3daf (2026-04-22) | — | YES | **conformant** |
| `components/TerminePage.tsx` | 8dd783d (2026-03-23) | 5 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/TestimonialCarousel.tsx` | c4d4b52 (2026-04-01) | 5 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/TrustStatsBanner.tsx` | 5da4d35 (2026-04-01) | 4 | f7ed0a9 (2026-04-13) | font | NO | **orphan** |
| `components/TutorialTour.tsx` | 8dd783d (2026-03-23) | 3 | 98bda58 (2026-03-28) | — | NO | **orphan** |
| `components/_archive/QuartierTile.tsx` | 9743f96 (2026-03-25) | 1 | 85494af (2026-04-02) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/_archive/RecommendedSalons.tsx` | 9743f96 (2026-03-25) | 1 | 9743f96 (2026-03-25) | — | NO | **orphan** |
| `components/_archive/WaitlistModal.tsx` | 9743f96 (2026-03-25) | 1 | 85494af (2026-04-02) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/_archive/WeatherBanner.tsx` | 9743f96 (2026-03-25) | 1 | 85494af (2026-04-02) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/admin/BookingDisputePanel.tsx` | 4b6485b (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/auth/SignIn.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/auth/TosPrompt.tsx` | 823f70d (2026-03-23) | 3 | 0de8582 (2026-04-21) | black;dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/barber/BarbershopSections.tsx` | 764f53d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/barber/CutHistoryTimeline.tsx` | 8dd783d (2026-03-23) | 3 | e855b45 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/barber/ExpressRebook.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/barber/LoyaltyCard.tsx` | 8dd783d (2026-03-23) | 3 | e855b45 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/barber/LoyaltyCardList.tsx` | 8dd783d (2026-03-23) | 3 | e855b45 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/barber/RemoteQueueJoin.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/barber/WaitTimeDisplay.tsx` | 8dd783d (2026-03-23) | 3 | ae8be83 (2026-04-04) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/barber/WalkinQueue.tsx` | 8dd783d (2026-03-23) | 3 | d599845 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/BookingCard.tsx` | 609aef4 (2026-04-02) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/BookingWizard.tsx` | 902ff1c (2026-04-01) | 3 | 4808d5d (2026-04-04) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/BookingsList.tsx` | 609aef4 (2026-04-02) | 1 | 55f2a97 (2026-04-02) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/ConfirmationStep.tsx` | e6e9443 (2026-04-01) | 1 | b6c322b (2026-04-22) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/CustomerPreferencesForm.tsx` | d3a9174 (2026-03-25) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/DateSelectionStep.tsx` | 7c9da16 (2026-04-01) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/DateTimeStep.tsx` | 4808d5d (2026-04-04) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/GroupBookingModal.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/GuestBookingForm.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/PackageRedeemBanner.tsx` | 8dd783d (2026-03-23) | 5 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/PaymentStep.tsx` | 197e121 (2026-04-01) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/ReviewPrompt.tsx` | 01b5c22 (2026-04-02) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/ServiceCart.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/ServiceSelectionStep.tsx` | 63ce4a2 (2026-04-01) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/ServicesStaffStep.tsx` | e0280ed (2026-04-04) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/StaffPicker.tsx` | 60a8824 (2026-03-24) | 1 | 6ca0be0 (2026-04-02) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/StaffSelectionStep.tsx` | 1df7235 (2026-04-01) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/booking/TimeSelectionStep.tsx` | cdc7581 (2026-04-01) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/chat/AISuggestion.tsx` | 8dd783d (2026-03-23) | 4 | 98bda58 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/chat/BookingBubble.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/chat/ClientTags.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/chat/PhotoGallery.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/chat/QuickReplyChips.tsx` | 8dd783d (2026-03-23) | 3 | 98bda58 (2026-03-28) | dark-mode | NO | **orphan** |
| `components/coiffeur/AiMatcherModal.tsx` | 566d76f (2026-03-24) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/coiffeur/CoiffeurSections.tsx` | 764f53d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/compare/CompareBar.tsx` | 93d116a (2026-03-28) | 1 | 6d84f4b (2026-04-04) | — | NO | **orphan** |
| `components/compare/CompareContext.tsx` | 93d116a (2026-03-28) | 1 | f8daf46 (2026-03-28) | — | YES | **conformant** |
| `components/compare/CompareDrawer.tsx` | 93d116a (2026-03-28) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/ActivityFeed.tsx` | 98bda58 (2026-03-28) | 2 | 23ef3a7 (2026-03-31) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/BreakManager.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/CategoryPageShell.tsx` | 98bda58 (2026-03-28) | 1 | 2e07639 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/ClientPhotosTab.tsx` | 8dd783d (2026-03-23) | 3 | 0644bef (2026-04-01) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/ClosureManager.tsx` | 8dd783d (2026-03-23) | 5 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/CommandPalette.tsx` | 98bda58 (2026-03-28) | 1 | f0c993e (2026-04-04) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/DashboardLayout.tsx` | 8dd783d (2026-03-23) | 9 | a2e16ec (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/DisputeNotification.tsx` | 823f70d (2026-03-23) | 3 | 98bda58 (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/ForecastWidget.tsx` | 766412e (2026-03-28) | 1 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/FormulaTab.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/FrozenSalonBanner.tsx` | a591cd0 (2026-03-23) | 4 | 98bda58 (2026-03-28) | — | NO | **orphan** |
| `components/dashboard/GalleryManager.tsx` | 1336d1b (2026-03-26) | 3 | b6c322b (2026-04-22) | black;dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/GiftCardManager.tsx` | 8dd783d (2026-03-23) | 3 | ef99423 (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/GoLiveGate.tsx` | adcd252 (2026-03-23) | 2 | f0c993e (2026-04-04) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/HeatmapChart.tsx` | 8dd783d (2026-03-23) | 3 | bd67f9e (2026-03-23) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/IntakeFormTab.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/LastMinuteManager.tsx` | 7d95ca7 (2026-04-01) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/MiniSparkline.tsx` | 8dd783d (2026-03-23) | 3 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/dashboard/NotificationCenter.tsx` | 98bda58 (2026-03-28) | 1 | 23ef3a7 (2026-03-31) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/OffPeakManager.tsx` | 2b939e0 (2026-03-24) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/PackageManager.tsx` | 8dd783d (2026-03-23) | 5 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/PriceAdjustmentModal.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/PromoManager.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/ReferralDashboard.tsx` | 8dd783d (2026-03-23) | 3 | 23ef3a7 (2026-03-31) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/SalonAboutEditor.tsx` | 1336d1b (2026-03-26) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/ScheduleGrid.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/SetupBanner.tsx` | 8dd783d (2026-03-23) | 4 | 958cbe2 (2026-04-03) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/SolenScoreCard.tsx` | 8dd783d (2026-03-23) | 4 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/StaffComparison.tsx` | 8dd783d (2026-03-23) | 3 | 958cbe2 (2026-04-03) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/StatCard.tsx` | 98bda58 (2026-03-28) | 1 | 98bda58 (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/WalkInModal.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/barber/BarberLeaderboard.tsx` | 8dd783d (2026-03-23) | 5 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/barber/ChairManager.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/barber/ExpressMenu.tsx` | 932950b (2026-03-27) | 1 | ef99423 (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/barber/FadeBlueprint.tsx` | 932950b (2026-03-27) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/barber/HeadDiagram.tsx` | f7e2b66 (2026-03-28) | 1 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/barber/LiveQueuePanel.tsx` | 932950b (2026-03-27) | 2 | c0328c3 (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/barber/LoyaltyConfig.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/barber/PLComparison.tsx` | 766412e (2026-03-28) | 1 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/barber/SmartReminderConfig.tsx` | 8dd783d (2026-03-23) | 5 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/barber/WalkinAnalytics.tsx` | 8dd783d (2026-03-23) | 4 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/barber/WalkinHourlyChart.tsx` | 766412e (2026-03-28) | 1 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/coiffeur/AllergyAlert.tsx` | 766412e (2026-03-28) | 1 | 6792ab1 (2026-03-28) | dark-mode | YES | **drifted** |
| `components/dashboard/coiffeur/ColourCycleConfig.tsx` | 932950b (2026-03-27) | 1 | 23ef3a7 (2026-03-31) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/coiffeur/ConsultationNotes.tsx` | 932950b (2026-03-27) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/coiffeur/FormulaBook.tsx` | 932950b (2026-03-27) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/coiffeur/FormulaPhotoUpload.tsx` | 766412e (2026-03-28) | 1 | 766412e (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/makeup/BridalPlanner.tsx` | fd06128 (2026-03-27) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/makeup/FaceChartBuilder.tsx` | fd06128 (2026-03-27) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/makeup/KitInventory.tsx` | fd06128 (2026-03-27) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/makeup/SkinToneMatcher.tsx` | fd06128 (2026-03-27) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/nail/AiArtGallery.tsx` | 766412e (2026-03-28) | 1 | 23ef3a7 (2026-03-31) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/nail/AiArtGenerator.tsx` | 59590bf (2026-03-24) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/nail/DynamicPricingConfig.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/nail/InfillReminderConfig.tsx` | 8dd783d (2026-03-23) | 4 | 23ef3a7 (2026-03-31) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/nail/NailClientTab.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/nail/NailPreferencesForm.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/nail/RetailManager.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/nail/RetailSalesDashboard.tsx` | 766412e (2026-03-28) | 1 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/nail/StationManager.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/spa/ContraindicationAlert.tsx` | 766412e (2026-03-28) | 1 | 766412e (2026-03-28) | dark-mode | YES | **drifted** |
| `components/dashboard/spa/RoomManager.tsx` | b938098 (2026-03-27) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/spa/SpaIntake.tsx` | b938098 (2026-03-27) | 1 | 98bda58 (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/spa/TreatmentOutcome.tsx` | 766412e (2026-03-28) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/spa/WellnessJournal.tsx` | b938098 (2026-03-27) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/waxing/BodyZoneSelector.tsx` | 5c150ff (2026-03-27) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/waxing/RebookAlerts.tsx` | 766412e (2026-03-28) | 1 | c2816fd (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/waxing/RegrowthConfig.tsx` | 5c150ff (2026-03-27) | 2 | c2816fd (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/waxing/RegrowthTimeline.tsx` | 766412e (2026-03-28) | 1 | c2816fd (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/dashboard/waxing/SensitivityLog.tsx` | 5c150ff (2026-03-27) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/waxing/ZonePackages.tsx` | 5c150ff (2026-03-27) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/dashboard/waxing/ZoneRevenueChart.tsx` | 766412e (2026-03-28) | 1 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/AIProcessingIndicator.tsx` | 8dd783d (2026-03-23) | 0 | 766412e (2026-03-28) | — | YES | **conformant** |
| `components/discovery/AISuggestionPills.tsx` | 17370b6 (2026-03-27) | 3 | f0c993e (2026-04-04) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/BookCTA.tsx` | 8dd783d (2026-03-23) | 3 | a2e16ec (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/CategoryPills.tsx` | 8dd783d (2026-03-23) | 3 | 2c73438 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/CategoryTabBar.tsx` | 7a244cd (2026-03-25) | 1 | dab1e2a (2026-04-04) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/CommentSection.tsx` | 8dd783d (2026-03-23) | 3 | 0644bef (2026-04-01) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/CutGuide.tsx` | 8dd783d (2026-03-23) | 0 | 9bbee0d (2026-03-25) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/DescriptionCard.tsx` | 8dd783d (2026-03-23) | 3 | 9bbee0d (2026-03-25) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/DetailPage.tsx` | 8dd783d (2026-03-23) | 4 | 15cb7a9 (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/DiscoveryAdmin.tsx` | 8dd783d (2026-03-23) | 4 | 958cbe2 (2026-04-03) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/DiscoveryEmptyState.tsx` | 8dd783d (2026-03-23) | 0 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/DiscoveryErrorState.tsx` | 8dd783d (2026-03-23) | 0 | 766412e (2026-03-28) | — | YES | **conformant** |
| `components/discovery/DiscoveryGridSkeleton.tsx` | 8dd783d (2026-03-23) | 4 | 7a244cd (2026-03-25) | — | YES | **conformant** |
| `components/discovery/FeaturedBoards.tsx` | 8dd783d (2026-03-23) | 4 | 766412e (2026-03-28) | — | YES | **conformant** |
| `components/discovery/FilterDrawer.tsx` | 8dd783d (2026-03-23) | 5 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/ForYouSection.tsx` | 8dd783d (2026-03-23) | 3 | 6ca0be0 (2026-04-02) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/GenderToggle.tsx` | 8dd783d (2026-03-23) | 3 | 2c73438 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/ImportProgressBar.tsx` | 8dd783d (2026-03-23) | 0 | 958cbe2 (2026-04-03) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/InlinePrefsPanel.tsx` | 12ad675 (2026-03-27) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/ItemCard.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | black;dark-mode | YES | **drifted** |
| `components/discovery/KISection.tsx` | a6f2a0c (2026-03-25) | 1 | 2c73438 (2026-03-28) | zone-or-dm-token | NO | **orphan** |
| `components/discovery/LikeButton.tsx` | 8dd783d (2026-03-23) | 5 | a2e16ec (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/MasonryGrid.tsx` | 8dd783d (2026-03-23) | 3 | bd67f9e (2026-03-23) | — | YES | **conformant** |
| `components/discovery/PatternSelector.tsx` | 8dd783d (2026-03-23) | 4 | db5b1b9 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/PickStylistFlow.tsx` | 8dd783d (2026-03-23) | 3 | dc9a242 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/PostFromDiscover.tsx` | 8dd783d (2026-03-23) | 3 | b08e234 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/ProductRecommendations.tsx` | 8dd783d (2026-03-23) | 3 | 9bbee0d (2026-03-25) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/ProfileDiscoverySections.tsx` | 8dd783d (2026-03-23) | 3 | 6d84f4b (2026-04-04) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/ProfileSetupModal.tsx` | 8dd783d (2026-03-23) | 5 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/RelatedTikToks.tsx` | 8dd783d (2026-03-23) | 3 | dc9a242 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/ReportButton.tsx` | 8dd783d (2026-03-23) | 3 | 2c73438 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/SalonScript.tsx` | 8dd783d (2026-03-23) | 3 | 9bbee0d (2026-03-25) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/SaveButton.tsx` | 8dd783d (2026-03-23) | 3 | db5b1b9 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/SearchBar.tsx` | 8dd783d (2026-03-23) | 3 | 2c73438 (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/ShareButton.tsx` | 8dd783d (2026-03-23) | 3 | 2c73438 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/SimilarStyles.tsx` | 8dd783d (2026-03-23) | 3 | 6ca0be0 (2026-04-02) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/SourceBadge.tsx` | 8dd783d (2026-03-23) | 3 | 2c73438 (2026-03-28) | — | NO | **orphan** |
| `components/discovery/StaffPortfolio.tsx` | 8dd783d (2026-03-23) | 3 | 2c73438 (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/StyleNamePills.tsx` | 8dd783d (2026-03-23) | 4 | 23ef3a7 (2026-03-31) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/ToSCheckbox.tsx` | 8dd783d (2026-03-23) | 3 | bd67f9e (2026-03-23) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/discovery/UserPostsSection.tsx` | 8dd783d (2026-03-23) | 3 | 2c73438 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/discovery/VideoCard.tsx` | 8dd783d (2026-03-23) | 5 | 0de8582 (2026-04-21) | black;dark-mode | YES | **drifted** |
| `components/disputes/ReportProblemButton.tsx` | a591cd0 (2026-03-23) | 3 | 98bda58 (2026-03-28) | dark-mode | NO | **orphan** |
| `components/disputes/ReportProblemModal.tsx` | a591cd0 (2026-03-23) | 3 | f0c993e (2026-04-04) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/editor/DeviceFrame.tsx` | 8dd783d (2026-03-23) | 3 | a29ac2b (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/editor/EditPanel.tsx` | 8dd783d (2026-03-23) | 3 | 98bda58 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/editor/EditorPage.tsx` | 8dd783d (2026-03-23) | 3 | c36fb8b (2026-03-24) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/editor/RequestList.tsx` | 8dd783d (2026-03-23) | 3 | 98bda58 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/global/TOSUpdateBanner.tsx` | 87cfaf3 (2026-03-23) | 3 | c36fb8b (2026-03-24) | — | YES | **conformant** |
| `components/icons/category/BarberIcon.tsx` | 4865a0c (2026-03-26) | 3 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/icons/category/CoiffeurIcon.tsx` | 4865a0c (2026-03-26) | 4 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/icons/category/MakeupIcon.tsx` | 4865a0c (2026-03-26) | 3 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/icons/category/NailsIcon.tsx` | 4865a0c (2026-03-26) | 3 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/icons/category/SpaIcon.tsx` | 4865a0c (2026-03-26) | 3 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/icons/category/WaxingIcon.tsx` | 4865a0c (2026-03-26) | 3 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/layout/BottomNav.tsx` | 8dd783d (2026-03-23) | 3 | b6c322b (2026-04-22) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/layout/BottomTabBar.tsx` | 4711e97 (2026-03-29) | 3 | 0de8582 (2026-04-21) | black;dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/layout/CategoryStickyRow.tsx` | 6c4d6ba (2026-03-30) | 2 | 67dfb34 (2026-04-03) | — | NO | **orphan** |
| `components/layout/FloatingNavPill.tsx` | 5e80927 (2026-04-06) | 1 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/layout/Footer.tsx` | 8dd783d (2026-03-23) | 10 | f7ed0a9 (2026-04-13) | font | NO | **orphan** |
| `components/layout/Header.tsx` | 8dd783d (2026-03-23) | 18 | b08e234 (2026-04-21) | rounded-leftover;black | YES | **drifted** |
| `components/layout/MotionProvider.tsx` | 35d0f35 (2026-04-04) | 0 | 35d0f35 (2026-04-04) | — | YES | **conformant** |
| `components/layout/PageTransition.tsx` | 5823bed (2026-04-02) | 0 | aee893e (2026-04-04) | — | NO | **orphan** |
| `components/layout/PageTransitionWrapper.tsx` | 5823bed (2026-04-02) | 0 | 5823bed (2026-04-02) | — | YES | **conformant** |
| `components/loyalty/StampCard.tsx` | 8dd783d (2026-03-23) | 4 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/makeup/MakeupSections.tsx` | 764f53d (2026-03-23) | 2 | fcddc6f (2026-03-28) | — | YES | **conformant** |
| `components/nail/AllergyWarning.tsx` | 8dd783d (2026-03-23) | 3 | 23ef3a7 (2026-03-31) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/nail/DesignHistoryTimeline.tsx` | 8dd783d (2026-03-23) | 3 | 23ef3a7 (2026-03-31) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/nail/HandChart.tsx` | 98bda58 (2026-03-28) | 2 | b963f6a (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/nail/InspoBoard.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/nail/InspoUploader.tsx` | 8dd783d (2026-03-23) | 3 | d599845 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/nail/MaterialSelector.tsx` | 8dd783d (2026-03-23) | 3 | bf0c1d7 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/nail/NailBookingSteps.tsx` | 8dd783d (2026-03-23) | 3 | 23ef3a7 (2026-03-31) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/nail/NailDesignCard.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | black;dark-mode | NO | **orphan** |
| `components/nail/NailDiscoveryFilters.tsx` | 8dd783d (2026-03-23) | 3 | 9db4c02 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/nail/NailDiscoveryGrid.tsx` | 8dd783d (2026-03-23) | 3 | b963f6a (2026-03-28) | — | NO | **orphan** |
| `components/nail/NailsSections.tsx` | 764f53d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/nail/RetailCheckout.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/nail/ShapeLengthPicker.tsx` | 8dd783d (2026-03-23) | 3 | 9db4c02 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/nail/TechPortfolio.tsx` | 8dd783d (2026-03-23) | 3 | 9db4c02 (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/notifications/NotificationBell.tsx` | ad85cff (2026-03-23) | 3 | a29ac2b (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/notifications/NotificationItem.tsx` | ad85cff (2026-03-23) | 3 | a0d776a (2026-03-24) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/onboarding/SetupWizard.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/onboarding/steps/GoLiveStep.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | rounded-leftover;dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/onboarding/steps/OpeningHoursStep.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/onboarding/steps/PaymentsStep.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/onboarding/steps/SalonProfileStep.tsx` | 8dd783d (2026-03-23) | 5 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/onboarding/steps/ScheduleStep.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/onboarding/steps/ServicesStep.tsx` | 8dd783d (2026-03-23) | 5 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/onboarding/steps/TeamStep.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/partner/PartnerSignupForm.tsx` | b1f170e (2026-03-27) | 1 | 98bda58 (2026-03-28) | rounded-leftover;dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/profile/BeautyProfileCard.tsx` | c280c2a (2026-03-26) | 1 | be9c9b3 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/profile/BeautyProfileEditModal.tsx` | c700174 (2026-03-26) | 2 | b08e234 (2026-04-21) | black;dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/profile/DeleteAccountModal.tsx` | 5481e54 (2026-04-02) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/profile/LooksGrid.tsx` | c280c2a (2026-03-26) | 1 | 8980f5e (2026-04-04) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/profile/PaymentMethodsSection.tsx` | 3f5e661 (2026-03-27) | 1 | be9c9b3 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/profile/ProfileHero.tsx` | c280c2a (2026-03-26) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/profile/ProfileTabs.tsx` | c280c2a (2026-03-26) | 1 | be9c9b3 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/profile/SalonHighlights.tsx` | c280c2a (2026-03-26) | 1 | dab1e2a (2026-04-04) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/salon/BookingSidebar.tsx` | 391d8bf (2026-04-02) | 1 | f7ed0a9 (2026-04-13) | rounded-leftover | NO | **orphan** |
| `components/salon/MobileBookingBar.tsx` | 391d8bf (2026-04-02) | 1 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/salon/SalonHero.tsx` | 391d8bf (2026-04-02) | 1 | f0c993e (2026-04-04) | — | YES | **conformant** |
| `components/salon/SalonMobileCTA.tsx` | 391d8bf (2026-04-02) | 1 | f7ed0a9 (2026-04-13) | — | YES | **conformant** |
| `components/salon/SalonOpeningHours.tsx` | 391d8bf (2026-04-02) | 1 | ae8be83 (2026-04-04) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/salon/SalonPageSkeleton.tsx` | cd59356 (2026-04-04) | 1 | cd59356 (2026-04-04) | — | YES | **conformant** |
| `components/salon/SalonReviews.tsx` | 391d8bf (2026-04-02) | 2 | 633fb66 (2026-04-22) | — | YES | **conformant** |
| `components/salon/SalonSectionNav.tsx` | 391d8bf (2026-04-02) | 1 | ed0b08a (2026-04-04) | — | YES | **conformant** |
| `components/salon/SalonServices.tsx` | 391d8bf (2026-04-02) | 1 | cd59356 (2026-04-04) | — | YES | **conformant** |
| `components/salon/SalonSidebar.tsx` | 391d8bf (2026-04-02) | 2 | f7ed0a9 (2026-04-13) | rounded-leftover | YES | **drifted** |
| `components/salon/SalonTabBar.tsx` | 1336d1b (2026-03-26) | 1 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/salon/ServiceCategoryFilter.tsx` | 1336d1b (2026-03-26) | 1 | d599845 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/salon/SimilarSalons.tsx` | e54f264 (2026-03-25) | 1 | 98bda58 (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/salon/StaffSection.tsx` | 60a8824 (2026-03-24) | 4 | f7ed0a9 (2026-04-13) | — | YES | **conformant** |
| `components/search/MobileViewToggle.tsx` | c57bc07 (2026-03-24) | 0 | a29ac2b (2026-03-28) | — | NO | **orphan** |
| `components/search/SearchCriteriaChips.tsx` | a806502 (2026-03-30) | 1 | a806502 (2026-03-30) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/search/SearchResultGrid.tsx` | c57bc07 (2026-03-24) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/search/SplitView.tsx` | c57bc07 (2026-03-24) | 2 | a20d49f (2026-03-30) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/shared/BodyDiagram.tsx` | f7e2b66 (2026-03-28) | 1 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/shared/ClientSelectorDropdown.tsx` | fef50bd (2026-03-28) | 1 | 23ef3a7 (2026-03-31) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/shared/FaceDiagram.tsx` | f7e2b66 (2026-03-28) | 1 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/shared/HandDiagram.tsx` | f7e2b66 (2026-03-28) | 1 | f7ed0a9 (2026-04-13) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/shared/InteractiveZoneDiagram.tsx` | f7e2b66 (2026-03-28) | 1 | f7ed0a9 (2026-04-13) | zone-or-dm-token | NO | **orphan** |
| `components/spa/SpaSections.tsx` | 764f53d (2026-03-23) | 2 | 6d84f4b (2026-04-04) | — | YES | **conformant** |
| `components/staff/StaffAvailability.tsx` | fbe6f96 (2026-03-27) | 1 | a29ac2b (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/staff/StaffProfilePage.tsx` | 60a8824 (2026-03-24) | 1 | 0de8582 (2026-04-21) | black;dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/AddressAutocomplete.tsx` | 8dd783d (2026-03-23) | 3 | 92546a3 (2026-03-24) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/AirbnbSearchBar.tsx` | ff70b2d (2026-03-30) | 2 | b08e234 (2026-04-21) | emoji-UI | NO | **orphan** |
| `components/ui/AnimatedButton.tsx` | 8dd783d (2026-03-23) | 3 | a2e16ec (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/BottomSheet.tsx` | 8dd783d (2026-03-23) | 4 | a727550 (2026-04-04) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/Breadcrumb.tsx` | 8dd783d (2026-03-23) | 3 | 573b11e (2026-04-02) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/CategorySkeleton.tsx` | 430aa6b (2026-03-30) | 1 | 1b29df8 (2026-03-31) | rounded-leftover;dark-mode | NO | **orphan** |
| `components/ui/CategoryTree.tsx` | 8dd783d (2026-03-23) | 3 | ba0b70a (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/CityCarouselSection.tsx` | ff70b2d (2026-03-30) | 3 | 4dae6fe (2026-03-31) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/CookieBanner.tsx` | 8dd783d (2026-03-23) | 4 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/DateRangePicker.tsx` | 98bda58 (2026-03-28) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/DiscoverCarousel.tsx` | 3f0afcc (2026-03-26) | 8 | 0de8582 (2026-04-21) | rounded-leftover | NO | **orphan** |
| `components/ui/EmptyState.tsx` | 8dd783d (2026-03-23) | 4 | 958cbe2 (2026-04-03) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/ErrorFallback.tsx` | 1558af8 (2026-03-24) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/ExpandableTabs.tsx` | 8dd783d (2026-03-23) | 3 | a29ac2b (2026-03-28) | — | YES | **conformant** |
| `components/ui/ExportButton.tsx` | 98bda58 (2026-03-28) | 1 | a2e16ec (2026-03-28) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/FeaturedSalonCarousel.figma.tsx` | f7ed0a9 (2026-04-13) | 0 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/ui/FeaturedSalonCarousel.tsx` | 8188325 (2026-03-30) | 8 | feff9e1 (2026-04-21) | font | NO | **orphan** |
| `components/ui/FilterBar.tsx` | cd51f25 (2026-03-25) | 2 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/FilterBottomSheet.tsx` | cd51f25 (2026-03-25) | 1 | a29ac2b (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/FilterDrawer.tsx` | cd51f25 (2026-03-25) | 1 | 4d263d1 (2026-03-29) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/GlassCard.tsx` | 8dd783d (2026-03-23) | 3 | a29ac2b (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/GlassModal.tsx` | 8dd783d (2026-03-23) | 4 | a727550 (2026-04-04) | — | NO | **orphan** |
| `components/ui/GuidedSearch.tsx` | d74ab07 (2026-03-29) | 14 | 0de8582 (2026-04-21) | black;dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/HeroVisualCard.tsx` | 91699c8 (2026-03-25) | 2 | b08e234 (2026-04-21) | font | NO | **orphan** |
| `components/ui/HomeSearchBar.tsx` | 8dd783d (2026-03-23) | 6 | 15020d7 (2026-03-29) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/HomepageHero.figma.tsx` | f7ed0a9 (2026-04-13) | 0 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/ui/HomepageHero.tsx` | 35da0f2 (2026-04-04) | 5 | 32ec080 (2026-04-21) | — | NO | **orphan** |
| `components/ui/HowItWorks.tsx` | f39d512 (2026-04-06) | 1 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/ui/ImageFallback.tsx` | bf77558 (2026-04-04) | 1 | bf77558 (2026-04-04) | — | NO | **orphan** |
| `components/ui/ImageUpload.tsx` | 4eb8131 (2026-04-01) | 1 | 4eb8131 (2026-04-01) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/ImageUploader.tsx` | 8dd783d (2026-03-23) | 3 | a29ac2b (2026-03-28) | — | NO | **orphan** |
| `components/ui/LanguageSwitcher.tsx` | 8dd783d (2026-03-23) | 4 | 5da4d35 (2026-04-01) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/LastMinuteStrip.figma.tsx` | f7ed0a9 (2026-04-13) | 0 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/ui/LastMinuteStrip.tsx` | a4b7e6f (2026-04-04) | 2 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/ui/PWAInstallPrompt.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/PageState.tsx` | f8af51a (2026-04-21) | 1 | 32ec080 (2026-04-21) | — | NO | **orphan** |
| `components/ui/PhotoLightbox.tsx` | 391d8bf (2026-04-02) | 1 | 85494af (2026-04-02) | rounded-leftover;black | NO | **orphan** |
| `components/ui/PriceOfferModal.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/PriceSlider.tsx` | 8dd783d (2026-03-23) | 3 | 98bda58 (2026-03-28) | — | NO | **orphan** |
| `components/ui/ProgressDots.tsx` | 8dd783d (2026-03-23) | 3 | a29ac2b (2026-03-28) | — | NO | **orphan** |
| `components/ui/QuickPreviewSheet.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/ReportContentButton.tsx` | 19903bd (2026-03-23) | 3 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/SalonBadge.tsx` | ecdee1b (2026-04-01) | 1 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/ui/SalonCardSkeleton.tsx` | 2f1d70e (2026-03-28) | 0 | 40387d6 (2026-04-21) | — | NO | **orphan** |
| `components/ui/ScrollableFilterRow.tsx` | 3139b8b (2026-03-26) | 1 | 20c0b46 (2026-03-29) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/SearchAutocomplete.tsx` | 8dd783d (2026-03-23) | 4 | 391d8bf (2026-04-02) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/SearchBar.tsx` | 8dd783d (2026-03-23) | 3 | a727550 (2026-04-04) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/ServiceAutosuggest.tsx` | 5da4d35 (2026-04-01) | 1 | 4799d68 (2026-04-02) | rounded-leftover | NO | **orphan** |
| `components/ui/Skeleton.tsx` | 8dd783d (2026-03-23) | 3 | 40387d6 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/SocialProofStrip.tsx` | 8dd783d (2026-03-23) | 5 | 2c73438 (2026-03-28) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/SolenExclusiveBadge.tsx` | 8dd783d (2026-03-23) | 3 | a29ac2b (2026-03-28) | dark-mode | YES | **drifted** |
| `components/ui/SortDropdown.tsx` | 5da4d35 (2026-04-01) | 1 | 5da4d35 (2026-04-01) | — | NO | **orphan** |
| `components/ui/Spinner.tsx` | 8dd783d (2026-03-23) | 0 | 98bda58 (2026-03-28) | — | YES | **conformant** |
| `components/ui/StickyMobileCTA.tsx` | 8dd783d (2026-03-23) | 3 | bf22e7f (2026-03-25) | — | NO | **orphan** |
| `components/ui/SubCategoryChips.tsx` | 5da4d35 (2026-04-01) | 1 | 67dfb34 (2026-04-03) | — | NO | **orphan** |
| `components/ui/ThemeScript.tsx` | 8dd783d (2026-03-23) | 0 | 32049ae (2026-04-04) | — | YES | **conformant** |
| `components/ui/ThemeToggle.tsx` | 8dd783d (2026-03-23) | 3 | 8efdb9b (2026-03-31) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/Toast.tsx` | 8dd783d (2026-03-23) | 3 | eb867e0 (2026-04-04) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/TrustBadges.tsx` | 8dd783d (2026-03-23) | 0 | a29ac2b (2026-03-28) | — | NO | **orphan** |
| `components/ui/TypingIndicator.tsx` | 8dd783d (2026-03-23) | 0 | bd67f9e (2026-03-23) | dark-mode | NO | **orphan** |
| `components/ui/WaitlistModal.tsx` | 81a2025 (2026-03-29) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/beauty-icons.tsx` | 68b3bd6 (2026-03-26) | 1 | 68b3bd6 (2026-03-26) | — | NO | **orphan** |
| `components/ui/border-beam.tsx` | 81a2025 (2026-03-29) | 1 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/ui/button.tsx` | 81a2025 (2026-03-29) | 1 | 0de8582 (2026-04-21) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/card.tsx` | 81a2025 (2026-03-29) | 1 | 81a2025 (2026-03-29) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/category-icons.tsx` | 430aa6b (2026-03-30) | 1 | 430aa6b (2026-03-30) | — | NO | **orphan** |
| `components/ui/date-picker.tsx` | 8dd783d (2026-03-23) | 4 | e0280ed (2026-04-04) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/expandable-tabs.tsx` | 8dd783d (2026-03-23) | 3 | 9488c1a (2026-03-26) | dark-mode;zone-or-dm-token | NO | **orphan** |
| `components/ui/input.tsx` | 81a2025 (2026-03-29) | 0 | 28de02f (2026-04-03) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/interactive-hover-button.tsx` | 8dd783d (2026-03-23) | 3 | 0de8582 (2026-04-21) | — | YES | **conformant** |
| `components/ui/label.tsx` | 81a2025 (2026-03-29) | 0 | 81a2025 (2026-03-29) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/sidebar.tsx` | 8dd783d (2026-03-23) | 3 | 6a09e4f (2026-03-29) | — | NO | **orphan** |
| `components/ui/tabs.tsx` | 81a2025 (2026-03-29) | 1 | 81a2025 (2026-03-29) | dark-mode;zone-or-dm-token | YES | **drifted** |
| `components/ui/tracing-beam.tsx` | 81a2025 (2026-03-29) | 1 | f7ed0a9 (2026-04-13) | — | NO | **orphan** |
| `components/waxing/WaxingSections.tsx` | 764f53d (2026-03-23) | 2 | 6d84f4b (2026-04-04) | — | YES | **conformant** |


---

## Summary (corrected — see note below)

**Total components:** 339

### Drift markers seen in components/

| marker | files |
|---|---|
| dark-mode | 254 |
| zone-or-dm-token | 246 |
| black | 12 |
| rounded-leftover | 9 |
| font | 6 |
| emoji-UI | 1 |

### Verdict (corrected — original "used" check only searched app/, missed component-to-component imports)

Real numbers using a broader import grep (app/ + components/ + lib/ + hooks/, regex `from ['"](\.|@/)[^'"]*/<filename>['"]`):

- **285 imported** (84%)
- **54 orphan** (16%) — listed below

**Drift markers cut across the imported and orphan groups.** Many imported components still have drift; many orphans are also clean.

### Orphan list (54 files — not imported anywhere in app/components/lib/hooks)

Some are intentionally orphan (e.g. unused experiments, candidate-for-deletion); some may be wired up via dynamic imports / feature flags / .figma.tsx variants. Review case by case.

- `components/CategoryHero.tsx`
- `components/ReviewCarousel.tsx`
- `components/TerminePage.tsx`
- `components/_archive/QuartierTile.tsx`
- `components/_archive/RecommendedSalons.tsx`
- `components/_archive/WaitlistModal.tsx`
- `components/_archive/WeatherBanner.tsx`
- `components/barber/CutHistoryTimeline.tsx`
- `components/barber/LoyaltyCardList.tsx`
- `components/barber/WalkinQueue.tsx`
- `components/dashboard/BreakManager.tsx`
- `components/dashboard/CategoryPageShell.tsx`
- `components/dashboard/ClosureManager.tsx`
- `components/dashboard/FrozenSalonBanner.tsx`
- `components/dashboard/GoLiveGate.tsx`
- `components/dashboard/PriceAdjustmentModal.tsx`
- `components/dashboard/ScheduleGrid.tsx`
- `components/dashboard/SolenScoreCard.tsx`
- `components/dashboard/barber/ChairManager.tsx`
- `components/dashboard/waxing/RegrowthTimeline.tsx`
- `components/discovery/CutGuide.tsx`
- `components/discovery/KISection.tsx`
- `components/layout/BottomNav.tsx`
- `components/nail/NailDiscoveryGrid.tsx`
- `components/nail/RetailCheckout.tsx`
- `components/salon/BookingSidebar.tsx`
- `components/salon/MobileBookingBar.tsx`
- `components/salon/SalonTabBar.tsx`
- `components/shared/HandDiagram.tsx`
- `components/ui/AnimatedButton.tsx`
- `components/ui/CategorySkeleton.tsx`
- `components/ui/CityCarouselSection.tsx`
- `components/ui/DiscoverCarousel.tsx`
- `components/ui/FeaturedSalonCarousel.figma.tsx`
- `components/ui/GlassCard.tsx`
- `components/ui/HeroVisualCard.tsx`
- `components/ui/HomeSearchBar.tsx`
- `components/ui/HomepageHero.figma.tsx`
- `components/ui/HowItWorks.tsx`
- `components/ui/LastMinuteStrip.figma.tsx`
- `components/ui/PriceSlider.tsx`
- `components/ui/ProgressDots.tsx`
- `components/ui/SalonCardSkeleton.tsx`
- `components/ui/SocialProofStrip.tsx`
- `components/ui/ThemeToggle.tsx`
- `components/ui/WaitlistModal.tsx`
- `components/ui/border-beam.tsx`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/category-icons.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/tabs.tsx`
- `components/ui/tracing-beam.tsx`
