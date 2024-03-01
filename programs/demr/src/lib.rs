use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

#[constant]
pub const MINT_SEED: &[u8] = b"mint";

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
const TOKEN_NAME: &str = "DMR";

#[constant]
const TOKEN_SYMBOL: &str = "DMR";

#[constant]
const TOKEN_URL: &str = "https://static.demr.xyz/assets/dmr.json";

#[constant]
const TOKEN_DECIMALS: u8 = 6;

#[constant]
const TOKEN_TOTAL_SUPPLY: u64 = 100000000000000000;

declare_id!("CQE4PQ3V4jLkPw2FXDyGCuMRLyBB4zXonMCz69bT8XyU");

#[program]
pub mod demr {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, manager: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.bump = ctx.bumps.config;
        config.manager = manager;
        config.mint_bump = ctx.bumps.mint;
        config.total_supply = TOKEN_TOTAL_SUPPLY;

        let seeds = CONFIG_SEED;
        let signer_seeds: &[&[&[u8]]] = &[&[seeds, &[config.bump]]];

        create_metadata_accounts_v3(
            CpiContext::new_with_signer(
                ctx.accounts.token_metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    mint_authority: ctx.accounts.config.to_account_info(),
                    update_authority: ctx.accounts.config.to_account_info(),
                    payer: ctx.accounts.payer.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                &signer_seeds,
            ),
            DataV2 {
                name: TOKEN_NAME.to_string(),
                symbol: TOKEN_SYMBOL.to_string(),
                uri: TOKEN_URL.to_string(),
                seller_fee_basis_points: 0,
                creators: None,
                collection: None,
                uses: None,
            },
            true,
            true,
            None,
        )?;

        Ok(())
    }

    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.signer.key(),
            ctx.accounts.config.manager,
            DemrError::NotManager
        );
        // Create the MintTo struct for our context
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.receiver_account.to_account_info(),
            authority: ctx.accounts.config.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        // Create the CpiContext we need for the request

        let seeds = CONFIG_SEED;
        let signer_seeds: &[&[&[u8]]] = &[&[seeds, &[ctx.accounts.config.bump]]];
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);

        let total = amount + ctx.accounts.mint.supply;
        require!(
            total <= ctx.accounts.config.total_supply,
            DemrError::TooMuch
        );
        mint_to(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [MINT_SEED],
        bump,
        payer = payer,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = config,
        mint::freeze_authority = config,
    )]
    pub mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        seeds = [CONFIG_SEED],
        bump,
        space = 8 + DemrConfig::INIT_SPACE
    )]
    pub config: Box<Account<'info, DemrConfig>>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintToken<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Box<Account<'info, DemrConfig>>,

    #[account(
        mut,
        seeds = [MINT_SEED],
        bump,
    )]
    pub mint: Box<Account<'info, Mint>>,

    /// CHECK
    #[account()]
    pub receiver: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = receiver
    )]
    pub receiver_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct DemrConfig {
    pub total_supply: u64,
    pub manager: Pubkey,
    pub bump: u8,
    pub mint_bump: u8,
    pub vesting_count: u8,
}

#[error_code]
pub enum DemrError {
    #[msg("mint too much")]
    TooMuch,
    #[msg("not manager")]
    NotManager,
    #[msg("receiver error")]
    Receiver,
}
