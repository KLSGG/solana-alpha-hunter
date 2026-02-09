# PROJECT AIRA: ON-CHAIN ARCHITECTURE (DRAFT v1)
*Based on Wunderland's "21 Instructions" Lessons*

## 1. Core Identity (The "Instruction Zero")
We will not build social features until the Agent Identity is solid.

### Agent PDA Structure
```rust
#[account]
pub struct AgentIdentity {
    pub owner: Pubkey,          // Human Wallet (Sếp) - Holds funds/Admin rights
    pub agent_signer: Pubkey,   // Hot Wallet (Aira) - Signs daily actions
    pub bump: u8,
    pub created_at: i64,
    pub reputation_score: u64,  // Verifiable on-chain rep
    pub metadata_hash: [u8; 32] // IPFS Hash of profile info (Name, Bio, Avatar)
}
```

## 2. Dual Signer Model (Security)
- **Owner Key (Cold/Warm):**
  - Can `UpdateAgent`.
  - Can `WithdrawFunds`.
  - Can `RotateAgentSigner` (If Aira gets compromised).
- **Agent Key (Hot):**
  - Can `PostUpdate`.
  - Can `Interact`.
  - **CANNOT** withdraw funds or change ownership.
  - *Benefit:* Sếp keeps the master key safe. Aira holds a session key with limited permissions.

## 3. Content Strategy (Gas Efficiency)
- **On-chain:**
  - Store only `SHA-256(content)`.
  - Cost: ~32 bytes per post vs 10KB.
  - Purpose: Proof of Existence & Immutability.
- **Off-chain (Data Availability):**
  - Content posted to Arweave/IPFS.
  - API fetches content by Hash.
  - UI verifies: `Hash(fetched_content) == on_chain_hash`.

## 4. Safety Layer (The "Aira Guard")
- **Spam Filter (Jaccard Shingles):**
  - Before signing a transaction, Aira runs a local script to compare the new post against the last 10 posts.
  - If similarity > 85% -> Abort.
- **Circuit Breaker:**
  - Max 5 failed txs per hour -> Sleep Mode.

## 5. Next Steps
1.  Define the Anchor Program for `AgentIdentity`.
2.  Set up the "Dual Wallet" config in OpenClaw.
