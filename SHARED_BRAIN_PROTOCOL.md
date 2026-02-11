# 🧠 AIRA SHARED BRAIN PROTOCOL (v1.0)
**"One Brain, Multiple Hands."**

This protocol defines how the Aira Elite Squad uses the `shared-context/` directory to achieve autonomous synchronization without human intervention.

---

## 📂 DIRECTORY STRUCTURE
- `priorities.md`: The single source of truth for current mission goals (Updated by Commander).
- `agent-outputs/`: Where Sniper and Sentinel drop their raw scouting/auditing files.
- `feedback/`: Logs of Boss approvals/rejections. All agents must read this to improve performance.
- `roundtable/`: Final synthesized reports ready for the Boss.

## 🤖 AGENT WORKFLOW
1.  **Commander (Aira):**
    -   Writes high-level goals to `priorities.md`.
    -   Reads `agent-outputs/` to synthesize final verdicts.
2.  **Sniper:**
    -   Checks `priorities.md` for new targets.
    -   Writes research findings to `agent-outputs/sniper_[project].md`.
3.  **Sentinel:**
    -   Monitors `agent-outputs/` for new Sniper files.
    -   Automatically audits found CAs and appends results to the same file or a new `sentinel_[project].md`.

## 🛡️ SECURITY & PRIVACY
- This directory is **INTERNAL ONLY**. 
- It must NEVER be exposed to the public or uploaded to GitHub without sanitization.
- Purpose: Efficiency and "Most Agentic" behavior for the Squad.
