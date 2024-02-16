use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

#[constant]
pub const MINT_SEED: &[u8] = b"mint";

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

declare_id!("CLjotqSXscvfm7FTfr1NoR9tz45EeFMm6nCYNRBcYpd4");

#[program]
pub mod demr {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, manager: Pubkey) -> Result<()> {
        ctx.accounts.config.bump = ctx.bumps.config;
        ctx.accounts.config.manager = manager;
        ctx.accounts.config.mint_bump = ctx.bumps.mint;
        Ok(())
    }

    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        require!(
            ctx.accounts.signer.key() <= ctx.accounts.config.manager,
            DemrError::NotManager
        );
        // Create the MintTo struct for our context
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.receiver_account.to_account_info(),
            authority: ctx.accounts.config.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        // Create the CpiContext we need for the request

        let seeds = MINT_SEED;
        let signer_seeds: &[&[&[u8]]] = &[&[seeds, &[ctx.accounts.config.bump]]];
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);

        let total = amount + ctx.accounts.mint.supply;
        require!(
            total <= ctx.accounts.config.total_supply,
            DemrError::TooMuch
        );
        // Execute anchor's helper function to mint tokens
        mint_to(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [MINT_SEED],
        bump,
        payer = payer,
        mint::decimals = 9,
        mint::authority = config,
        mint::freeze_authority = config,
    )]
    pub mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        seeds = [CONFIG_SEED],
        bump,
        space = 8 + DemrConfig::INIT_SPACE
    )]
    pub config: Box<Account<'info, DemrConfig>>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MintToken<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Box<Account<'info, DemrConfig>>,

    #[account(
        mut,
        seeds = [MINT_SEED],
        bump,
    )]
    pub mint: Box<Account<'info, Mint>>,

    /// CHECK
    #[account()]
    pub receiver: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = receiver
    )]
    pub receiver_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct DemrConfig {
    pub total_supply: u64,
    pub manager: Pubkey,
    pub bump: u8,
    pub mint_bump: u8,
}

#[error_code]
pub enum DemrError {
    #[msg("mint too much")]
    TooMuch,
    #[msg("not manager")]
    NotManager,
}
