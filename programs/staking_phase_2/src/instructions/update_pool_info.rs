use anchor_lang::prelude::*;

use crate::{errors::StakeError, seeds::*, state::PoolInfo};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdatePoolInfoArgs {
    pub admin: Option<Pubkey>,
    pub collection: Option<[Pubkey; 2]>,
    pub demr_mint: Option<Pubkey>,
    pub energy_per_sec: Option<[u64; 2]>,
    pub energy_per_box: Option<u64>,
    pub stake_start: Option<[i64; 2]>,
    pub demr_stake_amount: Option<u64>,
    pub demr_per_box: Option<[u64; 8]>,
    pub open_box_rate: Option<[u64; 8]>,
}

#[derive(Accounts)]
pub struct UpdatePoolInfo<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_CONFIG_SEED],
        bump = pool_info.stake_bump,
    )]
    pub pool_info: Box<Account<'info, PoolInfo>>,

    pub system_program: Program<'info, System>,
}

pub fn update_pool_info_handler(
    ctx: Context<UpdatePoolInfo>,
    args: UpdatePoolInfoArgs,
) -> Result<()> {
    let pool_info = &mut ctx.accounts.pool_info;
    require!(
        pool_info.admin == ctx.accounts.signer.key(),
        StakeError::OwnerError
    );

    if let Some(admin) = args.admin {
        pool_info.admin = admin;
        msg!("admin update");
    }
    if let Some(collection) = args.collection {
        pool_info.collection = collection;
        msg!("collection update");
    }
    if args.demr_mint.is_some() {
        pool_info.demr_mint = args.demr_mint.unwrap();
        msg!("demr_mint update {}", pool_info.demr_mint);
    }
    if let Some(energy_per_sec) = args.energy_per_sec {
        pool_info.energy_per_sec = energy_per_sec;
        msg!("energy_per_sec update");
    }
    if let Some(energy_per_box) = args.energy_per_box {
        pool_info.energy_per_box = energy_per_box;
        msg!("energy_per_box update");
    }
    if let Some(stake_start) = args.stake_start {
        pool_info.stake_start = stake_start;
        msg!("stake_start update");
    }
    if let Some(demr_stake_amount) = args.demr_stake_amount {
        pool_info.demr_stake_amount = demr_stake_amount;
        msg!("demr_stake_amount update : {}", pool_info.demr_stake_amount);
    }
    if let Some(demr_per_box) = args.demr_per_box {
        pool_info.demr_per_box = demr_per_box;
        msg!("demr_per_box update");
    }
    if let Some(open_box_rate) = args.open_box_rate {
        pool_info.open_box_rate = open_box_rate;
        msg!("open_box_rate update");
    }

    Ok(())
}
