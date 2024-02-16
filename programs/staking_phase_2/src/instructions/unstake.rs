use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{close_account, transfer, CloseAccount, Mint, Token, TokenAccount, Transfer},
};

use crate::{
    errors::StakeError,
    seeds::*,
    state::{NftInfo, PoolInfo, UserInfo},
};

use super::stake::check_key;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        seeds = [POOL_CONFIG_SEED],
        bump = pool_info.stake_bump,
    )]
    pub pool_info: Box<Account<'info, PoolInfo>>,

    #[account(
        mut,
        seeds = [
            NFT_INFO_SEED,
            nft_info.nft_mint.as_ref(),
        ],
        bump = nft_info.bump,
        has_one = nft_mint,
        has_one = staker,
    )]
    pub nft_info: Box<Account<'info, NftInfo>>,

    #[account(
        mut,
        seeds = [
            USER_INFO_SEED,
            staker.key().as_ref(),
        ],
        bump = user_info.bump,
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(
        mint::decimals = 0,
        constraint = nft_mint.supply == 1 @ StakeError::TokenNotNFT,
    )]
    pub nft_mint: Box<Account<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = staker,
        associated_token::mint = nft_mint,
        associated_token::authority = staker,
    )]
    pub nft_receive_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = pool_info,
        constraint = nft_custody.amount == 1 @ StakeError::TokenAccountEmpty,
    )]
    pub nft_custody: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub staker: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Unstake<'info> {
    pub fn transfer_nft_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.nft_custody.to_account_info(),
            to: self.nft_receive_account.to_account_info(),
            authority: self.pool_info.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn close_account_ctx(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        let cpi_accounts = CloseAccount {
            account: self.nft_custody.to_account_info(),
            destination: self.staker.to_account_info(),
            authority: self.pool_info.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

pub fn unstake_handler<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, Unstake<'info>>,
) -> Result<()> {
    let pool_info = &ctx.accounts.pool_info;
    let clock = Clock::get().unwrap();
    let cur = clock.unix_timestamp;

    let stake_bump = pool_info.stake_bump;
    let nft_auth_seed = &[&POOL_CONFIG_SEED[..], &[stake_bump]];
    // Transfer NFT
    transfer(
        ctx.accounts
            .transfer_nft_ctx()
            .with_signer(&[&nft_auth_seed[..]]),
        1,
    )?;

    let remaining_accounts = ctx.remaining_accounts;

    let nft_info = &mut ctx.accounts.nft_info;
    nft_info.unstake_at = cur;
    nft_info.staking = false;

    if nft_info.collection == 2_u8 {
        let demr_authority = &remaining_accounts[0];
        let user_demr_account = &remaining_accounts[1];
        let demr_custody_account = &remaining_accounts[2];
        let cpi_program = &ctx.accounts.token_program;

        check_key(
            demr_authority,
            user_demr_account,
            demr_custody_account,
            &pool_info.demr_mint,
            pool_info.demr_stake_bump,
            ctx.program_id,
            ctx.accounts.staker.key,
        )?;

        let demr_auth_bump = pool_info.demr_stake_bump;
        let demr_auth_seed = &[&b"demr-stake-authority"[..], &[demr_auth_bump]];
        let signer_seeds = &[&demr_auth_seed[..]];
        let cpi_accounts = Transfer {
            from: demr_custody_account.to_account_info(),
            to: user_demr_account.to_account_info(),
            authority: demr_authority.to_account_info(),
        };

        let cpi_context: CpiContext<'_, '_, '_, '_, Transfer<'_>> =
            CpiContext::new(cpi_program.to_account_info(), cpi_accounts).with_signer(signer_seeds);
        transfer(cpi_context, pool_info.demr_stake_amount)?;
    }

    let user_info = &mut ctx.accounts.user_info;
    let collection_index = PoolInfo::get_collection_index(nft_info.collection == 1_u8);
    user_info.claim_pending_energy(cur);
    user_info.total_staked[collection_index] -= 1;

    // Close NFT Custody Account
    close_account(
        ctx.accounts
            .close_account_ctx()
            .with_signer(&[&nft_auth_seed[..]]),
    )?;
    Ok(())
}
