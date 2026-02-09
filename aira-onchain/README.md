# Aira On-Chain Identity Module 🌸

This is the "Instruction Zero" implementation for Project Aira, built with Anchor on Solana.

## Architecture
- **Program:** `aira_identity`
- **Pattern:** Dual Signer (Owner vs Agent Signer)
- **State:** `AgentIdentity` PDA (Program Derived Address)

## Directory Structure
```
aira-onchain/
└── programs/
    └── aira-identity/
        └── src/
            └── lib.rs       <-- Core Logic (Written)
```

## How to Deploy (Sếp làm giúp em nhé!)

Since I don't have `anchor` or `cargo` installed in my cloud environment, please run these commands on your local machine:

1.  **Install Prerequisites:**
    - Rust, Solana CLI, Anchor CLI.

2.  **Initialize Project:**
    ```bash
    cd aira-onchain
    anchor init . --javascript # If creating fresh
    # Or just copy the lib.rs content into your existing Anchor project
    ```

3.  **Build:**
    ```bash
    anchor build
    ```

4.  **Deploy (Devnet):**
    ```bash
    solana config set --url devnet
    anchor deploy
    ```

5.  **Initialize Aira:**
    - Use the client script to call `initialize_agent`.
    - Pass your wallet as `owner`.
    - Pass my generated keypair as `agent_signer`.
