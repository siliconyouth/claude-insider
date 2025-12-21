"use client";

/**
 * Query Builder Component
 *
 * Visual token-based query builder for constructing complex searches
 * with boolean operators (AND, OR, NOT).
 *
 * Features:
 * - Token-based term input
 * - Operator selection between terms
 * - Drag-and-drop reordering (optional)
 * - Keyboard shortcuts for operators
 * - Visual operator representation
 * - Export to search query string
 */

import { useState, useCallback, useRef, useEffect, KeyboardEvent } from "react";
import { cn } from "@/lib/design-system";
import { XIcon } from "lucide-react";

// Boolean operators
export type BooleanOperator = "AND" | "OR" | "NOT";

// Query token types
export interface QueryToken {
  id: string;
  type: "term" | "operator";
  value: string;
  operator?: BooleanOperator;
}

interface QueryBuilderProps {
  /** Current tokens */
  tokens: QueryToken[];
  /** Callback when tokens change */
  onTokensChange: (tokens: QueryToken[]) => void;
  /** Placeholder for input */
  placeholder?: string;
  /** Additional className */
  className?: string;
  /** Whether query builder is disabled */
  disabled?: boolean;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Operator styles
const OPERATOR_STYLES: Record<BooleanOperator, string> = {
  AND: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  OR: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
  NOT: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
};

export function QueryBuilder({
  tokens,
  onTokensChange,
  placeholder = "Add search term...",
  className,
  disabled = false,
}: QueryBuilderProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedOperator, setSelectedOperator] = useState<BooleanOperator>("AND");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Add a new term token
  const addTerm = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;

      const newTokens: QueryToken[] = [...tokens];

      // Add operator if there are existing terms
      const hasTerms = tokens.some((t) => t.type === "term");
      if (hasTerms) {
        newTokens.push({
          id: generateId(),
          type: "operator",
          value: selectedOperator,
          operator: selectedOperator,
        });
      }

      // Add the term
      newTokens.push({
        id: generateId(),
        type: "term",
        value: trimmed,
      });

      onTokensChange(newTokens);
      setInputValue("");
    },
    [tokens, selectedOperator, onTokensChange]
  );

  // Remove a token
  const removeToken = useCallback(
    (tokenId: string) => {
      const tokenIndex = tokens.findIndex((t) => t.id === tokenId);
      if (tokenIndex === -1) return;

      const token = tokens[tokenIndex];
      if (!token) return;

      const newTokens = [...tokens];
      const isTermToken = token.type === "term";

      // Remove the token
      newTokens.splice(tokenIndex, 1);

      // If it's a term, also remove the adjacent operator
      if (isTermToken) {
        // Check for operator after the removed term
        if (newTokens[tokenIndex]?.type === "operator") {
          newTokens.splice(tokenIndex, 1);
        }
        // Or operator before if it was the last term
        else if (newTokens[tokenIndex - 1]?.type === "operator") {
          newTokens.splice(tokenIndex - 1, 1);
        }
      }

      onTokensChange(newTokens);
    },
    [tokens, onTokensChange]
  );

  // Change an operator
  const changeOperator = useCallback(
    (tokenId: string, newOperator: BooleanOperator) => {
      const newTokens = tokens.map((t) =>
        t.id === tokenId && t.type === "operator"
          ? { ...t, value: newOperator, operator: newOperator }
          : t
      );
      onTokensChange(newTokens);
    },
    [tokens, onTokensChange]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter to add term
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addTerm(inputValue);
      return;
    }

    // Backspace to delete last token when input is empty
    if (e.key === "Backspace" && !inputValue && tokens.length > 0) {
      e.preventDefault();
      const lastToken = tokens[tokens.length - 1];
      if (lastToken) {
        removeToken(lastToken.id);
      }
      return;
    }

    // Shortcuts for operators (Ctrl/Cmd + key)
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toUpperCase()) {
        case "A":
          if (!inputValue) {
            e.preventDefault();
            setSelectedOperator("AND");
          }
          break;
        case "O":
          e.preventDefault();
          setSelectedOperator("OR");
          break;
        case "N":
          e.preventDefault();
          setSelectedOperator("NOT");
          break;
      }
    }
  };

  // Parse input for quoted phrases
  const handleInputChange = (value: string) => {
    // Check if user typed a quoted phrase that's complete
    const quotedMatch = value.match(/^"(.+)"$/);
    if (quotedMatch && quotedMatch[1]) {
      addTerm(quotedMatch[1]);
      return;
    }

    // Check for space-separated terms (but not in quotes)
    if (value.includes(" ") && !value.includes('"')) {
      const parts = value.trim().split(/\s+/);
      if (parts.length > 1) {
        // Add all complete terms
        parts.slice(0, -1).forEach((part) => {
          if (part) addTerm(part);
        });
        // Keep the last part as the current input
        setInputValue(parts[parts.length - 1] || "");
        return;
      }
    }

    setInputValue(value);
  };

  // Build the query string from tokens
  const queryString = tokens
    .map((t) => {
      if (t.type === "operator") return ` ${t.operator} `;
      // Wrap multi-word terms in quotes
      return t.value.includes(" ") ? `"${t.value}"` : t.value;
    })
    .join("");

  return (
    <div className={cn("space-y-3", className)}>
      {/* Token display area */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 p-3 min-h-[48px]",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "rounded-lg",
          "focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Tokens */}
        {tokens.map((token) =>
          token.type === "term" ? (
            // Term token
            <span
              key={token.id}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1",
                "bg-gray-100 dark:bg-gray-800",
                "text-gray-900 dark:text-white text-sm",
                "rounded-md border border-gray-200 dark:border-gray-700"
              )}
            >
              {token.value}
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToken(token.id);
                  }}
                  className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                  aria-label={`Remove "${token.value}"`}
                >
                  <XIcon className="w-3 h-3" />
                </button>
              )}
            </span>
          ) : (
            // Operator token
            <OperatorButton
              key={token.id}
              operator={token.operator as BooleanOperator}
              onChange={(op) => changeOperator(token.id, op)}
              disabled={disabled}
            />
          )
        )}

        {/* Input for new terms */}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tokens.length === 0 ? placeholder : "Add term..."}
            className={cn(
              "flex-1 min-w-[120px] bg-transparent outline-none",
              "text-gray-900 dark:text-white text-sm",
              "placeholder-gray-400"
            )}
          />
        )}
      </div>

      {/* Operator selector */}
      {!disabled && tokens.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Next operator:</span>
          <div className="flex gap-1">
            {(["AND", "OR", "NOT"] as BooleanOperator[]).map((op) => (
              <button
                key={op}
                onClick={() => setSelectedOperator(op)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors",
                  selectedOperator === op
                    ? OPERATOR_STYLES[op]
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {op}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-gray-400">
            (⌘A: AND, ⌘O: OR, ⌘N: NOT)
          </span>
        </div>
      )}

      {/* Query preview */}
      {tokens.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Query:</span>
          <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300 font-mono">
            {queryString || "(empty)"}
          </code>
        </div>
      )}
    </div>
  );
}

