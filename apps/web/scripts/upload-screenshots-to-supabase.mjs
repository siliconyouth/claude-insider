#!/usr/bin/env node

/**
 * Upload Resource Screenshots to Supabase Storage
 *
 * This script:
 * 1. Reads all PNG files from public/images/resources/
 * 2. Uploads them to Supabase Storage bucket "resource-screenshots"
 * 3. Updates the corresponding JSON files with screenshot URLs
 *
 * Usage: node scripts/upload-screenshots-to-supabase.mjs
 *
 * Requirements:
 * - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

/**
 * Parse .env.local file manually
 */
async function loadEnv() {
  try {
    const envPath = join(ROOT_DIR, ".env.local");
    const content = await readFile(envPath, "utf-8");
    const env = {};

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    }
    return env;
  } catch (err) {
    console.error("Failed to load .env.local:", err.message);
    return {};
  }
}

const SCREENSHOT_BUCKET = "resource-screenshots";
const SCREENSHOTS_DIR = join(ROOT_DIR, "public/images/resources");
const RESOURCES_DIR = join(ROOT_DIR, "data/resources");

// Map screenshot filenames to resource IDs
const FILENAME_TO_RESOURCE_ID = {
  "aider.png": "aider",
  "anthropic-cookbook.png": "anthropic-cookbook",
  "anthropic-courses.png": "anthropic-courses",
  "anthropic-docs.png": "anthropic-docs",
  "anthropic-prompt-library.png": "anthropic-prompt-library",
  "anthropic-sdk-python.png": "sdk-python-official",
  "anthropic-sdk-typescript.png": "sdk-typescript-official",
  "awesome-chatgpt-prompts.png": "awesome-chatgpt-prompts",
  "chatbox.png": "chatbox",
  "claude-code-github.png": "claude-code-repo",
  "cline-vscode.png": "cline-vscode",
  "continue-dev.png": "continue-dev",
  "cursor-editor.png": "cursor-editor",
  "fabric-prompts.png": "system-prompts-coding",
  "mcp-docs.png": "mcp-docs",
  "neovim-avante.png": "neovim-avante",
  "open-webui.png": "open-webui",
  "raycast-ai.png": "raycast-ai",
  "typing-mind.png": "typing-mind",
  "vercel-ai-sdk.png": "vercel-ai-sdk",
  "windsurf.png": "windsurf",
  "zed-editor.png": "zed-editor",
};

// Map resource IDs to their JSON files
const RESOURCE_ID_TO_FILE = {
  // tools.json
  "cursor-editor": "tools",
  "continue-dev": "tools",
  aider: "tools",
  "cline-vscode": "tools",
  "zed-editor": "tools",
  windsurf: "tools",
  "neovim-avante": "tools",
  "claude-cli-unofficial": "tools",
  "raycast-ai": "tools",
  chatbox: "tools",
  "typing-mind": "tools",
  "open-webui": "tools",
  // official.json
  "anthropic-docs": "official",
  "claude-code-docs": "official",
  "mcp-docs": "official",
  "anthropic-cookbook": "official",
  "claude-code-repo": "official",
  "anthropic-sdk-python": "official",
  "anthropic-sdk-typescript": "official",
  "prompt-engineering-guide": "official",
  "anthropic-blog": "official",
  "claude-console": "official",
  // tutorials.json
  "anthropic-courses": "tutorials",
  "deeplearning-claude": "tutorials",
  "rag-from-scratch": "tutorials",
  "building-ai-apps": "tutorials",
  "tool-use-tutorial": "tutorials",
  "streaming-tutorial": "tutorials",
  "langchain-crash-course": "tutorials",
  "llamaindex-tutorial": "tutorials",
  "claude-code-tutorial": "tutorials",
  "mcp-server-tutorial": "tutorials",
  "vector-databases": "tutorials",
  "fine-tuning-guide": "tutorials",
  // sdks.json
  "sdk-python-official": "sdks",
  "sdk-typescript-official": "sdks",
  "sdk-go": "sdks",
  "sdk-rust": "sdks",
  "sdk-ruby": "sdks",
  "sdk-java": "sdks",
  "sdk-php": "sdks",
  "sdk-dotnet": "sdks",
  "langchain-anthropic": "sdks",
  "llamaindex-anthropic": "sdks",
  "vercel-ai-sdk": "sdks",
  // prompts.json
  "anthropic-prompt-library": "prompts",
  "awesome-chatgpt-prompts": "prompts",
  "prompts-chat": "prompts",
  "system-prompts-coding": "prompts",
  "chain-of-thought": "prompts",
  "prompt-senior-developer": "prompts",
  "prompt-code-reviewer": "prompts",
  "prompt-technical-writer": "prompts",
  "few-shot-learning": "prompts",
  "structured-outputs": "prompts",
  "self-reflection": "prompts",
  "prompt-security-expert": "prompts",
};

