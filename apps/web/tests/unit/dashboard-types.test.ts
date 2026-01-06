/**
 * Dashboard Types Tests
 *
 * Tests for dashboard shared types and interfaces.
 * Verifies type structure and validation patterns.
 */

import { describe, it, expect } from "vitest";
import type {
  PaginationState,
  PaginatedResponse,
  FilterOption,
  FilterConfig,
  TableColumn,
  StatusStyle,
  StatusConfig,
  ActionResult,
  ActionConfig,
  ModalAction,
  BaseEntity,
  UserInfo,
  UsePaginatedListOptions,
  UseDashboardActionOptions,
} from "@/lib/dashboard/types";

describe("Dashboard Types", () => {
  describe("PaginationState", () => {
    it("should accept valid pagination state", () => {
      const state: PaginationState = {
        page: 1,
        totalPages: 10,
        limit: 20,
      };
      expect(state.page).toBe(1);
      expect(state.totalPages).toBe(10);
      expect(state.limit).toBe(20);
    });

    it("should accept first page state", () => {
      const state: PaginationState = {
        page: 1,
        totalPages: 1,
        limit: 10,
      };
      expect(state.page).toBe(1);
    });

    it("should accept zero total pages (empty)", () => {
      const state: PaginationState = {
        page: 1,
        totalPages: 0,
        limit: 10,
      };
      expect(state.totalPages).toBe(0);
    });
  });

  describe("PaginatedResponse", () => {
    it("should accept valid paginated response", () => {
      interface Item {
        id: string;
        name: string;
      }
      const response: PaginatedResponse<Item> = {
        items: [
          { id: "1", name: "Item 1" },
          { id: "2", name: "Item 2" },
        ],
        total: 100,
        page: 1,
        totalPages: 10,
        limit: 10,
      };
      expect(response.items).toHaveLength(2);
      expect(response.total).toBe(100);
    });

    it("should accept empty items array", () => {
      const response: PaginatedResponse<string> = {
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
        limit: 10,
      };
      expect(response.items).toHaveLength(0);
    });

    it("should work with complex item types", () => {
      interface ComplexItem {
        id: string;
        data: {
          nested: boolean;
          count: number;
        };
      }
      const response: PaginatedResponse<ComplexItem> = {
        items: [{ id: "1", data: { nested: true, count: 5 } }],
        total: 1,
        page: 1,
        totalPages: 1,
        limit: 10,
      };
      expect(response.items[0]?.data.nested).toBe(true);
    });
  });

  describe("FilterOption", () => {
    it("should accept basic filter option", () => {
      const option: FilterOption = {
        value: "active",
        label: "Active",
      };
      expect(option.value).toBe("active");
      expect(option.label).toBe("Active");
    });

    it("should accept filter option with count", () => {
      const option: FilterOption = {
        value: "pending",
        label: "Pending",
        count: 42,
      };
      expect(option.count).toBe(42);
    });

    it("should accept typed filter option", () => {
      type Status = "active" | "inactive" | "pending";
      const option: FilterOption<Status> = {
        value: "active",
        label: "Active Users",
      };
      expect(option.value).toBe("active");
    });
  });

  describe("FilterConfig", () => {
    it("should accept valid filter config", () => {
      const config: FilterConfig = {
        key: "status",
        options: [
          { value: "all", label: "All" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
        defaultValue: "all",
      };
      expect(config.key).toBe("status");
      expect(config.options).toHaveLength(3);
      expect(config.defaultValue).toBe("all");
    });

    it("should accept filter config with label", () => {
      const config: FilterConfig = {
        key: "role",
        options: [{ value: "admin", label: "Admin" }],
        defaultValue: "admin",
        label: "User Role",
      };
      expect(config.label).toBe("User Role");
    });

    it("should accept typed filter config", () => {
      type Priority = "low" | "medium" | "high";
      const config: FilterConfig<Priority> = {
        key: "priority",
        options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ],
        defaultValue: "medium",
      };
      expect(config.defaultValue).toBe("medium");
    });
  });

  describe("TableColumn", () => {
    it("should accept basic table column", () => {
      interface User {
        id: string;
        name: string;
        email: string;
      }
      const column: TableColumn<User> = {
        key: "name",
        header: "Name",
      };
      expect(column.key).toBe("name");
      expect(column.header).toBe("Name");
    });

    it("should accept column with width", () => {
      interface User {
        id: string;
        name: string;
      }
      const column: TableColumn<User> = {
        key: "id",
        header: "ID",
        width: "100px",
      };
      expect(column.width).toBe("100px");
    });

    it("should accept column with alignment", () => {
      interface User {
        id: string;
        name: string;
      }
      const column: TableColumn<User> = {
        key: "id",
        header: "ID",
        align: "center",
      };
      expect(column.align).toBe("center");
    });

    it("should accept all alignment values", () => {
      interface Item {
        value: number;
      }
      const alignments: TableColumn<Item>["align"][] = ["left", "center", "right"];
      alignments.forEach((align) => {
        const column: TableColumn<Item> = { key: "value", header: "Value", align };
        expect(column.align).toBe(align);
      });
    });

    it("should accept sortable column", () => {
      interface User {
        createdAt: string;
      }
      const column: TableColumn<User> = {
        key: "createdAt",
        header: "Created",
        sortable: true,
      };
      expect(column.sortable).toBe(true);
    });

    it("should accept column with string key (computed)", () => {
      interface User {
        id: string;
        name: string;
      }
      const column: TableColumn<User> = {
        key: "fullName", // Computed column not in interface
        header: "Full Name",
      };
      expect(column.key).toBe("fullName");
    });
  });

  describe("StatusStyle", () => {
    it("should accept valid status style", () => {
      const style: StatusStyle = {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Active",
      };
      expect(style.bg).toBe("bg-green-100");
      expect(style.text).toBe("text-green-700");
      expect(style.label).toBe("Active");
    });

    it("should accept status style with border", () => {
      const style: StatusStyle = {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Error",
        border: "border-red-300",
      };
      expect(style.border).toBe("border-red-300");
    });
  });

  describe("StatusConfig", () => {
    it("should accept valid status config", () => {
      type MyStatus = "open" | "closed";
      const config: StatusConfig<MyStatus> = {
        open: { bg: "bg-green-100", text: "text-green-700", label: "Open" },
        closed: { bg: "bg-gray-100", text: "text-gray-700", label: "Closed" },
      };
      expect(config.open.label).toBe("Open");
      expect(config.closed.label).toBe("Closed");
    });
  });

  describe("ActionResult", () => {
    it("should accept successful result", () => {
      const result: ActionResult = {
        success: true,
        data: { id: "123" },
      };
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: "123" });
    });

    it("should accept failed result", () => {
      const result: ActionResult = {
        success: false,
        error: "Something went wrong",
      };
      expect(result.success).toBe(false);
      expect(result.error).toBe("Something went wrong");
    });

    it("should accept typed result", () => {
      interface User {
        id: string;
        name: string;
      }
      const result: ActionResult<User> = {
        success: true,
        data: { id: "123", name: "John" },
      };
      expect(result.data?.name).toBe("John");
    });

    it("should accept result without data or error", () => {
      const result: ActionResult = {
        success: true,
      };
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });
  });

  describe("ActionConfig", () => {
    it("should accept GET action", () => {
      const config: ActionConfig = {
        method: "GET",
        endpoint: "/api/users",
      };
      expect(config.method).toBe("GET");
    });

    it("should accept POST action with body", () => {
      const config: ActionConfig = {
        method: "POST",
        endpoint: "/api/users",
        body: { name: "John", email: "john@example.com" },
      };
      expect(config.body).toEqual({ name: "John", email: "john@example.com" });
    });

    it("should accept all HTTP methods", () => {
      const methods: ActionConfig["method"][] = ["GET", "POST", "PATCH", "PUT", "DELETE"];
      methods.forEach((method) => {
        const config: ActionConfig = { method, endpoint: "/api/test" };
        expect(config.method).toBe(method);
      });
    });

    it("should accept action with messages", () => {
      const config: ActionConfig = {
        method: "DELETE",
        endpoint: "/api/users/123",
        successMessage: "User deleted successfully",
        errorMessage: "Failed to delete user",
      };
      expect(config.successMessage).toBe("User deleted successfully");
      expect(config.errorMessage).toBe("Failed to delete user");
    });
  });

  describe("ModalAction", () => {
    it("should accept primary action", () => {
      const action: ModalAction = {
        label: "Save",
        variant: "primary",
        onClick: () => {},
      };
      expect(action.label).toBe("Save");
      expect(action.variant).toBe("primary");
    });

    it("should accept all variants", () => {
      const variants: ModalAction["variant"][] = ["primary", "secondary", "danger", "ghost"];
      variants.forEach((variant) => {
        const action: ModalAction = { label: "Action", variant, onClick: () => {} };
        expect(action.variant).toBe(variant);
      });
    });

    it("should accept disabled action", () => {
      const action: ModalAction = {
        label: "Submit",
        variant: "primary",
        onClick: () => {},
        disabled: true,
      };
      expect(action.disabled).toBe(true);
    });

    it("should accept loading action", () => {
      const action: ModalAction = {
        label: "Saving...",
        variant: "primary",
        onClick: async () => {},
        loading: true,
      };
      expect(action.loading).toBe(true);
    });

    it("should accept async onClick", () => {
      const action: ModalAction = {
        label: "Submit",
        variant: "primary",
        onClick: async () => {
          await Promise.resolve();
        },
      };
      expect(typeof action.onClick).toBe("function");
    });
  });

  describe("BaseEntity", () => {
    it("should accept entity with required fields", () => {
      const entity: BaseEntity = {
        id: "entity-123",
        createdAt: "2024-01-01T00:00:00Z",
      };
      expect(entity.id).toBe("entity-123");
      expect(entity.createdAt).toBe("2024-01-01T00:00:00Z");
    });

    it("should accept entity with updatedAt", () => {
      const entity: BaseEntity = {
        id: "entity-123",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      };
      expect(entity.updatedAt).toBe("2024-01-02T00:00:00Z");
    });

    it("should accept entity without updatedAt", () => {
      const entity: BaseEntity = {
        id: "entity-123",
        createdAt: "2024-01-01T00:00:00Z",
      };
      expect(entity.updatedAt).toBeUndefined();
    });
  });

  describe("UserInfo", () => {
    it("should accept full user info", () => {
      const user: UserInfo = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        image: "https://example.com/avatar.jpg",
        username: "johndoe",
      };
      expect(user.id).toBe("user-123");
      expect(user.name).toBe("John Doe");
    });

    it("should accept user with null fields", () => {
      const user: UserInfo = {
        id: "user-123",
        name: null,
        email: null,
        image: null,
        username: null,
      };
      expect(user.name).toBeNull();
      expect(user.email).toBeNull();
    });

    it("should accept minimal user info", () => {
      const user: UserInfo = {
        id: "user-123",
        name: "Anonymous",
        email: null,
        image: null,
        username: null,
      };
      expect(user.id).toBe("user-123");
    });
  });

  describe("UsePaginatedListOptions", () => {
    it("should accept empty options", () => {
      const options: UsePaginatedListOptions = {};
      expect(options.limit).toBeUndefined();
    });

    it("should accept full options", () => {
      const options: UsePaginatedListOptions = {
        limit: 20,
        initialFilters: { status: "active" },
        debounceMs: 300,
        enabled: true,
      };
      expect(options.limit).toBe(20);
      expect(options.debounceMs).toBe(300);
    });

    it("should accept disabled option", () => {
      const options: UsePaginatedListOptions = {
        enabled: false,
      };
      expect(options.enabled).toBe(false);
    });
  });

  describe("UseDashboardActionOptions", () => {
    it("should accept empty options", () => {
      const options: UseDashboardActionOptions = {};
      expect(options.onSuccess).toBeUndefined();
    });

    it("should accept success callback", () => {
      const options: UseDashboardActionOptions = {
        onSuccess: () => {
          // Handle success
        },
      };
      expect(typeof options.onSuccess).toBe("function");
    });

    it("should accept error callback", () => {
      const options: UseDashboardActionOptions = {
        onError: (error) => {
          console.error(error);
        },
      };
      expect(typeof options.onError).toBe("function");
    });

    it("should accept async success callback", () => {
      const options: UseDashboardActionOptions = {
        onSuccess: async () => {
          await Promise.resolve();
        },
      };
      expect(typeof options.onSuccess).toBe("function");
    });

    it("should accept custom messages", () => {
      const options: UseDashboardActionOptions = {
        successMessage: "Operation completed",
        errorMessage: "Operation failed",
      };
      expect(options.successMessage).toBe("Operation completed");
      expect(options.errorMessage).toBe("Operation failed");
    });
  });
});
