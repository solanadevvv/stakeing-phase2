use anchor_lang::{prelude::*, solana_program::keccak::hashv};

use crate::{
    errors::StakeError,
    seeds::*,
    state::{ClaimInfo, PoolInfo, UserInfo},
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
        mut,
        seeds = [
            USER_INFO_SEED,
            signer.key().as_ref(),
        ],
        bump = user_info.bump,
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(
        init,
        payer = signer,
        seeds = [
            CLAIM_INFO_SEED,
            signer.key().as_ref(),
            user_info.claim_count.to_be_bytes().as_ref(),
        ],
        bump,
        space = 8+ ClaimInfo::INIT_SPACE,
    )]
    pub claim_info: Box<Account<'info, ClaimInfo>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
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
    user_info.claim_count += 1;

    let clock = Clock::get()?;
    let cur_timestamp = clock.unix_timestamp as u64;
    let cur_slot = clock.slot as u64;

    let rate = &pool_info.open_box_rate;
    let reward_type = &pool_info.demr_per_box;

    let mut reward = 0_u64;
    for i in 0..args.num {
        let hash_result = hashv(&[
            &(cur_timestamp + (i as u64)).to_be_bytes(),
            &(cur_slot * (i as u64)).to_be_bytes(),
            &ctx.accounts.signer.key.to_bytes(),
        ]);
        let mut bytes = [0u8; 8];
        bytes.copy_from_slice(&hash_result.to_bytes()[0..8]);
        let random = u64::from_le_bytes(bytes) % 100000;
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
    let claim_info = &mut ctx.accounts.claim_info;
    claim_info.bump = ctx.bumps.claim_info;
    claim_info.reward = reward;

    Ok(())
}
