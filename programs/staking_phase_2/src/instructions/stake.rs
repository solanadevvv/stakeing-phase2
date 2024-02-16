use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{get_associated_token_address, AssociatedToken},
    metadata::{Metadata, MetadataAccount},
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};

use crate::{
    errors::StakeError,
    seeds::*,
    state::{NftInfo, PoolInfo, StakeInfo, UserInfo},
};

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        seeds = [POOL_CONFIG_SEED],
        bump = pool_info.stake_bump
    )]
    pub pool_info: Box<Account<'info, PoolInfo>>,

    #[account(
        init_if_needed,
        payer = signer,
        space = 8+ NftInfo::INIT_SPACE,
        seeds = [
            NFT_INFO_SEED,
            nft_mint.key().as_ref(),
        ],
        bump
    )]
    pub nft_info: Box<Account<'info, NftInfo>>,

    #[account(
        init_if_needed,
        payer = signer,
        seeds = [
            USER_INFO_SEED,
            signer.key().as_ref(),
        ],
        bump,
        space = 8+ UserInfo::INIT_SPACE,
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(
        init_if_needed,
        payer = signer,
        seeds = [
            STAKE_INFO_SEED,
            signer.key().as_ref(),
            user_info.stake_id.to_be_bytes().as_ref(),
        ],
        bump,
        space = 8 + StakeInfo::INIT_SPACE,
    )]
    pub stake_info: Box<Account<'info, StakeInfo>>,

    #[account(
        mint::decimals = 0,
        constraint = nft_mint.supply == 1 @ StakeError::TokenNotNFT
    )]
    pub nft_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = signer,
        constraint = nft_token.amount == 1 @ StakeError::TokenAccountEmpty
    )]
    pub nft_token: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = nft_mint,
        associated_token::authority = pool_info
    )]
    pub nft_custody: Box<Account<'info, TokenAccount>>,

    #[account(
        seeds = [
            b"metadata",
            Metadata::id().as_ref(),
            nft_mint.key().as_ref()
        ],
        seeds::program = Metadata::id(),
        bump,
        constraint = nft_metadata.collection.as_ref().unwrap().verified @ StakeError::CollectionNotVerified,
    )]
    nft_metadata: Box<Account<'info, MetadataAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Stake<'info> {
    pub fn transfer_nft_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts: Transfer<'_> = Transfer {
            from: self.nft_token.to_account_info(),
            to: self.nft_custody.to_account_info(),
            authority: self.signer.to_account_info(),
        };

        let cpi_program = self.token_program.to_account_info();

        CpiContext::new(cpi_program, cpi_accounts)
    }
}

pub fn stake_handler<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, Stake<'info>>,
) -> Result<()> {
    let signer = &ctx.accounts.signer;

    let pool_info = &ctx.accounts.pool_info;

    let nft_mint = ctx.accounts.nft_mint.key();
    let clock = Clock::get().unwrap();
    let stake_at = clock.unix_timestamp;

    let collection: Pubkey = ctx.accounts.nft_metadata.collection.clone().unwrap().key;
    require!(
        pool_info.check_collection(&collection),
        StakeError::InvalidCollection
    );

    let collection_index = PoolInfo::get_collection_index(collection == pool_info.collection[0]);

    pool_info.check_stakeable(collection_index, stake_at)?;

    transfer(ctx.accounts.transfer_nft_ctx(), 1)?;

    let remaining_accounts = ctx.remaining_accounts;
    if collection_index == 1_usize {
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
            signer.key,
        )?;

        transfer_from_user_to_pool_vault(
            signer,
            user_demr_account,
            &demr_custody_account,
            cpi_program,
            pool_info.demr_stake_amount,
        )?;
    }

    let user_info = &mut ctx.accounts.user_info;
    if user_info.stake_id == 0 {
        user_info.last_calimed_time = stake_at;
        user_info.bump = ctx.bumps.user_info;
    } else {
        require!(
            user_info.bump == ctx.bumps.user_info,
            StakeError::UserInfoBumpError
        );
    }
    user_info.claim_pending_energy(stake_at);
    user_info.stake_id = user_info.stake_id + 1;
    user_info.total_staked[collection_index] += 1;

    let stake_info = &mut ctx.accounts.stake_info;
    stake_info.nft_mint = nft_mint;
    let collection_type = if collection_index == 0_usize { 1 } else { 2 };
    stake_info.collection = collection_type;
    let nft_info = &mut ctx.accounts.nft_info;

    nft_info.bump = ctx.bumps.nft_info;
    nft_info.staker = signer.key();
    nft_info.stake_at = stake_at;
    nft_info.staking = true;
    nft_info.nft_mint = nft_mint;
    nft_info.collection = collection_type;
    Ok(())
}

pub fn check_key<'info>(
    demr_authority: &AccountInfo<'info>,
    user_demr_account: &AccountInfo<'info>,
    demr_custody_account: &AccountInfo<'info>,
    demr_mint: &Pubkey,
    demr_stake_bump: u8,
    program_id: &Pubkey,
    signer_key: &Pubkey,
) -> Result<()> {
    let (demr_authority_key, demr_authority_bump) =
        Pubkey::find_program_address(&[b"demr-stake-authority"], program_id);
    require!(
        demr_authority_key == demr_authority.key() && demr_authority_bump == demr_stake_bump,
        StakeError::DemrAuthError
    );

    let user_demr_pub = get_associated_token_address(signer_key, demr_mint);
    require!(
        user_demr_account.key() == user_demr_pub.into(),
        StakeError::UserAccountError
    );

    let demr_custody_pub = get_associated_token_address(demr_authority.key, demr_mint);

    require!(
        demr_custody_account.key() == demr_custody_pub.into(),
        StakeError::DemrCustodyError
    );

    Ok(())
}

pub fn transfer_from_user_to_pool_vault<'info>(
    signer: &Signer<'info>,
    from: &AccountInfo<'info>,
    to_vault: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    let token_program_info = token_program.to_account_info();
    let from_token_info = from.to_account_info();
    transfer(
        CpiContext::new(
            token_program_info,
            Transfer {
                from: from_token_info,
                to: to_vault.to_account_info(),
                authority: signer.to_account_info(),
            },
        ),
        amount,
    )?;
    Ok(())
}
