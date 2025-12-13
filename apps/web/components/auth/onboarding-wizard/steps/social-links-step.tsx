"use client";

/**
 * Social Links Step
 *
 * Step 2: Collect social media profile links.
 * This is a skippable step.
 */

import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";
import { StepWrapper, StepInfoBox } from "../shared/step-wrapper";
import { SocialInput } from "../shared/social-input";
import { SOCIAL_PLATFORMS } from "@/types/onboarding";
import type { SocialPlatformId, SocialLinks } from "@/types/onboarding";
import { validateAllSocialLinks } from "@/lib/validations/social-links";

export function SocialLinksStep() {
  const { data, updateData, setError } = useWizard();

  const handleSocialLinkChange = (platform: SocialPlatformId, value: string) => {
    updateData({
      socialLinks: {
        ...data.socialLinks,
        [platform]: value,
      },
    });
  };

  const handleNext = async (): Promise<boolean> => {
    // Check if any links are provided
    const hasLinks = Object.values(data.socialLinks).some((v) => v?.trim());

    if (!hasLinks) {
      // No links provided, skip saving
      return true;
    }

    // Validate all social links
    const { isValid, errors, sanitized } = validateAllSocialLinks(data.socialLinks);

    if (!isValid) {
      const errorMessages = Object.values(errors).filter(Boolean);
      setError(errorMessages[0] || "Please fix the invalid social links");
      return false;
    }

    // Save social links
    try {
      const response = await fetch("/api/user/social-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialLinks: sanitized }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save social links");
      }

      // Update data with sanitized values
      updateData({ socialLinks: sanitized });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save social links");
      return false;
    }
  };

  return (
    <StepWrapper>
      <div className="space-y-5">
        <StepInfoBox>
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <p>
              Add your social links to help others connect with you. All fields are
              optional - fill in only what you want to share.
            </p>
          </div>
        </StepInfoBox>

        <div className="space-y-4">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {platform.label}
              </label>
              <SocialInput
                platform={platform.id}
                value={data.socialLinks[platform.id] || ""}
                onChange={(value) => handleSocialLinkChange(platform.id, value)}
              />
            </div>
          ))}
        </div>
      </div>

      <WizardNavigation onNext={handleNext} showSkip />
    </StepWrapper>
  );
}
