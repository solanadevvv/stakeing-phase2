use crate::state::PoolInfo;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitStakingArgs {
    pub collection: [Pubkey; 2],
}
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
    let pool_info = &mut ctx.accounts.pool_info;
    pool_info.admin = ctx.accounts.admin.key();
    pool_info.stake_bump = ctx.bumps.pool_info;
    pool_info.demr_stake_bump = ctx.bumps.demr_authority;
    pool_info.collection = args.collection;
    Ok(())
}
