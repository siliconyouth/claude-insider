/**
 * AI Pipeline Stats API
 *
 * Returns statistics for the AI pipeline dashboard.
 * Includes operation queue status, document/resource analysis stats,
 * and relationship counts.
 *
 * Accessible to all authenticated users (for info panel display).
 */

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    // Check authentication (any authenticated user can view stats)
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run all stat queries in parallel for performance
    const [queueStats, docStats, resourceStats, relationshipStats] = await Promise.all([
      // Queue operation stats
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') as pending_operations,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_operations,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_operations,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_operations
        FROM ai_operation_queue
      `),

      // Documentation stats (from Supabase documentation table)
      pool.query(`
        SELECT
          COUNT(*) as total_docs,
          COUNT(*) FILTER (WHERE is_published = true) as published_docs
        FROM documentation
      `).catch(() => ({ rows: [{ total_docs: 0, published_docs: 0 }] })),

      // Resource stats
      pool.query(`
        SELECT
          COUNT(*) as total_resources,
          COUNT(*) FILTER (WHERE ai_analyzed_at IS NOT NULL) as enhanced_resources
        FROM resources
      `).catch(() => ({ rows: [{ total_resources: 0, enhanced_resources: 0 }] })),

      // Relationship stats
      pool.query(`
        SELECT
          COUNT(*) as total_relationships,
          COUNT(DISTINCT doc_slug) as analyzed_docs,
          COUNT(DISTINCT resource_id) as linked_resources,
          AVG(confidence_score) as avg_confidence
        FROM doc_resource_relationships
        WHERE is_active = true
      `).catch(() => ({ rows: [{ total_relationships: 0, analyzed_docs: 0, linked_resources: 0, avg_confidence: 0 }] })),
    ]);

    const queue = queueStats.rows[0];
    const docs = docStats.rows[0];
    const resources = resourceStats.rows[0];
    const relationships = relationshipStats.rows[0];

    return NextResponse.json({
      pendingOperations: parseInt(queue.pending_operations) || 0,
      inProgressOperations: parseInt(queue.in_progress_operations) || 0,
      completedOperations: parseInt(queue.completed_operations) || 0,
      failedOperations: parseInt(queue.failed_operations) || 0,
      totalDocs: parseInt(docs.total_docs) || 0,
      publishedDocs: parseInt(docs.published_docs) || 0,
      analyzedDocs: parseInt(relationships.analyzed_docs) || 0,
      totalResources: parseInt(resources.total_resources) || 0,
      enhancedResources: parseInt(resources.enhanced_resources) || 0,
      linkedResources: parseInt(relationships.linked_resources) || 0,
      totalRelationships: parseInt(relationships.total_relationships) || 0,
      avgConfidence: parseFloat(relationships.avg_confidence) || 0,
    });
  } catch (error) {
    console.error("[AI Stats Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get AI stats" },
      { status: 500 }
    );
  }
}
