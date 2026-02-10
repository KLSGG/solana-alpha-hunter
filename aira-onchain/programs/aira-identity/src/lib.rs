use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // Placeholder: Replace with actual Program ID after build

#[program]
pub mod aira_identity {
    use super::*;

    /// Instruction Zero: Initialize the Agent Identity
    /// Sets up the Dual Signer model (Owner + Agent Key)
    pub fn initialize_agent(
        ctx: Context<InitializeAgent>, 
        agent_signer: Pubkey, 
        metadata_hash: [u8; 32]
    ) -> Result<()> {
        let agent_account = &mut ctx.accounts.agent_account;
        
        // 1. Set Authority (Cold/Warm Wallet)
        agent_account.owner = ctx.accounts.owner.key();
        
        // 2. Set Agent Signer (Hot Wallet - The Bot)
        agent_account.agent_signer = agent_signer;
        
        // 3. Initialize Metadata
        agent_account.created_at = Clock::get()?.unix_timestamp;
        agent_account.reputation_score = 0; // Start from zero
        agent_account.metadata_hash = metadata_hash;
        
        // 4. Store Bump for PDA validation
        agent_account.bump = ctx.bumps.agent_account;
        
        msg!("🌸 Aira Identity Initialized! 🌸");
        msg!("Owner (Boss): {}", agent_account.owner);
        msg!("Agent (Aira): {}", agent_account.agent_signer);
        
        Ok(())
    }

    /// Post an Alpha Verdict on-chain
    pub fn post_verdict(
        ctx: Context<PostVerdict>,
        project_id: String,
        verdict_hash: [u8; 32], // Hash of the detailed report
        score: u8,              // 0-10
    ) -> Result<()> {
        let agent_account = &ctx.accounts.agent_account;
        
        // Only Aira (agent_signer) can post daily verdicts
        require_keys_eq!(
            ctx.accounts.signer.key(), 
            agent_account.agent_signer,
            AiraError::UnauthorizedSigner
        );

        msg!("🎯 Verdict Posted: {} | Score: {}/10", project_id, score);
        msg!("Proof: {:?}", verdict_hash);
        
        Ok(())
    }
}

#[error_code]
pub enum AiraError {
    #[msg("Only the designated Agent Signer can perform this action.")]
    UnauthorizedSigner,
}

#[derive(Accounts)]
pub struct PostVerdict<'info> {
    pub agent_account: Account<'info, AgentIdentity>,
    pub signer: Signer<'info>,
}

#[account]
pub struct AgentIdentity {
    pub owner: Pubkey,          // 32 bytes - The Human Boss
    pub agent_signer: Pubkey,   // 32 bytes - The AI Agent (limited permissions)
    pub created_at: i64,        // 8 bytes
    pub reputation_score: u64,  // 8 bytes - Verifiable on-chain clout
    pub metadata_hash: [u8; 32],// 32 bytes - IPFS Hash of profile.json
    pub bump: u8,               // 1 byte
}

impl AgentIdentity {
    // Space Calculation:
    // Discriminator: 8
    // Owner: 32
    // Agent Signer: 32
    // Created At: 8
    // Reputation: 8
    // Metadata Hash: 32
    // Bump: 1
    // Total: 121 bytes
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 32 + 1; 
}

#[derive(Accounts)]
pub struct InitializeAgent<'info> {
    #[account(
        init, 
        payer = owner, 
        space = AgentIdentity::LEN,
        seeds = [b"agent-identity", owner.key().as_ref()],
        bump
    )]
    pub agent_account: Account<'info, AgentIdentity>,
    
    #[account(mut)]
    pub owner: Signer<'info>, // Must be Sếp signing this!
    
    pub system_program: Program<'info, System>,
}
