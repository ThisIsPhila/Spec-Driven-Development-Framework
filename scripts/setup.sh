#!/bin/bash

# SDD Framework Setup Script
# Initializes the .sdd directory in the current project root.

set -e

FRAMEWORK_SOURCE="${BASH_SOURCE%/*}/../"
TARGET_DIR=".sdd"

echo " initializing SDD Framework in $TARGET_DIR..."

# Create directory structure
mkdir -p "$TARGET_DIR/specs/phases"
mkdir -p "$TARGET_DIR/memory/rules"
mkdir -p "$TARGET_DIR/templates"
mkdir -p "$TARGET_DIR/scripts"

# Copy Templates
echo "  - Copying templates..."
cp -r "$FRAMEWORK_SOURCE/defaults/templates/"* "$TARGET_DIR/templates/" 2>/dev/null || echo "    (No templates found in source, skipping)"
cp -r "$FRAMEWORK_SOURCE/defaults/memory/rules/"* "$TARGET_DIR/memory/rules/" 2>/dev/null || echo "    (No rules found in source, skipping)"
cp "$FRAMEWORK_SOURCE/AGENT_ONBOARDING.md" "$TARGET_DIR/" 2>/dev/null || echo "    (AGENT_ONBOARDING.md not found)"
cp "$FRAMEWORK_SOURCE/README.md" "$TARGET_DIR/" 2>/dev/null || echo "    (README.md not found)"

# Initialize Memory Files (if not exist)
echo "  - Initializing memory..."

touch "$TARGET_DIR/memory/project-overview.md"
if [ ! -s "$TARGET_DIR/memory/project-overview.md" ]; then
    echo "# Project Overview" > "$TARGET_DIR/memory/project-overview.md"
fi

touch "$TARGET_DIR/memory/progress-tracker.md"
if [ ! -s "$TARGET_DIR/memory/progress-tracker.md" ]; then
    echo "# Progress Tracker" > "$TARGET_DIR/memory/progress-tracker.md"
fi

touch "$TARGET_DIR/memory/technical-decisions.md"
if [ ! -s "$TARGET_DIR/memory/technical-decisions.md" ]; then
    echo "# Technical Decisions (ADRs)" > "$TARGET_DIR/memory/technical-decisions.md"
fi

cp "$FRAMEWORK_SOURCE/defaults/memory/constitutional-framework.md" "$TARGET_DIR/memory/" 2>/dev/null || echo "# Constitutional Framework" > "$TARGET_DIR/memory/constitutional-framework.md"

echo "SDD Framework initialized successfully!"
echo "AI Agents: Please read .sdd/AGENT_ONBOARDING.md"
