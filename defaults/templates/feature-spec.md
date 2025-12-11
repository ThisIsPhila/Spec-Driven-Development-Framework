# [SPEC-ID] Feature Name

## 1. Context & Goal
*   **User Story:** As a [User], I want [Action], so that [Benefit].
*   **Business Value:** Why are we building this?
*   **[project] Ecosystem Role:** Does this belong to Voice, Chat, or Home?

## 2. Architecture & Monorepo Impact (The "Where")
*   **Primary App:** `apps/cogni-voice`
*   **Shared Packages Modified:**
    *   `packages/cul-schema` (Does this change the data model?)
    *   `packages/ui-kit` (New components?)
*   **New Dependencies:** (List any new npm packages)

## 3. Privacy & Security Model (The "DevSecOps" Layer)
*   **Data Ingestion:** What new data is collected? (e.g., Audio, Text)
*   **PII Risk:** Does this touch names, IDs, or locations? [Yes/No]
*   **Masking Strategy:**
    *   [ ] Uses `packages/privacy-guard` to mask PII?
    *   [ ] Encryption Required? (Standard vs. E2E)
*   **Persistence:**
    *   [ ] Local SQLite (Vector)
    *   [ ] Cloud Supabase (Sync)
    *   [ ] Ephemeral (RAM only)

## 4. Technical Implementation (The "How")
*   **Interface Changes:** (Describe props, endpoints, or events)
*   **Logic Flow:** (Step-by-step pseudocode)
*   **Error Handling:** What happens if the local DB is locked?

## 5. Verification Plan
*   **Unit Tests:** (Core logic in packages)
*   **Privacy Tests:** (Verify PII is NOT in the logs)
*   **Integration Tests:** (Does it sync to CUL?)
