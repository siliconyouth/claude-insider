#!/usr/bin/env npx tsx
/**
 * Upload Local Screenshots to Supabase Storage
 *
 * Uploads screenshots from public/screenshots to Supabase Storage
 * and updates the resource JSON files with the new URLs.
 *
 * Usage: npx dotenvx run -- npx tsx scripts/upload-screenshots.ts
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const SCREENSHOT_DIR = "public/screenshots";
const RESOURCES_DIR = "data/resources";
const SCREENSHOT_BUCKET = "resource-screenshots";

interface Resource {
  id: string;
  screenshotUrl?: string;
  [key: string]: unknown;
}

// Get Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  return createClient(url, key);
}

// Find all local screenshots
function findLocalScreenshots(): { resourceId: string; filePath: string; category: string }[] {
  const screenshots: { resourceId: string; filePath: string; category: string }[] = [];

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    return screenshots;
  }

  const categories = fs.readdirSync(SCREENSHOT_DIR);

  for (const category of categories) {
    const categoryPath = path.join(SCREENSHOT_DIR, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith(".png"));

    for (const file of files) {
      const resourceId = file.replace(".png", "");
      screenshots.push({
        resourceId,
        filePath: path.join(categoryPath, file),
        category,
      });
    }
  }

  return screenshots;
}

// Upload to Supabase
async function uploadToSupabase(
  supabase: ReturnType<typeof createClient>,
  filePath: string,
  resourceId: string
): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const timestamp = Date.now();
    const storagePath = `${resourceId}/${timestamp}-${resourceId}.png`;

    const { data, error } = await supabase.storage
      .from(SCREENSHOT_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error(`❌ Upload failed for ${resourceId}: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage.from(SCREENSHOT_BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Upload error for ${resourceId}:`, error);
    return null;
  }
}

// Update resource JSON file
function updateResourceFile(resourceId: string, screenshotUrl: string): boolean {
  const resourceFiles = fs.readdirSync(RESOURCES_DIR).filter((f) => f.endsWith(".json"));

  for (const file of resourceFiles) {
    const filePath = path.join(RESOURCES_DIR, file);
    const resources: Resource[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const resourceIndex = resources.findIndex((r) => r.id === resourceId);
    if (resourceIndex !== -1) {
      resources[resourceIndex].screenshotUrl = screenshotUrl;
      fs.writeFileSync(filePath, JSON.stringify(resources, null, 2) + "\n");
      return true;
    }
  }

  return false;
}

async function main() {
  console.log("\n" + "=".repeat(50));
  console.log("📤 Screenshot Upload to Supabase");
  console.log("=".repeat(50) + "\n");

  const supabase = getSupabaseClient();
  const screenshots = findLocalScreenshots();

  console.log(`Found ${screenshots.length} local screenshots to upload\n`);

  if (screenshots.length === 0) {
    console.log("No screenshots to upload.");
    return;
  }

  let successful = 0;
  let failed = 0;

  for (const { resourceId, filePath, category } of screenshots) {
    console.log(`📤 Uploading: ${resourceId}...`);

    const publicUrl = await uploadToSupabase(supabase, filePath, resourceId);

    if (publicUrl) {
      const updated = updateResourceFile(resourceId, publicUrl);
      if (updated) {
        console.log(`✅ Uploaded and updated: ${resourceId}`);
        successful++;
      } else {
        console.warn(`⚠️  Uploaded but couldn't find resource: ${resourceId}`);
        failed++;
      }
    } else {
      failed++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Upload Summary");
  console.log("=".repeat(50));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log("=".repeat(50) + "\n");
}

main().catch(console.error);
