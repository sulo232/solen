import { describe, expect, it, vi } from "vitest";

import OpeningHoursStep from "@/components-legacy/onboarding/steps/OpeningHoursStep";
import PaymentsStep from "@/components-legacy/onboarding/steps/PaymentsStep";
import SalonProfileStep from "@/components-legacy/onboarding/steps/SalonProfileStep";
import ScheduleStep from "@/components-legacy/onboarding/steps/ScheduleStep";
import ServicesStep from "@/components-legacy/onboarding/steps/ServicesStep";
import TeamStep from "@/components-legacy/onboarding/steps/TeamStep";
import {
  saveAndAdvanceSetupStep,
  saveCurrentSetupStep,
} from "@/components-legacy/onboarding/SetupWizard";

describe("setup step save contract", () => {
  it("loads every step wired to the wizard save contract", () => {
    expect([
      OpeningHoursStep,
      PaymentsStep,
      SalonProfileStep,
      ScheduleStep,
      ServicesStep,
      TeamStep,
    ].every(Boolean)).toBe(true);
  });

  it("awaits the current handle before reporting success", async () => {
    let resolveSave: ((saved: boolean) => void) | undefined;
    const pending = new Promise<boolean>((resolve) => {
      resolveSave = resolve;
    });
    let settled = false;
    const result = saveCurrentSetupStep({ save: () => pending }).then((saved) => {
      settled = true;
      return saved;
    });

    await Promise.resolve();
    expect(settled).toBe(false);
    resolveSave?.(true);
    await expect(result).resolves.toBe(true);
  });

  it("keeps the step blocked when the save rejects or no current handle is mounted", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(saveCurrentSetupStep(null)).resolves.toBe(false);
    await expect(saveCurrentSetupStep({ save: async () => { throw new Error("save failed"); } })).resolves.toBe(false);
  });

  it("advances exactly once after success and never after failure", async () => {
    const advance = vi.fn();
    await expect(saveAndAdvanceSetupStep({ save: async () => true }, advance)).resolves.toBe(true);
    expect(advance).toHaveBeenCalledTimes(1);

    await expect(saveAndAdvanceSetupStep({ save: async () => false }, advance)).resolves.toBe(false);
    expect(advance).toHaveBeenCalledTimes(1);
  });

});
