use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};

use crate::{
    errors::StakeError,
    seeds::*,
    state::{ClaimInfo, PoolInfo},
};

#[derive(Accounts)]
#[instruction(_claim_index: u64)]
pub struct Claim<'info> {
    #[account(
        seeds = [POOL_CONFIG_SEED],
        bump = pool_info.stake_bump
    )]
    pub pool_info: Box<Account<'info, PoolInfo>>,

    #[account(
        constraint = mint_account.key()==pool_info.demr_mint @ StakeError::DemrError,
    )]
    pub mint_account: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [
            CLAIM_INFO_SEED,
            signer.key().as_ref(),
            _claim_index.to_be_bytes().as_ref(),
        ],
        bump=claim_info.bump
    )]
    pub claim_info: Box<Account<'info, ClaimInfo>>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = pool_info
    )]
    pub pool_asset_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint_account,
        associated_token::authority = signer,
    )]
    pub user_asset_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Claim<'info> {
    pub fn transfer_demr_reward_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.pool_asset_account.to_account_info(),
            to: self.user_asset_account.to_account_info(),
            authority: self.pool_info.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

pub fn claim_handler(ctx: Context<Claim>, _claim_index: u64) -> Result<()> {
    let pool_info = &ctx.accounts.pool_info;

    let claim_info: &mut Box<Account<'_, ClaimInfo>> = &mut ctx.accounts.claim_info;
    require!(!claim_info.claimed, StakeError::ClaimedError);
    claim_info.claimed = true;
    let reward = claim_info.reward;

    let bump = pool_info.stake_bump;
    let demr_seed = &[&POOL_CONFIG_SEED[..], &[bump]];
    let signer_seeds = &[&demr_seed[..]];

    transfer(
        ctx.accounts
            .transfer_demr_reward_ctx()
            .with_signer(signer_seeds),
        reward,
    )?;

    Ok(())
}
