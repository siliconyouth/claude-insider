/**
 * ReviewModal Component
 *
 * Modal for reviewing/moderating items with approve/reject actions.
 * Used across dashboard moderation pages.
 */

"use client";

import { useEffect } from "react";
import { cn } from "@/lib/design-system";

interface ReviewModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content/body */
  children: React.ReactNode;
  /** Primary action (e.g., Approve) */
  primaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
    variant?: "primary" | "success" | "danger" | "warning";
    disabled?: boolean;
  };
  /** Secondary action (e.g., Reject) */
  secondaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
    variant?: "danger" | "warning";
    disabled?: boolean;
  };
  /** Additional actions */
  extraActions?: Array<{
    label: string;
    onClick: () => void | Promise<void>;
    variant?: "ghost" | "danger";
    disabled?: boolean;
  }>;
  /** Loading state */
  isLoading?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const buttonVariants = {
  primary: "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white hover:opacity-90",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  warning: "bg-yellow-600 text-white hover:bg-yellow-700",
  ghost: "ui-btn-ghost",
};

export function ReviewModal({
  isOpen,
  onClose,
  title,
  children,
  primaryAction,
  secondaryAction,
  extraActions = [],
  isLoading = false,
  size = "md",
}: ReviewModalProps) {
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        // Account for mobile bottom navigation
        paddingBottom: "calc(1rem + var(--mobile-nav-height, 0px))",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full rounded-xl",
          "ui-bg-modal border ui-border",
          "shadow-2xl",
          "overflow-hidden flex flex-col",
          sizeStyles[size]
        )}
        style={{
          // Max height accounts for mobile nav
          maxHeight: "calc(90vh - var(--mobile-nav-height, 0px))",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b ui-border">
          <h2 id="modal-title" className="text-lg font-semibold ui-text-heading">
            {title}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "p-1 rounded-lg transition-colors",
              isLoading ? "ui-text-muted cursor-not-allowed" : "ui-text-secondary hover:ui-text-heading ui-btn-ghost"
            )}
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {(primaryAction || secondaryAction || extraActions.length > 0) && (
          <div className="flex items-center justify-between px-6 py-4 border-t ui-border">
            <div className="flex items-center gap-2">
              {extraActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  disabled={action.disabled || isLoading}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                    buttonVariants[action.variant || "ghost"],
                    (action.disabled || isLoading) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled || isLoading}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                    buttonVariants[secondaryAction.variant || "danger"],
                    (secondaryAction.disabled || isLoading) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      {secondaryAction.label}
                    </span>
                  ) : (
                    secondaryAction.label
                  )}
                </button>
              )}
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || isLoading}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                    buttonVariants[primaryAction.variant || "primary"],
                    (primaryAction.disabled || isLoading) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      {primaryAction.label}
                    </span>
                  ) : (
                    primaryAction.label
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Confirmation modal for destructive actions
 */
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  variant = "danger",
}: ConfirmModalProps) {
  return (
    <ReviewModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      isLoading={isLoading}
      primaryAction={{
        label: confirmLabel,
        onClick: onConfirm,
        variant: variant,
        disabled: isLoading,
      }}
      extraActions={[
        {
          label: cancelLabel,
          onClick: onClose,
          variant: "ghost",
          disabled: isLoading,
        },
      ]}
    >
      <p className="ui-text-body">{message}</p>
    </ReviewModal>
  );
}

/**
 * Detail row for displaying key-value pairs in modals
 */
interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function DetailRow({ label, value, className }: DetailRowProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4", className)}>
      <span className="text-sm ui-text-secondary sm:w-32 shrink-0">{label}</span>
      <span className="text-sm ui-text-heading">{value}</span>
    </div>
  );
}

/**
 * Notes/textarea field for moderation
 */
interface NotesFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export function NotesField({
  label = "Notes",
  value,
  onChange,
  placeholder = "Add notes...",
  rows = 3,
  disabled = false,
}: NotesFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium ui-text-body">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg px-4 py-3 text-sm resize-none ui-input",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
    </div>
  );
}

/**
 * Loading spinner
 */
function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className={cn("animate-spin border-2 border-current border-t-transparent rounded-full", sizeClass)} />
  );
}
