'use client';

/**
 * AIPipelineInfoPanel - Payload CMS Custom Field
 *
 * Displays information and guidance about the AI pipeline system.
 * Shows current statistics and links to the dashboard.
 */

import React, { useState, useEffect } from 'react';

interface PipelineStats {
  pendingOperations: number;
  completedOperations: number;
  failedOperations: number;
  totalDocs: number;
  analyzedDocs: number;
  totalResources: number;
  enhancedResources: number;
  totalRelationships: number;
}

export default function AIPipelineInfoPanel() {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/ai-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch AI pipeline stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <SparklesIcon />
        <h4 style={styles.title}>AI Pipeline Overview</h4>
      </div>

      <p style={styles.description}>
        The AI pipeline uses <strong>Claude Opus 4.5</strong> running in <strong>Claude Code CLI</strong>{' '}
        to perform expensive operations using your subscription credits instead of API credits.
      </p>

      {/* Stats Grid */}
      {isLoading ? (
        <div style={styles.loadingBox}>Loading statistics...</div>
      ) : stats ? (
        <div style={styles.statsGrid}>
          <StatBox
            label="Pending Ops"
            value={stats.pendingOperations}
            color={stats.pendingOperations > 0 ? '#f59e0b' : '#22c55e'}
          />
          <StatBox
            label="Analyzed Docs"
            value={`${stats.analyzedDocs}/${stats.totalDocs}`}
            color="#3b82f6"
          />
          <StatBox
            label="Enhanced"
            value={`${stats.enhancedResources}/${stats.totalResources}`}
            color="#8b5cf6"
          />
          <StatBox
            label="Relationships"
            value={stats.totalRelationships}
            color="#06b6d4"
          />
        </div>
      ) : (
        <div style={styles.errorBox}>
          Stats unavailable. Make sure the API routes are configured.
        </div>
      )}

      {/* Quick Links */}
      <div style={styles.linksSection}>
        <h5 style={styles.linksTitle}>Quick Links</h5>
        <div style={styles.linksGrid}>
          <a href="/dashboard/documentation" style={styles.link}>
            <FileTextIcon />
            Documentation
          </a>
          <a href="/dashboard/resources-admin" style={styles.link}>
            <FolderIcon />
            Resources
          </a>
          <a href="/dashboard/relationships" style={styles.link}>
            <LinkIcon />
            Relationships
          </a>
          <a href="/dashboard/ai-queue" style={styles.link}>
            <QueueIcon />
            Operation Queue
          </a>
        </div>
      </div>

      {/* Instructions */}
      <div style={styles.instructionsBox}>
        <h5 style={styles.instructionsTitle}>How It Works</h5>
        <ol style={styles.instructionsList}>
          <li>Queue operations from the admin panel or dashboard</li>
          <li>Copy the CLI command for the queued operation</li>
          <li>Run the command in Claude Code to use your subscription</li>
          <li>Results are automatically saved to the database</li>
        </ol>
      </div>
    </div>
  );
}

// Stat Box Component
function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={styles.statBox}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

// Icons
function SparklesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="3" y="10" width="18" height="4" rx="1" />
      <rect x="3" y="16" width="18" height="4" rx="1" />
    </svg>
  );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginTop: '8px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  title: {
    margin: 0,
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
  loadingBox: {
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#6b7280',
    textAlign: 'center',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fef3c7',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#92400e',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  statBox: {
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 600,
  },
  statLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
  },
  linksSection: {
    marginBottom: '16px',
  },
  linksTitle: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontWeight: 500,
    color: '#374151',
  },
  linksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#374151',
    textDecoration: 'none',
    transition: 'border-color 0.15s',
  },
  instructionsBox: {
    padding: '12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
  },
  instructionsTitle: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontWeight: 500,
    color: '#1e40af',
  },
  instructionsList: {
    margin: 0,
    paddingLeft: '16px',
    fontSize: '12px',
    color: '#1e40af',
    lineHeight: 1.6,
  },
};
