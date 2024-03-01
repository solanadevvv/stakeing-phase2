use anchor_lang::prelude::*;

use crate::{
    errors::StakeError,
    seeds::*,
    state::{PoolInfo, UserInfo},
};

#[derive(Accounts)]
pub struct SwapBox<'info> {
    #[account(
        seeds = [POOL_CONFIG_SEED],
        bump = pool_info.stake_bump
    )]
    pub pool_info: Box<Account<'info, PoolInfo>>,

    #[account(
        mut,
        seeds = [
            USER_INFO_SEED,
            signer.key().as_ref(),
        ],
        bump = user_info.bump,
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn swap_box_handler<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, SwapBox<'info>>,
    box_num: u128,
) -> Result<()> {
    let clock = Clock::get()?;
    let current_timestamp = clock.unix_timestamp;
    let pool_info = &ctx.accounts.pool_info;
    let user_info = &mut ctx.accounts.user_info;
    user_info.claim_pending_energy(pool_info, current_timestamp);
    let energy_per_box = pool_info.energy_per_box as u128;

    if user_info.energy > 0 && energy_per_box > 0 && box_num > 0 {
        let need = energy_per_box * box_num;
        require!(user_info.energy >= need, StakeError::NoEnoughEnergyError);
        user_info.energy -= need;
        user_info.pending_box += box_num;
    }
    Ok(())
}