async function main() {
  console.log("📸 Upload Resource Screenshots to Supabase Storage\n");

  // Load environment variables
  const env = await loadEnv();
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  console.log(`🔗 Supabase URL: ${SUPABASE_URL.substring(0, 40)}...`);

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Check if bucket exists, create if not
  console.log(`\n🪣 Checking storage bucket "${SCREENSHOT_BUCKET}"...`);
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error("❌ Failed to list buckets:", listError.message);
    process.exit(1);
  }

  const bucketExists = buckets?.some((b) => b.name === SCREENSHOT_BUCKET);

  if (!bucketExists) {
    console.log(`  Creating bucket "${SCREENSHOT_BUCKET}"...`);
    const { error: createError } = await supabase.storage.createBucket(
      SCREENSHOT_BUCKET,
      {
        public: true, // Make screenshots publicly accessible
        fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
      }
    );

    if (createError) {
      console.error("❌ Failed to create bucket:", createError.message);
      process.exit(1);
    }
    console.log(`  ✅ Created bucket "${SCREENSHOT_BUCKET}"`);
  } else {
    console.log(`  ✅ Bucket "${SCREENSHOT_BUCKET}" exists`);
  }

  // Read screenshot files
  console.log(`\n📂 Reading screenshots from ${SCREENSHOTS_DIR}...`);
  const files = await readdir(SCREENSHOTS_DIR);
  const pngFiles = files.filter((f) => f.endsWith(".png"));
  console.log(`  Found ${pngFiles.length} PNG files`);

  // Upload screenshots and collect URLs
  const uploadedUrls = {};
  let successCount = 0;
  let errorCount = 0;

  console.log(`\n⬆️  Uploading screenshots to Supabase Storage...\n`);

  for (const filename of pngFiles) {
    const resourceId = FILENAME_TO_RESOURCE_ID[filename];
    if (!resourceId) {
      console.log(`  ⚠️  Skipping ${filename} - no resource mapping`);
      continue;
    }

    const filePath = join(SCREENSHOTS_DIR, filename);
    const fileBuffer = await readFile(filePath);
    const storagePath = `${resourceId}/${Date.now()}-${filename}`;

    process.stdout.write(`  📤 ${filename} → ${resourceId}... `);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(SCREENSHOT_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.log(`❌ ${error.message}`);
      errorCount++;
      continue;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(SCREENSHOT_BUCKET).getPublicUrl(data.path);

    uploadedUrls[resourceId] = publicUrl;
    console.log(`✅`);
    successCount++;
  }

  console.log(`\n📊 Upload Summary:`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);

  // Update JSON files with screenshot URLs
  console.log(`\n📝 Updating resource JSON files...`);

  // Group uploaded URLs by JSON file
  const urlsByFile = {};
  for (const [resourceId, url] of Object.entries(uploadedUrls)) {
    const jsonFile = RESOURCE_ID_TO_FILE[resourceId];
    if (!jsonFile) {
      console.log(`  ⚠️  No JSON file mapping for ${resourceId}`);
      continue;
    }
    if (!urlsByFile[jsonFile]) {
      urlsByFile[jsonFile] = {};
    }
    urlsByFile[jsonFile][resourceId] = url;
  }

  // Update each JSON file
  for (const [jsonFileName, resourceUrls] of Object.entries(urlsByFile)) {
    const jsonPath = join(RESOURCES_DIR, `${jsonFileName}.json`);

    try {
      const jsonContent = await readFile(jsonPath, "utf-8");
      const resources = JSON.parse(jsonContent);

      let updatedCount = 0;
      for (const resource of resources) {
        if (resourceUrls[resource.id]) {
          // Add or update screenshotUrl field
          resource.screenshotUrl = resourceUrls[resource.id];
          updatedCount++;
        }
      }

      // Write back to file
      await writeFile(jsonPath, JSON.stringify(resources, null, 2) + "\n");
      console.log(
        `  ✅ Updated ${jsonFileName}.json (${updatedCount} resources)`
      );
    } catch (err) {
      console.log(`  ❌ Failed to update ${jsonFileName}.json:`, err.message);
    }
  }

  console.log(`\n✨ Done!`);
  console.log(`\n📋 Next steps:`);
  console.log(`  1. Verify screenshots at: ${SUPABASE_URL}/storage/v1/object/public/${SCREENSHOT_BUCKET}/`);
  console.log(`  2. Review updated JSON files in ${RESOURCES_DIR}`);
  console.log(`  3. Commit changes: git add . && git commit -m "feat(resources): add Supabase screenshot URLs"`);
}

main().catch(console.error);
