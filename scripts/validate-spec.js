#!/usr/bin/env node
// UTF-8

/**
 * Spec Linter: validates privacy and profile-specific requirements for feature specs.
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
const fileName = path.basename(resolvedPath).toLowerCase();

// Determine active profile
let activeProfile = "general";
const profilePath = path.join(process.cwd(), ".sdd", ".profile");
if (fs.existsSync(profilePath)) {
  activeProfile = fs.readFileSync(profilePath, "utf8").trim().toLowerCase();
}

console.log(`🔍 Linting spec: ${path.relative(process.cwd(), resolvedPath)} (Profile: ${activeProfile})`);

const isRequirements = fileName.includes("requirements") || /requirements/i.test(content) || /## 📋 Requirements/i.test(content);
const isDesign = fileName.includes("design") || /design/i.test(content) || /## 🎯 Design Overview/i.test(content);

// 1. General checks (Privacy & Security Model check for requirements files)
if (isRequirements) {
  const PRIVACY_SECTION_PATTERN = /privacy & security model/i;
  const PII_YES_CHECKBOX = /\[x\]\s*Yes/i;
  const PII_YES_VALUE = /:\s*Yes\b(?!\s*\/)/i;
  const MASKING_CONTROL_PATTERNS = [
    /\[[xX]\]\s*Uses\s+`packages\/privacy-guard`/i,
    /\[[xX]\]\s*Encryption Required/i,
  ];

  const hasPrivacySection = PRIVACY_SECTION_PATTERN.test(content);
  if (!hasPrivacySection) {
    console.error("❌ Spec is missing 'Privacy & Security Model' section.");
    process.exit(1);
  }

  // Detect PII risk by allowing either a checked checkbox ("[x] Yes") or a plain "PII Risk: Yes" value.
  const piiLineMatch = content.match(/pii\s*risk[^\n]*/i);
  const piiIsYes =
    piiLineMatch &&
    (PII_YES_CHECKBOX.test(piiLineMatch[0]) || PII_YES_VALUE.test(piiLineMatch[0]));

  // Capture only the Masking Strategy section up to the next Markdown heading.
  const maskingSection = content.match(/masking strategy[\s\S]*?(?=\n##|\n#(?:\s|$)|$)/i);
  // Require at least one masking control (privacy guard or encryption) to be checked when PII is Yes.
  const hasMaskingChecked =
    maskingSection &&
    MASKING_CONTROL_PATTERNS.some((pattern) => pattern.test(maskingSection[0]));

  if (piiIsYes && !hasMaskingChecked) {
    console.error("❌ PII risk marked as 'Yes' but no masking strategy is checked.");
    process.exit(1);
  }
}

// 2. Profile-Specific checks: devsecops
if (activeProfile.includes("devsecops")) {
  const isSecurityReq = fileName.includes("security-requirements") || fileName.includes("security_requirements") || /security requirements/i.test(content);
  const isSecurityDesign = fileName.includes("security-design") || fileName.includes("security_design") || /security design/i.test(content);

  if (isSecurityReq) {
    if (!/threat surface summary/i.test(content)) {
      console.error("❌ Security Requirements spec is missing 'Threat Surface Summary' section.");
      process.exit(1);
    }
  }

  if (isSecurityDesign) {
    if (!/threat model/i.test(content)) {
      console.error("❌ Security Design spec is missing 'Threat Model' section.");
      process.exit(1);
    }
    if (!/risk assessment/i.test(content)) {
      console.error("❌ Security Design spec is missing 'Risk Assessment' section.");
      process.exit(1);
    }
    if (!/security checklist/i.test(content)) {
      console.error("❌ Security Design spec is missing 'Security Checklist' section.");
      process.exit(1);
    }
  }
}

// 3. Profile-Specific checks: mlops
if (activeProfile.includes("mlops")) {
  const isMLDesign = fileName.includes("model-design") || fileName.includes("model_design") || /ml model design/i.test(content) || /model design/i.test(content);

  if (isMLDesign && isDesign) {
    if (!/dataset/i.test(content)) {
      console.error("❌ ML Model Design spec is missing 'Dataset' section.");
      process.exit(1);
    }
    if (!/experiment tracking/i.test(content)) {
      console.error("❌ ML Model Design spec is missing 'Experiment Tracking' section.");
      process.exit(1);
    }
    if (!/model performance/i.test(content)) {
      console.error("❌ ML Model Design spec is missing 'Model Performance' section.");
      process.exit(1);
    }
  }
}

console.log("✅ Spec passed all profile-aware validation checks.");
