"use client";

/**
 * Profile Basics Step
 *
 * Step 1: Collect display name, bio, and avatar.
 * This is a required step (not skippable).
 */

import { cn } from "@/lib/design-system";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";
import { StepWrapper } from "../shared/step-wrapper";
import { AvatarUpload } from "../shared/avatar-upload";

export function ProfileBasicsStep() {
  const { data, updateData, setError } = useWizard();

  const handleNext = async (): Promise<boolean> => {
    // Validate display name
    const trimmedName = data.displayName.trim();
    if (!trimmedName) {
      setError("Display name is required");
      return false;
    }

    if (trimmedName.length < 2) {
      setError("Display name must be at least 2 characters");
      return false;
    }

    if (trimmedName.length > 50) {
      setError("Display name must be less than 50 characters");
      return false;
    }

    // Upload avatar if one was selected
    if (data.avatarFile) {
      try {
        const formData = new FormData();
        formData.append("avatar", data.avatarFile);

        const response = await fetch("/api/user/avatar", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload avatar");
        }

        const result = await response.json();

        // Update preview with the permanent URL
        updateData({ avatarPreview: result.url });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload avatar");
        return false;
      }
    }

    // Save profile basics
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: trimmedName,
          bio: data.bio.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      return false;
    }
  };

  return (
    <StepWrapper>
      <div className="space-y-6">
        {/* Avatar upload */}
        <AvatarUpload />

        {/* Display name */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            id="displayName"
            type="text"
            value={data.displayName}
            onChange={(e) => updateData({ displayName: e.target.value })}
            maxLength={50}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg",
              "bg-white dark:bg-gray-900",
              "border border-gray-200 dark:border-gray-700",
              "text-gray-900 dark:text-white",
              "placeholder-gray-400 dark:placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-colors duration-200"
            )}
            placeholder="How should we call you?"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {data.displayName.length}/50
          </p>
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Bio <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="bio"
            value={data.bio}
            onChange={(e) => updateData({ bio: e.target.value })}
            rows={3}
            maxLength={160}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg resize-none",
              "bg-white dark:bg-gray-900",
              "border border-gray-200 dark:border-gray-700",
              "text-gray-900 dark:text-white",
              "placeholder-gray-400 dark:placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-colors duration-200"
            )}
            placeholder="Tell us a bit about yourself..."
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {data.bio.length}/160
          </p>
        </div>
      </div>

      <WizardNavigation onNext={handleNext} />
    </StepWrapper>
  );
}
