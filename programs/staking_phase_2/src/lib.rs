use anchor_lang::prelude::*;

pub mod errors;
mod instructions;
pub mod seeds;
pub mod state;

use instructions::*;

declare_id!("8o2Cp5y8BPvFYsqaL9beYQPCs5Uy7XvFy5r3xvz9VNew");

#[program]
pub mod staking_phase_2 {

    use super::*;

    pub fn init_staking(ctx: Context<InitStaking>, args: InitStakingArgs) -> Result<()> {
        init_staking_handler(ctx, args)
    }

    pub fn stake<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, Stake<'info>>,
    ) -> Result<()> {
        stake_handler(ctx)
    }

    pub fn unstake<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, Unstake<'info>>,
    ) -> Result<()> {
        unstake_handler(ctx)
    }

    pub fn update_pool_info(ctx: Context<UpdatePoolInfo>, args: UpdatePoolInfoArgs) -> Result<()> {
        update_pool_info_handler(ctx, args)
    }

    pub fn swap_box<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, SwapBox<'info>>,
        box_num: u128,
    ) -> Result<()> {
        swap_box_handler(ctx, box_num)
    }

    pub fn open_box(ctx: Context<OpenBox>, args: OpenBoxArgs) -> Result<()> {
        open_box_handler(ctx, args)
    }

    pub fn claim(ctx: Context<Claim>, claim_index: u64) -> Result<()> {
        claim_handler(ctx, claim_index)
    }
}
