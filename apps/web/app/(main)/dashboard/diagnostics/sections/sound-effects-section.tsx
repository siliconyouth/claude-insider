/**
 * Sound Effects Section
 *
 * Tests the Web Audio API-based sound effects system.
 */

import { type SoundType } from "@/hooks/use-sound-effects";
import { SOUND_CATEGORIES } from "../diagnostics.types";

interface SoundEffectsSectionProps {
  playSound: (sound: SoundType) => void;
}

export function SoundEffectsSection({ playSound }: SoundEffectsSectionProps) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Sound Effects</h3>
      <div className="space-y-4">
        {Object.entries(SOUND_CATEGORIES).map(([category, soundTypes]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-400 mb-2 capitalize">
              {category}
            </h4>
            <div className="flex flex-wrap gap-2">
              {soundTypes.map((soundType) => (
                <button
                  key={soundType}
                  onClick={() => playSound(soundType)}
                  className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
                >
                  {soundType.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
