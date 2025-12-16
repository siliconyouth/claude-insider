/**
 * Feature Tests
 *
 * Tests for Sound Effects and Achievement systems.
 */

import { ACHIEVEMENTS } from "@/lib/achievements";
import type { TestSuite } from "../diagnostics.types";
import { SOUND_CATEGORIES } from "../diagnostics.types";
import { createTest } from "./test-utils";

export const featureTests: TestSuite[] = [
  createTest("Sound Effects System", "features", async () => {
    const soundCount = Object.values(SOUND_CATEGORIES).flat().length;
    return {
      status: soundCount > 0 ? "success" : "warning",
      message: `${soundCount} sound types available`,
      details: { soundCount },
    };
  }),

  createTest("Achievement System", "features", async () => {
    const achievementCount = Object.keys(ACHIEVEMENTS).length;
    return {
      status: achievementCount > 0 ? "success" : "warning",
      message: `${achievementCount} achievements configured`,
      details: { achievementCount },
    };
  }),
];
