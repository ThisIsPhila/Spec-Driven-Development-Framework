#!/usr/bin/env node

/**
 * Spec Linter: validates privacy requirements for feature specs.
 *
 * Usage: node scripts/validate-spec.js path/to/spec.md
 */
const fs = require("fs");
const path = require("path");

const specPath = process.argv[2];

if (!specPath) {
  console.error("❌ Missing spec file path. Usage: node scripts/validate-spec.js path/to/spec.md");
  process.exit(1);
}

const resolvedPath = path.resolve(specPath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ Spec file not found: ${resolvedPath}`);
  process.exit(1);
}

const content = fs.readFileSync(resolvedPath, "utf8");

const hasPrivacySection = content.toLowerCase().includes("privacy & security model");
if (!hasPrivacySection) {
  console.error("❌ Spec is missing 'Privacy & Security Model' section.");
  process.exit(1);
}

const piiLine = content.match(/pii\s*risk[^\n]*:\s*Yes(?!\/No)/i);
const maskingSection = content.match(/masking strategy[\s\S]*?(?=\n##|\n#\s|\Z)/i);
const hasMaskingChecked =
  maskingSection && /\[[xX]\]/.test(maskingSection[0]);

if (piiLine && !hasMaskingChecked) {
  console.error("❌ PII risk marked as 'Yes' but no masking strategy is checked.");
  process.exit(1);
}

console.log("✅ Spec passed privacy checks.");
