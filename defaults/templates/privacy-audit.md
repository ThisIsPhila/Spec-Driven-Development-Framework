# Privacy Impact Assessment: [Feature Name]

## Data Flow Analysis
1. **Source:** (e.g., Microphone)
2. **Processor:** (e.g., Whisper Local)
3. **Storage:** (e.g., SQLite)
4. **Sync:** (e.g., Supabase)

## Threat Modeling
*   **Threat:** What if Supabase is hacked?
    *   *Mitigation:* Attacker sees "Hello {{NAME}}", not "Hello John".
*   **Threat:** What if the laptop is stolen?
    *   *Mitigation:* SQLite database is encrypted via SQLCipher.

## Compliance Checklist
- [ ] PII Detection enabled?
- [ ] User Consent obtained?
- [ ] Data Retention Policy defined?
