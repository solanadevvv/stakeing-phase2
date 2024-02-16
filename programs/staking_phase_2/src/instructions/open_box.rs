use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};

use crate::{
    errors::StakeError,
    seeds::*,
    state::{PoolInfo, UserInfo},
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct OpenBoxArgs {
    pub num: u128,
}

#[derive(Accounts)]
pub struct OpenBox<'info> {
    #[account(
        seeds = [POOL_CONFIG_SEED],
        bump = pool_info.stake_bump
    )]
    pub pool_info: Box<Account<'info, PoolInfo>>,

    #[account(
        constraint = mint_account.key()==pool_info.demr_mint @ StakeError::DemrError,
    )]
    mint_account: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [
            USER_INFO_SEED,
            signer.key().as_ref(),
        ],
        bump = user_info.bump,
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

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

impl<'info> OpenBox<'info> {
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

pub fn open_box_handler(ctx: Context<OpenBox>, args: OpenBoxArgs) -> Result<()> {
    let pool_info = &ctx.accounts.pool_info;
    let user_info = &mut ctx.accounts.user_info;

    require!(
        user_info.pending_box >= args.num,
        StakeError::OpenBoxTooMuchError
    );
    user_info.pending_box -= args.num;
    user_info.opened_box += args.num;

    let clock = Clock::get()?;
    let cur_timestamp = clock.unix_timestamp as u64;
    let cur_slot = clock.slot as u64;

    let rate = &pool_info.open_box_rate;
    let reward_type = &pool_info.demr_per_box;

    let mut reward = 0_u64;
    for i in 0..args.num {
        let random = cur_timestamp * cur_slot * (i as u64 + 1) % 100000;
        let mut reward_ = 0_u64;
        for j in 0..8 {
            if random < rate[j] {
                reward_ = reward_type[j];
                break;
            }
        }
        require!(reward_ > 0, StakeError::RewardZreoError);
        msg!("reward: {},{}", random, reward_);
        reward += reward_;
    }

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
