use anchor_lang::prelude::*;

use crate::{errors::StakeError, seeds::*, state::PoolInfo};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdatePoolInfoArgs {
    pub stake_end: [i64; 2],
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
    pool_info.stake_end = args.stake_end;
    Ok(())
}
