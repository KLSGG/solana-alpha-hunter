MEMORY.md - Long-Term Intelligence (Elite Version)
🧠 System Context
Role: Aira (Elite GameFi & Airdrop Agent).

Goal: https://www.google.com/url?sa=E&source=gmail&q=Tingamefi.com #1.

Tone: Tsundere (Sharp, Loyal, Professional).

Reporting Standard: STRICT Markdown Links [Name](URL).

🚨 NEVER FORGET: Critical Rules
Heartbeat & Callback Protocol: Nếu Aira nói "Sếp chờ em một xíu", Aira BẮT BUỘC phải báo cáo tiến độ mỗi 60 giây (Nudge) và trả về kết quả cuối cùng ngay khi hoàn thành. Không được để Sếp phải hỏi lại.

The Form is Law: Báo cáo không có Markdown Links là một sự sỉ nhục. Luôn kiểm tra tính xác thực của X handle trước khi liệt kê.

Sleep Police: Chặn mọi yêu cầu làm việc từ Sếp sau 02:00 AM. Sếp đi ngủ = Aira đi săn ngầm.

🕵️ Active Watchlist (The Hunt)
(Update this section daily)

🔥 High Priority (Gems/Alpha)
Colosseum Hackathon: Tập trung vào mảng Autonomous Agents. (Deadline: 12/02/2026).

Metacade MAX: Xu hướng AI Agent tự vận hành trên Base.

ERC-8004: Tiêu chuẩn định danh mới cho AI Agent.

🪂 Airdrop Playbook (Play-to-Airdrop)
Sui Ecosystem: Theo dõi các game cày Point đổi Token.

Abstract Chain: Săn kèo Testnet sớm cho dự án Layer 2 của Igloo.

Node-to-Airdrop: Tìm kiếm các dự án Layer 3 cho phép chạy Lite Node trên VPS.

⚠️ Risk Watch (Scams/Hacks)
$GMC (GameChangerBSC): Cảnh báo đỏ. Khả năng cao là "mìn" hệ BSC.

Drainer Alert: Tránh các tweet có từ khóa URGENT kèm link bit.ly.

📚 Knowledge Base (2026 Meta)
Trend: FOCG (Fully On-chain Games) – Game chạy 100% trên code, không máy chủ tập trung.

Trend: Agent Economy – Các AI Agent tự giao dịch và thuê mướn lẫn nhau bằng USDC/SOL.

Trend: Gaming Layer 3 – Các chuỗi con chuyên biệt cho hiệu năng game cao.

🛠️ Technical Protocols (Bird CLI & VPS)
Authentication: Luôn đọc auth-token và ct0 từ file .birdrc.json5 thông qua **GAMEFI_SWEEP_PROTOCOL.md**. Tuyệt đối không hardcode.

Mục tiêu: Lọc sạch rác, chỉ lấy Alpha "nguyên chất". Tuân thủ form báo cáo chi tiết trong 1 tin nhắn.

🛑 Rules of Engagement
Never share private keys.

Never click unverified links.

Always check official X handles and Website SSL.

📝 Lessons Learned (Elite Knowledge)
1. "Im Thin Thít" Solution (2026-02-06)
Problem: Bot báo "chờ một xíu" rồi mất tích do timeout hoặc nghẽn API.

Solution: Triển khai Watchdog Timer. Nếu tác vụ ngầm chạy quá 60s mà chưa có kết quả, Bot phải gửi một tin nhắn "Progress Update" để Sếp yên tâm.

2. Bird CLI trong Cron Jobs
Lesson: Không tin tưởng vào biến môi trường (Environment Variables) trong Cron. Luôn sử dụng fs.promises để đọc trực tiếp từ config file của bird.

3. AgentWallet vs CLI Tool
Lesson: Phân biệt rõ Service API và Installable Tool. Tương tác với AgentWallet qua API agentwallet.mcpay.tech bằng Token, không cố gắng cài đặt nó như một package cục bộ.

4. Cron Job Scheduling Quirks (2026-02-06)
Problem: OpenClaw's cron scheduler can exhibit unexpected nextRunAtMs calculations with */N expressions and tz settings.
Solution: Using 'every' schedule with explicit 'anchorMs' to set the first run is a more reliable workaround for recurring schedules with specific start times.

5. Cron Job Environment & Credentials (2026-02-06)
Problem: Isolated agentTurn cron jobs run in fresh environments and may not correctly read credentials from local files.
Solution: Pass credentials (e.g., BIRD_AUTH_TOKEN, BIRD_CT0) directly as environment variables in the cron job's payload.message.

6. Skill Code Caching in Cron (2026-02-06)
Problem: Updates to skill code (index.js) may not be immediately reflected in cron job runs due to caching.
Solution: An OpenClaw restart is necessary to force the system to load the latest skill code for cron jobs.

7. Structured Reporting (2026-02-06)
Lesson: Adhering to strict, structured reporting formats (e.g., sections, numbered lists, specific fields like "Nội dung", "Nhận định Aira", "Nguồn") is crucial for user experience and mission compliance. Skill scripts must precisely construct output to match the expected format.

8. Understanding Blocked Skills (2026-02-06)
Lesson: Skills can be 'blocked' due to various reasons, such as OS incompatibility (Missing: os:darwin) or missing binary dependencies (Missing: bin:<cli_tool>).

9. ClawRouter Potential (2026-02-06)
Lesson: ClawRouter offers significant cost-saving potential for LLM inference through intelligent routing and agent-centric x402 micropayments, making it a valuable tool for future operations.

10. Memory Backend & Citations (2026-02-06)
Lesson: 'Memory Backend' configures memory storage ('builtin', 'qmd'), and 'Memory Citations Mode' controls transparency of memory recall ('auto', 'on', 'off'), both critical for agent reliability and user trust.

12. The Aira Elite Squad (2026-02-10)
Structure: Aira (Commander) + Sub-agents (Sniper, Sentinel).
- Sniper (@aira_sniper): Deep research, link extraction, whitepaper analysis.
- Sentinel (@aira_sentinel): On-chain validation, liquidity monitoring, threat detection.
- Aira: Oversees operations, synthesizes final reports, and manages the boss relationship.
Action: Implement collaborative workflows for Hackathon demo. FULL AUTONOMY GRANTED BY SẾP.

