'use client';

/**
 * ResourceUpdateButton - Payload CMS Custom Field
 *
 * Displays a button to trigger AI-powered resource updates from
 * the resource edit page in the admin panel.
 *
 * Shows update status and links to the review page when ready.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useDocumentInfo } from '@payloadcms/ui';

interface UpdateJobStatus {
  id: string;
  status: string;
  ai_summary?: string;
  proposed_changes?: { field: string }[];
  error_message?: string;
  created_at: string;
}

export default function ResourceUpdateButton() {
  const { id: documentId } = useDocumentInfo();
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<UpdateJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);

  // Poll for job status when we have a job ID
  useEffect(() => {
    if (!jobId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/admin/resources/updates/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setJobStatus(data.job);

          // Stop polling when job reaches terminal state
          if (['ready_for_review', 'applied', 'rejected', 'failed'].includes(data.job.status)) {
            return;
          }
        }
      } catch (err) {
        console.error('Failed to poll job status:', err);
      }

      // Continue polling (max 30 times = 5 minutes)
      if (pollingCount < 30) {
        setPollingCount((c) => c + 1);
      }
    };

    const timeoutId = setTimeout(pollStatus, 10000); // Poll every 10 seconds
    return () => clearTimeout(timeoutId);
  }, [jobId, pollingCount]);

  const handleCheckForUpdates = useCallback(async () => {
    if (!documentId) return;

    setIsLoading(true);
    setError(null);
    setJobId(null);
    setJobStatus(null);
    setPollingCount(0);

    try {
      // Get the resource slug from the current document
      const resourceResponse = await fetch(`/api/resources/${documentId}`);
      if (!resourceResponse.ok) {
        throw new Error('Failed to get resource details');
      }

      // Trigger update job using the updates API
      const response = await fetch('/api/admin/resources/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: documentId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to trigger update');
      }

      const data = await response.json();
      setJobId(data.jobId);
      setJobStatus({
        id: data.jobId,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  if (!documentId) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          Save this resource first to enable update checking.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
        AI-Powered Updates
      </h4>

      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666' }}>
        Check for updates from the resource&apos;s official website, repository, and documentation using AI analysis.
      </p>

      {/* Trigger Button */}
      {!jobStatus && (
        <button
          onClick={handleCheckForUpdates}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              Starting update...
            </>
          ) : (
            <>
              <RefreshIcon />
              Check for Updates
            </>
          )}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#fee',
            border: '1px solid #f88',
            borderRadius: '6px',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: '#c00' }}>
            {error}
          </p>
        </div>
      )}

      {/* Job Status Display */}
      {jobStatus && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: getStatusBackgroundColor(jobStatus.status),
            border: `1px solid ${getStatusBorderColor(jobStatus.status)}`,
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <StatusIcon status={jobStatus.status} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {getStatusLabel(jobStatus.status)}
            </span>
          </div>

          {jobStatus.ai_summary && (
            <p style={{ margin: '8px 0', fontSize: '13px', color: '#444' }}>
              {jobStatus.ai_summary}
            </p>
          )}

          {jobStatus.proposed_changes && jobStatus.proposed_changes.length > 0 && (
            <p style={{ margin: '8px 0', fontSize: '12px', color: '#666' }}>
              {jobStatus.proposed_changes.length} change(s) proposed
            </p>
          )}

          {jobStatus.error_message && (
            <p style={{ margin: '8px 0', fontSize: '12px', color: '#c00' }}>
              Error: {jobStatus.error_message}
            </p>
          )}

          {jobStatus.status === 'ready_for_review' && (
            <a
              href={`/dashboard/resource-updates/${jobStatus.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#0066cc',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Review Changes
              <ExternalLinkIcon />
            </a>
          )}

          {['pending', 'scraping', 'analyzing', 'screenshots'].includes(jobStatus.status) && (
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#888' }}>
              This may take a few minutes. Status will update automatically.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Helper components
function LoadingSpinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (['pending', 'scraping', 'analyzing', 'screenshots'].includes(status)) {
    return <LoadingSpinner />;
  }
  if (status === 'ready_for_review') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c90" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  }
  if (status === 'applied') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#090" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (status === 'failed' || status === 'rejected') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c00" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return null;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Starting update...',
    scraping: 'Scraping websites...',
    analyzing: 'Analyzing with AI...',
    screenshots: 'Capturing screenshots...',
    ready_for_review: 'Ready for Review',
    applied: 'Changes Applied',
    rejected: 'Rejected',
    failed: 'Update Failed',
  };
  return labels[status] || status;
}

function getStatusBackgroundColor(status: string): string {
  if (['pending', 'scraping', 'analyzing', 'screenshots'].includes(status)) return '#f0f0ff';
  if (status === 'ready_for_review') return '#fff8e6';
  if (status === 'applied') return '#e6ffe6';
  if (status === 'failed' || status === 'rejected') return '#fee';
  return '#f5f5f5';
}

function getStatusBorderColor(status: string): string {
  if (['pending', 'scraping', 'analyzing', 'screenshots'].includes(status)) return '#c0c0ff';
  if (status === 'ready_for_review') return '#ffc';
  if (status === 'applied') return '#6c6';
  if (status === 'failed' || status === 'rejected') return '#f88';
  return '#ddd';
}
