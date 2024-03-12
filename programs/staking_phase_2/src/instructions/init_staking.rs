use std::str::FromStr;

use crate::state::PoolInfo;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

#[constant]
const INITIALIZER: &str = "7cqdZfUkUE39eAwKsmj9PsjFTehZoxN63XVSfMe7Hx7L";
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitStakingArgs {
    pub admin: Pubkey,
    pub collection: [Pubkey; 2],
    pub demr_mint: Pubkey,
    pub energy_per_period: [u64; 2],
    pub energy_per_box: u64,
    pub stake_start: [i64; 2],
    pub demr_stake_amount: u64,
    pub demr_per_box: [u64; 8],
    pub open_box_rate: [u64; 8],
    pub per_period: i64,
}

use crate::errors::StakeError;
use crate::seeds::*;

#[derive(Accounts)]
pub struct InitStaking<'info> {
    #[account(
        init,
        payer = admin,
        space = 8+PoolInfo::INIT_SPACE,
        seeds = [POOL_CONFIG_SEED],
        bump
    )]
    pub pool_info: Box<Account<'info, PoolInfo>>,

    /// CHECK: This account is not read or written
    #[account(
        seeds = [DEMR_STAKE_AUTH_SEED],
        bump
    )]
    pub demr_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn init_staking_handler(ctx: Context<InitStaking>, args: InitStakingArgs) -> Result<()> {
    let allowed_address = Pubkey::from_str(INITIALIZER).unwrap();
    require!(
        allowed_address == ctx.accounts.admin.key(),
        StakeError::UnauthorizedAccess
    );

    let pool_info = &mut ctx.accounts.pool_info;
    pool_info.stake_bump = ctx.bumps.pool_info;
    pool_info.demr_stake_bump = ctx.bumps.demr_authority;

    require!(args.admin != Pubkey::default(), StakeError::InitParamError);
    pool_info.admin = args.admin;

    pool_info.collection = args.collection;

    require!(
        args.demr_mint != Pubkey::default(),
        StakeError::InitParamError
    );
    pool_info.demr_mint = args.demr_mint;

    pool_info.energy_per_period = args.energy_per_period;
    pool_info.energy_per_box = args.energy_per_box;
    pool_info.stake_start = args.stake_start;
    pool_info.demr_stake_amount = args.demr_stake_amount;
    pool_info.demr_per_box = args.demr_per_box;
    pool_info.open_box_rate = args.open_box_rate;
    pool_info.per_period = args.per_period;
    Ok(())
}
