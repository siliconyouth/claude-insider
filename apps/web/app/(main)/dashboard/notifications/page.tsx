"use client";

/**
 * Admin Notifications Management
 *
 * Create, edit, schedule, and manage notifications for users.
 * Supports multi-channel delivery (in-app, push, email) and targeting.
 */

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import {
  getAdminNotifications,
  createAdminNotification,
  updateAdminNotification,
  scheduleAdminNotification,
  cancelAdminNotification,
  deleteAdminNotification,
  searchUsersForNotification,
  getRecipientCount,
  sendVersionNotification,
  type AdminNotification,
  type AdminNotificationStatus,
  type TargetType,
  type CreateAdminNotificationParams,
} from "@/app/actions/admin-notifications";

const STATUS_COLORS: Record<AdminNotificationStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-gray-200 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  scheduled: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  sending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
  sent: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  failed: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  cancelled: { bg: "bg-gray-200 dark:bg-gray-800", text: "text-gray-500" },
};

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Moderator" },
  { value: "editor", label: "Editor" },
  { value: "user", label: "User" },
];

type FilterStatus = "all" | AdminNotificationStatus;

interface SearchedUser {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
}

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [total, setTotal] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [sendInApp, setSendInApp] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetUserIds, setTargetUserIds] = useState<string[]>([]);
  const [targetUsers, setTargetUsers] = useState<SearchedUser[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [sendImmediately, setSendImmediately] = useState(true);

  // User search state
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Recipient count preview
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  // Version notification modal state
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionNumber, setVersionNumber] = useState("");
  const [versionTitle, setVersionTitle] = useState("");
  const [versionHighlights, setVersionHighlights] = useState("");
  const [isSendingVersion, setIsSendingVersion] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAdminNotifications({
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 50,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        setNotifications(result.data || []);
        setTotal(result.total || 0);
      }
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Search users with debounce
  useEffect(() => {
    if (!userSearch || userSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchUsersForNotification(userSearch);
        if (result.data) {
          // Filter out already selected users
          setSearchResults(
            result.data.filter((u) => !targetUserIds.includes(u.id))
          );
        }
      } catch {
        // Silently fail
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch, targetUserIds]);

  // Update recipient count preview
  useEffect(() => {
    const updateCount = async () => {
      const result = await getRecipientCount({
        target_type: targetType,
        target_roles: targetRoles,
        target_user_ids: targetUserIds,
      });
      setRecipientCount(result.count ?? null);
    };

    updateCount();
  }, [targetType, targetRoles, targetUserIds]);

  // Reset form
  const resetForm = () => {
    setTitle("");
    setMessage("");
    setLink("");
    setSendInApp(true);
    setSendPush(true);
    setSendEmail(false);
    setTargetType("all");
    setTargetRoles([]);
    setTargetUserIds([]);
    setTargetUsers([]);
    setScheduledAt("");
    setSendImmediately(true);
    setUserSearch("");
    setSearchResults([]);
    setEditingId(null);
    setIsEditing(false);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (notification: AdminNotification) => {
    setTitle(notification.title);
    setMessage(notification.message || "");
    setLink(notification.link || "");
    setSendInApp(notification.send_in_app);
    setSendPush(notification.send_push);
    setSendEmail(notification.send_email);
    setTargetType(notification.target_type);
    setTargetRoles(notification.target_roles);
    setTargetUserIds(notification.target_user_ids);
    // We don't have user details for existing targets, would need to fetch
    setTargetUsers([]);
    setScheduledAt(
      notification.scheduled_at
        ? new Date(notification.scheduled_at).toISOString().slice(0, 16)
        : ""
    );
    setSendImmediately(!notification.scheduled_at);
    setEditingId(notification.id);
    setIsEditing(true);
    setShowModal(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (targetType === "role" && targetRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    if (targetType === "users" && targetUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsSaving(true);

    try {
      const params: CreateAdminNotificationParams = {
        title: title.trim(),
        message: message.trim() || undefined,
        link: link.trim() || undefined,
        send_in_app: sendInApp,
        send_push: sendPush,
        send_email: sendEmail,
        target_type: targetType,
        target_roles: targetType === "role" ? targetRoles : undefined,
        target_user_ids: targetType === "users" ? targetUserIds : undefined,
        scheduled_at: !sendImmediately && scheduledAt ? scheduledAt : undefined,
      };

      if (isEditing && editingId) {
        const result = await updateAdminNotification(editingId, params);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Notification updated");
          setShowModal(false);
          resetForm();
          fetchNotifications();
        }
      } else {
        const result = await createAdminNotification(params);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Notification created");
          setShowModal(false);
          resetForm();
          fetchNotifications();
        }
      }
    } catch {
      toast.error("Failed to save notification");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle schedule/send
  const handleSchedule = async (id: string, immediate: boolean) => {
    try {
      const result = await scheduleAdminNotification(id, immediate);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(immediate ? "Notification queued for sending" : "Notification scheduled");
        fetchNotifications();
      }
    } catch {
      toast.error("Failed to schedule notification");
    }
  };

  // Handle cancel
  const handleCancel = async (id: string) => {
    try {
      const result = await cancelAdminNotification(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Notification cancelled");
        fetchNotifications();
      }
    } catch {
      toast.error("Failed to cancel notification");
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      const result = await deleteAdminNotification(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Notification deleted");
        fetchNotifications();
      }
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  // Add user to targets
  const addUserTarget = (user: SearchedUser) => {
    setTargetUserIds((prev) => [...prev, user.id]);
    setTargetUsers((prev) => [...prev, user]);
    setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
    setUserSearch("");
  };

  // Remove user from targets
  const removeUserTarget = (userId: string) => {
    setTargetUserIds((prev) => prev.filter((id) => id !== userId));
    setTargetUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Toggle role
  const toggleRole = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  // Reset version modal
  const resetVersionModal = () => {
    setVersionNumber("");
    setVersionTitle("");
    setVersionHighlights("");
    setShowVersionModal(false);
  };

  // Handle sending version notification
  const handleSendVersionNotification = async () => {
    if (!versionNumber.trim()) {
      toast.error("Version number is required");
      return;
    }

    if (!versionTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSendingVersion(true);

    try {
      // Parse highlights (one per line)
      const highlights = versionHighlights
        .split("\n")
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      const result = await sendVersionNotification({
        version: versionNumber.trim(),
        title: versionTitle.trim(),
        highlights: highlights.length > 0 ? highlights : undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Version update notification sent to ${result.notifiedCount} users!`
        );
        resetVersionModal();
        fetchNotifications();
      }
    } catch {
      toast.error("Failed to send version notification");
    } finally {
      setIsSendingVersion(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold ui-text-heading">Notifications</h2>
          <p className="mt-1 text-sm ui-text-secondary">
            Create and manage notifications ({total} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowVersionModal(true)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30",
              "hover:bg-emerald-600/30 transition-all"
            )}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Send Version Update
            </span>
          </button>
          <button
            onClick={openCreateModal}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-lg shadow-blue-500/25",
              "hover:-translate-y-0.5 transition-all"
            )}
          >
            Create Notification
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "draft", "scheduled", "sending", "sent", "failed", "cancelled"] as FilterStatus[]).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                statusFilter === status
                  ? "ui-filter-active border"
                  : "ui-filter-inactive"
              )}
            >
              {status === "all" ? "All" : status}
            </button>
          )
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-xl border ui-border ui-bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 ui-bg-skeleton rounded-lg animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center ui-text-muted">
            No notifications found
          </div>
        ) : (
          <div className="ui-divide divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 ui-hover-row transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium ui-text-heading truncate">
                        {notification.title}
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          STATUS_COLORS[notification.status].bg,
                          STATUS_COLORS[notification.status].text
                        )}
                      >
                        {notification.status}
                      </span>
                    </div>

                    {notification.message && (
                      <p className="text-sm ui-text-secondary truncate mb-2">
                        {notification.message}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs ui-text-muted">
                      {/* Target */}
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {notification.target_type === "all"
                          ? "All users"
                          : notification.target_type === "role"
                          ? notification.target_roles.join(", ")
                          : `${notification.target_user_ids.length} users`}
                      </span>

                      {/* Channels */}
                      <span className="flex items-center gap-1">
                        {notification.send_in_app && (
                          <span className="px-1.5 py-0.5 rounded ui-bg-skeleton ui-text-secondary">Bell</span>
                        )}
                        {notification.send_push && (
                          <span className="px-1.5 py-0.5 rounded ui-bg-skeleton ui-text-secondary">Push</span>
                        )}
                        {notification.send_email && (
                          <span className="px-1.5 py-0.5 rounded ui-bg-skeleton ui-text-secondary">Email</span>
                        )}
                      </span>

                      {/* Schedule */}
                      {notification.scheduled_at && (
                        <span>
                          Scheduled: {new Date(notification.scheduled_at).toLocaleString()}
                        </span>
                      )}

                      {/* Stats */}
                      {notification.status === "sent" && (
                        <span className="text-emerald-400">
                          {notification.successful_deliveries}/{notification.total_recipients} delivered
                        </span>
                      )}

                      {/* Created */}
                      <span>
                        Created {new Date(notification.created_at).toLocaleDateString()}
                        {notification.creator && ` by ${notification.creator.name}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {notification.status === "draft" && (
                      <>
                        <button
                          onClick={() => openEditModal(notification)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium ui-text-secondary ui-hover-row"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleSchedule(notification.id, true)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-600/30"
                        >
                          Send Now
                        </button>
                        {notification.scheduled_at && (
                          <button
                            onClick={() => handleSchedule(notification.id, false)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-600/30"
                          >
                            Schedule
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {notification.status === "scheduled" && (
                      <>
                        <button
                          onClick={() => openEditModal(notification)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium ui-text-secondary ui-hover-row"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCancel(notification.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-2xl ui-bg-modal border ui-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 ui-bg-modal border-b ui-border p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold ui-text-heading">
                {isEditing ? "Edit Notification" : "Create Notification"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg ui-btn-ghost"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium ui-text-secondary mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title..."
                  className="w-full px-4 py-2 rounded-lg ui-input"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium ui-text-secondary mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Notification message..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg ui-input resize-none"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium ui-text-secondary mb-2">
                  Link URL (Optional)
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://claudeinsider.com/..."
                  className="w-full px-4 py-2 rounded-lg ui-input"
                />
                <p className="mt-1 text-xs ui-text-muted">
                  Where users will be directed when clicking the notification
                </p>
              </div>

              {/* Delivery Channels */}
              <div>
                <label className="block text-sm font-medium ui-text-secondary mb-2">
                  Delivery Channels
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendInApp}
                      onChange={(e) => setSendInApp(e.target.checked)}
                      className="w-4 h-4 rounded ui-bg-input border ui-border-input text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm ui-text-body">In-App (Bell)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendPush}
                      onChange={(e) => setSendPush(e.target.checked)}
                      className="w-4 h-4 rounded ui-bg-input border ui-border-input text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm ui-text-body">Web Push</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="w-4 h-4 rounded ui-bg-input border ui-border-input text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm ui-text-body">Email</span>
                  </label>
                </div>
              </div>

              {/* Target Type */}
              <div>
                <label className="block text-sm font-medium ui-text-secondary mb-2">
                  Target Audience
                </label>
                <div className="flex gap-2">
                  {(["all", "role", "users"] as TargetType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTargetType(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                        targetType === type
                          ? "ui-filter-active"
                          : "ui-filter-inactive border-transparent"
                      )}
                    >
                      {type === "all"
                        ? "All Users"
                        : type === "role"
                        ? "By Role"
                        : "Specific Users"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Selection */}
              {targetType === "role" && (
                <div>
                  <label className="block text-sm font-medium ui-text-secondary mb-2">
                    Select Roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => toggleRole(role.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                          targetRoles.includes(role.value)
                            ? "bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-500/30"
                            : "ui-filter-inactive border-gray-300 dark:border-gray-700"
                        )}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* User Selection */}
              {targetType === "users" && (
                <div>
                  <label className="block text-sm font-medium ui-text-secondary mb-2">
                    Search Users
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name, email, or username..."
                      className="w-full px-4 py-2 rounded-lg ui-input"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border ui-border ui-bg-card ui-divide divide-y">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => addUserTarget(user)}
                          className="w-full px-4 py-2 text-left ui-hover-row transition-colors"
                        >
                          <p className="text-sm ui-text-heading">{user.name}</p>
                          <p className="text-xs ui-text-muted">{user.email}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Users */}
                  {targetUsers.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {targetUsers.map((user) => (
                        <span
                          key={user.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 text-sm"
                        >
                          {user.name}
                          <button
                            onClick={() => removeUserTarget(user.id)}
                            className="hover:text-blue-900 dark:hover:text-white"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Show count for users loaded from edit */}
                  {targetUserIds.length > 0 && targetUsers.length === 0 && (
                    <p className="mt-2 text-sm ui-text-muted">
                      {targetUserIds.length} user(s) selected
                    </p>
                  )}
                </div>
              )}

              {/* Recipient Count Preview */}
              {recipientCount !== null && (
                <div className="p-3 rounded-lg ui-card-info border ui-border">
                  <p className="text-sm ui-text-secondary">
                    This notification will be sent to{" "}
                    <span className="ui-text-heading font-medium">{recipientCount}</span>{" "}
                    {recipientCount === 1 ? "user" : "users"}
                  </p>
                </div>
              )}

              {/* Scheduling */}
              <div className="pt-4 border-t ui-border">
                <label className="block text-sm font-medium ui-text-secondary mb-2">
                  When to Send
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={sendImmediately}
                      onChange={() => setSendImmediately(true)}
                      className="w-4 h-4 ui-bg-input border ui-border-input text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm ui-text-body">Send immediately when I click &quot;Send Now&quot;</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!sendImmediately}
                      onChange={() => setSendImmediately(false)}
                      className="w-4 h-4 ui-bg-input border ui-border-input text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm ui-text-body">Schedule for later</span>
                  </label>

                  {!sendImmediately && (
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-4 py-2 rounded-lg ui-input"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 ui-bg-modal border-t ui-border p-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium ui-btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white shadow-lg shadow-blue-500/25",
                  "hover:-translate-y-0.5 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                )}
              >
                {isSaving ? "Saving..." : isEditing ? "Update" : "Create Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Notification Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={resetVersionModal}
          />
          <div className="relative w-full max-w-md ui-bg-modal border ui-border rounded-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="border-b ui-border p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-600/20">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold ui-text-heading">Send Version Update</h3>
              </div>
              <button
                onClick={resetVersionModal}
                className="p-2 rounded-lg ui-btn-ghost"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm ui-text-secondary">
                Send a version update notification to all users who have opted in to receive version updates.
              </p>

              {/* Version Number */}
              <div>
                <label className="block text-sm font-medium ui-text-secondary mb-2">
                  Version Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={versionNumber}
                  onChange={(e) => setVersionNumber(e.target.value)}
                  placeholder="e.g., 0.66.0"
                  className="w-full px-4 py-2 rounded-lg ui-input focus:ring-emerald-500"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium ui-text-secondary mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={versionTitle}
                  onChange={(e) => setVersionTitle(e.target.value)}
                  placeholder="e.g., New Features & Improvements"
                  className="w-full px-4 py-2 rounded-lg ui-input focus:ring-emerald-500"
                />
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-sm font-medium ui-text-secondary mb-2">
                  Highlights (one per line, optional)
                </label>
                <textarea
                  value={versionHighlights}
                  onChange={(e) => setVersionHighlights(e.target.value)}
                  placeholder="Added dark mode support&#10;Fixed login issues&#10;Improved performance"
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg ui-input resize-none focus:ring-emerald-500"
                />
                <p className="mt-1 text-xs ui-text-muted">
                  Enter each highlight on a new line. These will appear as bullet points.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t ui-border p-6 flex items-center justify-end gap-3">
              <button
                onClick={resetVersionModal}
                className="px-4 py-2 rounded-lg text-sm font-medium ui-btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSendVersionNotification}
                disabled={isSendingVersion}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-emerald-600 text-white",
                  "hover:bg-emerald-500 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSendingVersion ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send to Opted-in Users"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
