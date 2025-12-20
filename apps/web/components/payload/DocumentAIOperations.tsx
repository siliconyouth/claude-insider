'use client';

/**
 * DocumentAIOperations - Payload CMS Custom Field
 *
 * Displays AI operation controls for documents:
 * - CLI commands for relationship analysis (run in Claude Code)
 * - Queue operation for tracking
 * - Status of pending/completed operations
 *
 * Key Architecture Principle:
 * AI operations run in Claude Code CLI (uses subscription, not API credits)
 * This component only displays commands and queues tracking entries
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useDocumentInfo, useField } from '@payloadcms/ui';

interface QueuedOperation {
  id: string;
  status: string;
  operation_type: string;
  requested_at: string;
  cli_command: string;
}

export default function DocumentAIOperations() {
  const { id: documentId } = useDocumentInfo();
  const slugField = useField<string>({ path: 'slug' });
  const slug = slugField?.value || '';

  const [isQueueing, setIsQueueing] = useState(false);
  const [pendingOps, setPendingOps] = useState<QueuedOperation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  // Generate CLI commands based on document slug
  const analyzeCommand = `node scripts/analyze-relationships.mjs --slug="${slug}"`;
  const rewriteCommand = `node scripts/rewrite-docs.mjs --slug="${slug}"`;

  // Fetch pending operations for this document
  useEffect(() => {
    if (!documentId) return;

    const fetchPendingOps = async () => {
      try {
        const response = await fetch(`/api/dashboard/ai-queue?target_type=documentation&target_id=${slug}`);
        if (response.ok) {
          const data = await response.json();
          setPendingOps(data.operations || []);
        }
      } catch (err) {
        console.error('Failed to fetch pending operations:', err);
      }
    };

    fetchPendingOps();
    // Poll every 30 seconds
    const interval = setInterval(fetchPendingOps, 30000);
    return () => clearInterval(interval);
  }, [documentId, slug]);

  // Queue an operation
  const handleQueueOperation = useCallback(async (operationType: string) => {
    if (!slug) return;

    setIsQueueing(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/ai-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation_type: operationType,
          target_type: 'documentation',
          target_id: slug,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to queue operation');
      }

      const data = await response.json();
      setPendingOps(prev => [...prev, {
        id: data.id,
        status: 'pending',
        operation_type: operationType,
        requested_at: new Date().toISOString(),
        cli_command: data.cli_command,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsQueueing(false);
    }
  }, [slug]);

  // Copy command to clipboard
  const handleCopyCommand = useCallback((command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  }, []);

  if (!documentId) {
    return (
      <div style={styles.container}>
        <p style={styles.muted}>
          Save this document first to enable AI operations.
        </p>
      </div>
    );
  }

  if (!slug) {
    return (
      <div style={styles.container}>
        <p style={styles.muted}>
          Document slug is required for AI operations.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>AI Operations</h4>

      <p style={styles.description}>
        These operations run in <strong>Claude Code CLI</strong> using your subscription (not API credits).
        Copy the command and run it in your terminal.
      </p>

      {/* Analyze Relationships Command */}
      <div style={styles.commandSection}>
        <label style={styles.commandLabel}>Analyze Relationships</label>
        <div style={styles.commandRow}>
          <code style={styles.commandCode}>{analyzeCommand}</code>
          <button
            onClick={() => handleCopyCommand(analyzeCommand)}
            style={styles.copyButton}
            title="Copy to clipboard"
          >
            {copiedCommand === analyzeCommand ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
        <button
          onClick={() => handleQueueOperation('analyze_relationships')}
          disabled={isQueueing}
          style={styles.queueButton}
        >
          {isQueueing ? 'Queueing...' : 'Queue for Tracking'}
        </button>
      </div>

      {/* Rewrite Documentation Command */}
      <div style={styles.commandSection}>
        <label style={styles.commandLabel}>Rewrite Documentation (Future)</label>
        <div style={styles.commandRow}>
          <code style={styles.commandCode}>{rewriteCommand}</code>
          <button
            onClick={() => handleCopyCommand(rewriteCommand)}
            style={styles.copyButton}
            title="Copy to clipboard"
          >
            {copiedCommand === rewriteCommand ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Pending Operations */}
      {pendingOps.length > 0 && (
        <div style={styles.pendingSection}>
          <h5 style={styles.pendingTitle}>Pending Operations</h5>
          {pendingOps.map(op => (
            <div key={op.id} style={styles.pendingItem}>
              <div style={styles.pendingHeader}>
                <StatusBadge status={op.status} />
                <span style={styles.pendingType}>{formatOperationType(op.operation_type)}</span>
              </div>
              <p style={styles.pendingTime}>
                Requested {formatTime(op.requested_at)}
              </p>
              {op.cli_command && (
                <code style={styles.pendingCommand}>{op.cli_command}</code>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div style={styles.infoBox}>
        <InfoIcon />
        <p style={styles.infoText}>
          Queuing operations creates a tracking entry. Run the actual command in Claude Code
          to use your subscription credits instead of API credits.
        </p>
      </div>
    </div>
  );
}

// Helper components
function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const defaultColor = { bg: '#fef3c7', text: '#92400e' };
  const colors: Record<string, { bg: string; text: string }> = {
    pending: defaultColor,
    in_progress: { bg: '#dbeafe', text: '#1e40af' },
    completed: { bg: '#d1fae5', text: '#065f46' },
    failed: { bg: '#fee2e2', text: '#991b1b' },
  };
  const statusColors = colors[status] || defaultColor;

  return (
    <span style={{
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: statusColors.bg,
      color: statusColors.text,
      fontSize: '11px',
      fontWeight: 500,
    }}>
      {status}
    </span>
  );
}

function formatOperationType(type: string): string {
  const labels: Record<string, string> = {
    analyze_relationships: 'Analyze Relationships',
    enhance_resource: 'Enhance Resource',
    rewrite_doc: 'Rewrite Documentation',
    bulk_analyze: 'Bulk Analysis',
  };
  return labels[type] || type;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginTop: '8px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  description: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: 1.5,
  },
  muted: {
    margin: 0,
    fontSize: '13px',
    color: '#9ca3af',
  },
  commandSection: {
    marginBottom: '16px',
  },
  commandLabel: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#374151',
  },
  commandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  commandCode: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'ui-monospace, monospace',
    overflow: 'auto',
    whiteSpace: 'nowrap',
  },
  copyButton: {
    padding: '8px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueButton: {
    marginTop: '8px',
    padding: '6px 12px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#374151',
    cursor: 'pointer',
  },
  errorBox: {
    marginTop: '12px',
    padding: '10px',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
  },
  errorText: {
    margin: 0,
    fontSize: '12px',
    color: '#991b1b',
  },
  pendingSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  pendingTitle: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontWeight: 500,
    color: '#374151',
  },
  pendingItem: {
    padding: '10px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '8px',
  },
  pendingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  pendingType: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#111827',
  },
  pendingTime: {
    margin: '0 0 4px 0',
    fontSize: '11px',
    color: '#9ca3af',
  },
  pendingCommand: {
    display: 'block',
    padding: '6px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'ui-monospace, monospace',
    color: '#4b5563',
    overflow: 'auto',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginTop: '16px',
    padding: '10px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
  },
  infoText: {
    margin: 0,
    fontSize: '12px',
    color: '#0369a1',
    lineHeight: 1.4,
  },
};
