"use client";

import {
  useEffect,
  useRef,
  useState,
  useId,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useAnnouncer } from "@/hooks/use-aria-live";
import { useReducedMotion } from "@/hooks/use-animations";

/**
 * Accessible Modal Components
 * Fully accessible dialog/modal implementations
 *
 * Part of the UX System - Pillar 7: Accessibility Refinements
 *
 * Features:
 * - Focus trapping (Tab cycles within modal)
 * - Focus return (focus returns to trigger on close)
 * - Escape key closes modal
 * - Click outside to close
 * - ARIA attributes (role, aria-modal, aria-labelledby, aria-describedby)
 * - Screen reader announcements
 * - Reduced motion support
 * - Portal rendering
 * - Scroll lock
 */

// ============================================
// TYPES
// ============================================

interface AccessibleModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Modal title (required for accessibility) */
  title: string;
  /** Optional description */
  description?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Whether clicking outside closes the modal */
  closeOnClickOutside?: boolean;
  /** Whether pressing Escape closes the modal */
  closeOnEscape?: boolean;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Additional class names for the modal content */
  className?: string;
  /** Announce title to screen readers on open */
  announceOnOpen?: boolean;
  /** Initial focus element ref */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Element to return focus to on close */
  returnFocusRef?: React.RefObject<HTMLElement>;
  /** Custom aria-labelledby if not using title */
  ariaLabelledBy?: string;
  /** Custom aria-describedby if not using description */
  ariaDescribedBy?: string;
}

// ============================================
// SIZE STYLES
// ============================================

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[95vw] max-h-[95vh]",
};

// ============================================
// SCROLL LOCK HOOK
// ============================================

function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

    // Calculate scrollbar width
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
}

// ============================================
// ACCESSIBLE MODAL
// ============================================

export function AccessibleModal({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = "md",
  closeOnClickOutside = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  announceOnOpen = true,
  initialFocusRef,
  returnFocusRef,
  ariaLabelledBy,
  ariaDescribedBy,
}: AccessibleModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const { announce } = useAnnouncer();
  const uniqueId = useId();
  const titleId = `modal-title-${uniqueId}`;
  const descId = `modal-desc-${uniqueId}`;
  const [mounted, setMounted] = useState(false);

  // Focus trap
  const { containerRef } = useFocusTrap({
    enabled: isOpen,
    initialFocusRef,
    returnFocusRef,
    onEscape: closeOnEscape ? onClose : undefined,
    closeOnEscape,
    closeOnClickOutside,
    onClickOutside: closeOnClickOutside ? onClose : undefined,
  });

  // Scroll lock
  useScrollLock(isOpen);

  // Track client-side mount for portal rendering
  useEffect(() => {
     
    setMounted(true);
  }, []);

  // Announce on open
  useEffect(() => {
    if (isOpen && announceOnOpen) {
      announce(`Dialog opened: ${title}`);
    }
  }, [isOpen, announceOnOpen, title, announce]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-black/50 backdrop-blur-sm",
        !prefersReducedMotion && "animate-in fade-in duration-200"
      )}
      role="presentation"
      style={{
        // Account for mobile bottom navigation
        paddingBottom: "calc(1rem + var(--mobile-nav-height, 0px))",
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy || titleId}
        aria-describedby={
          description ? ariaDescribedBy || descId : undefined
        }
        className={cn(
          "relative w-full rounded-lg",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#1a1a1a]",
          "shadow-xl",
          sizeStyles[size],
          !prefersReducedMotion && "animate-in zoom-in-95 duration-200",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#1a1a1a]">
          <h2
            id={titleId}
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "p-2 -mr-2 rounded-lg",
                "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
              aria-label="Close dialog"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Description (if provided) */}
        {description && (
          <p
            id={descId}
            className="px-6 py-2 text-sm text-gray-500 dark:text-gray-400"
          >
            {description}
          </p>
        )}

        {/* Content */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ============================================
// CONFIRMATION DIALOG
// ============================================

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmationDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={message}
      size="sm"
      initialFocusRef={cancelButtonRef as React.RefObject<HTMLElement>}
      showCloseButton={false}
    >
      <div className="flex gap-3 justify-end mt-4">
        <button
          ref={cancelButtonRef}
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 rounded-lg",
            "text-gray-700 dark:text-gray-300",
            "bg-gray-100 dark:bg-gray-800",
            "hover:bg-gray-200 dark:hover:bg-gray-700",
            "transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            "disabled:opacity-50"
          )}
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 rounded-lg",
            "text-white",
            variant === "danger"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500",
            "transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            "disabled:opacity-50"
          )}
        >
          {isLoading ? "Loading..." : confirmText}
        </button>
      </div>
    </AccessibleModal>
  );
}

