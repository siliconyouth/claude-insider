/**
 * System Information Section
 *
 * Displays basic system and application information.
 */

import { ACHIEVEMENTS } from "@/lib/achievements";
import { SOUND_CATEGORIES } from "../diagnostics.types";

export function SystemInfoSection() {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        System Information
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <label className="text-xs text-gray-500 uppercase">Version</label>
          <p className="text-white font-mono">0.86.0</p>
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase">Environment</label>
          <p className="text-white">
            {process.env.NODE_ENV || "development"}
          </p>
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase">
            Total Achievements
          </label>
          <p className="text-white">{Object.keys(ACHIEVEMENTS).length}</p>
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase">Sound Types</label>
          <p className="text-white">
            {Object.values(SOUND_CATEGORIES).flat().length}
          </p>
        </div>
      </div>
    </section>
  );
}
