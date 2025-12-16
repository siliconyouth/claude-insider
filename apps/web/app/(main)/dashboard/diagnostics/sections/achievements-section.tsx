/**
 * Achievements Section
 *
 * Tests the achievement notification system with all 50+ achievements
 * grouped by rarity tier.
 */

import { cn } from "@/lib/design-system";
import {
  ACHIEVEMENTS,
  RARITY_CONFIG,
  type AchievementRarity,
} from "@/lib/achievements";

interface AchievementsSectionProps {
  testAchievement: (id: string) => void;
}

export function AchievementsSection({
  testAchievement,
}: AchievementsSectionProps) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Achievement Notifications Test
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Click any achievement to test its notification popup. Each rarity has
        unique animations, colors, and sounds.
      </p>

      {/* Group achievements by rarity */}
      {(["legendary", "epic", "rare", "common"] as AchievementRarity[]).map(
        (rarity) => {
          const achievementsInRarity = Object.entries(ACHIEVEMENTS).filter(
            ([, a]) => a.rarity === rarity
          );
          const config = RARITY_CONFIG[rarity];

          return (
            <div key={rarity} className="mb-6 last:mb-0">
              <h4
                className={cn(
                  "text-sm font-bold uppercase mb-3 flex items-center gap-2",
                  config.color
                )}
              >
                <span>
                  {rarity === "legendary"
                    ? "⭐"
                    : rarity === "epic"
                      ? "💎"
                      : rarity === "rare"
                        ? "🔮"
                        : "🏅"}
                </span>
                {rarity} ({achievementsInRarity.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {achievementsInRarity.map(([id, achievement]) => (
                  <button
                    key={id}
                    onClick={() => {
                      console.log(`Testing achievement: ${id}`);
                      testAchievement(id);
                    }}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all hover:scale-105 hover:shadow-lg",
                      config.bgColor,
                      config.borderColor
                    )}
                    title={achievement.description}
                  >
                    <div className="text-lg mb-1">
                      {achievement.icon && (
                        <achievement.icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-white font-medium text-xs truncate">
                      {achievement.name}
                    </div>
                    <div className="text-gray-400 text-[10px] mt-0.5">
                      +{achievement.points} XP
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        }
      )}
    </section>
  );
}