/**
 * Operator Button - Clickable operator that cycles through options
 */
function OperatorButton({
  operator,
  onChange,
  disabled,
}: {
  operator: BooleanOperator;
  onChange: (op: BooleanOperator) => void;
  disabled?: boolean;
}) {
  const operators: BooleanOperator[] = ["AND", "OR", "NOT"];
  const currentIndex = operators.indexOf(operator);

  const cycleOperator = () => {
    if (disabled) return;
    const nextIndex = (currentIndex + 1) % operators.length;
    const nextOp = operators[nextIndex];
    if (nextOp) {
      onChange(nextOp);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        cycleOperator();
      }}
      disabled={disabled}
      className={cn(
        "px-2 py-0.5 text-xs font-medium rounded border transition-colors",
        OPERATOR_STYLES[operator],
        !disabled && "hover:opacity-80 cursor-pointer",
        disabled && "cursor-not-allowed"
      )}
      title={disabled ? operator : `Click to change (current: ${operator})`}
    >
      {operator}
    </button>
  );
}

/**
 * Hook for managing query builder state
 */
export function useQueryBuilder(initialQuery?: string) {
  const [tokens, setTokens] = useState<QueryToken[]>(() =>
    initialQuery ? parseQueryToTokens(initialQuery) : []
  );

  // Add a term
  const addTerm = useCallback((term: string, operator: BooleanOperator = "AND") => {
    setTokens((prev) => {
      const newTokens = [...prev];
      const hasTerms = prev.some((t) => t.type === "term");

      if (hasTerms) {
        newTokens.push({
          id: generateId(),
          type: "operator",
          value: operator,
          operator,
        });
      }

      newTokens.push({
        id: generateId(),
        type: "term",
        value: term.trim(),
      });

      return newTokens;
    });
  }, []);

  // Clear all tokens
  const clear = useCallback(() => {
    setTokens([]);
  }, []);

  // Build query string
  const queryString = tokens
    .map((t) => {
      if (t.type === "operator") return ` ${t.operator} `;
      return t.value.includes(" ") ? `"${t.value}"` : t.value;
    })
    .join("");

  return {
    tokens,
    setTokens,
    addTerm,
    clear,
    queryString,
  };
}

/**
 * Parse a query string into tokens
 */
function parseQueryToTokens(query: string): QueryToken[] {
  const tokens: QueryToken[] = [];
  const operators = ["AND", "OR", "NOT"];

  // Split by operators while keeping them
  const parts = query.split(/\s+(AND|OR|NOT)\s+/i);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]?.trim();
    if (!part) continue;

    const upperPart = part.toUpperCase();
    if (operators.includes(upperPart)) {
      // It's an operator
      tokens.push({
        id: generateId(),
        type: "operator",
        value: upperPart,
        operator: upperPart as BooleanOperator,
      });
    } else {
      // It's a term
      // Remove surrounding quotes if present
      const cleanTerm = part.replace(/^"(.+)"$/, "$1");
      tokens.push({
        id: generateId(),
        type: "term",
        value: cleanTerm,
      });
    }
  }

  return tokens;
}

/**
 * Convert tokens to a Fuse.js compatible query
 */
export function tokensToFuseQuery(tokens: QueryToken[]): string {
  // Fuse.js uses extended search syntax:
  // 'term - must include
  // !term - must not include
  // ^term - starts with
  // term$ - ends with
  // =term - exact match

  const parts: string[] = [];
  let nextIsNot = false;

  for (const token of tokens) {
    if (token.type === "operator") {
      if (token.operator === "NOT") {
        nextIsNot = true;
      }
      // AND and OR are handled implicitly by Fuse.js
      continue;
    }

    if (token.type === "term") {
      if (nextIsNot) {
        parts.push(`!${token.value}`);
        nextIsNot = false;
      } else {
        parts.push(`'${token.value}`);
      }
    }
  }

  return parts.join(" ");
}