// ============================================
// ALERT DIALOG
// ============================================

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: "info" | "success" | "warning" | "error";
  buttonText?: string;
}

const alertIcons = {
  info: (
    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  variant = "info",
  buttonText = "OK",
}: AlertDialogProps) {
  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4" aria-hidden="true">
          {alertIcons[variant]}
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "px-6 py-2 rounded-lg",
            "text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500",
            "transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          )}
        >
          {buttonText}
        </button>
      </div>
    </AccessibleModal>
  );
}

// ============================================
// DRAWER (SLIDE-IN PANEL)
// ============================================

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  position?: "left" | "right";
  size?: "sm" | "md" | "lg";
  showOverlay?: boolean;
}

const drawerSizes = {
  sm: "max-w-xs",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Drawer({
  isOpen,
  onClose,
  children,
  title,
  position = "right",
  size = "md",
  showOverlay = true,
}: DrawerProps) {
  const prefersReducedMotion = useReducedMotion();
  const { containerRef } = useFocusTrap({
    enabled: isOpen,
    onEscape: onClose,
    closeOnEscape: true,
    closeOnClickOutside: showOverlay,
    onClickOutside: showOverlay ? onClose : undefined,
  });

  useScrollLock(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Overlay */}
      {showOverlay && (
        <div
          className={cn(
            "absolute inset-0 bg-black/50",
            !prefersReducedMotion && "animate-in fade-in duration-200"
          )}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute top-0 bottom-0 w-full",
          drawerSizes[size],
          "bg-white dark:bg-[#111111]",
          "border-gray-200 dark:border-[#1a1a1a]",
          "shadow-xl",
          "flex flex-col",
          position === "left" ? "left-0 border-r" : "right-0 border-l",
          !prefersReducedMotion &&
            (position === "left"
              ? "animate-in slide-in-from-left duration-300"
              : "animate-in slide-in-from-right duration-300")
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#1a1a1a]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "p-2 -mr-2 rounded-lg",
              "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            )}
            aria-label="Close drawer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ============================================
// ACCESSIBLE TOOLTIP
// ============================================

interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
  className,
  ...props
}: TooltipProps) {
  const tooltipId = useId();
  const prefersReducedMotion = useReducedMotion();

  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className={cn("relative group inline-block", className)} {...props}>
      <div aria-describedby={tooltipId}>{children}</div>
      <div
        id={tooltipId}
        role="tooltip"
        className={cn(
          "absolute z-50 px-3 py-1.5 text-sm",
          "bg-gray-900 dark:bg-white",
          "text-white dark:text-gray-900",
          "rounded-lg shadow-lg",
          "pointer-events-none",
          "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          "transition-opacity",
          !prefersReducedMotion && "duration-200",
          positionStyles[position]
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {content}
      </div>
    </div>
  );
}

// ============================================
// SKIP LINK ENHANCED
// ============================================

interface SkipLinksProps {
  links?: Array<{ id: string; label: string }>;
}

export function SkipLinks({
  links = [{ id: "main-content", label: "Skip to main content" }],
}: SkipLinksProps) {
  return (
    <div className="sr-only focus-within:not-sr-only">
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className={cn(
            "fixed top-4 left-4 z-[9999]",
            "px-4 py-2 rounded-lg",
            "bg-gradient-to-r from-violet-600 to-blue-600 text-white",
            "font-medium",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          )}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
