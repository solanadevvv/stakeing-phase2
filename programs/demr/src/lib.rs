use std::str::FromStr;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata,
    },
    token::{
        mint_to, set_authority, spl_token::instruction::AuthorityType::MintTokens, Mint, MintTo,
        SetAuthority, Token, TokenAccount,
    },
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

declare_id!("FMcmweJZFaKd7AKkxVf2tYNakCueebbkcGVmzpHPXsba");

#[constant]
const INITIALIZER: &str = "7cqdZfUkUE39eAwKsmj9PsjFTehZoxN63XVSfMe7Hx7L";

#[program]
pub mod demr {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let allowed_address = Pubkey::from_str(INITIALIZER).unwrap();
        require!(
            allowed_address == ctx.accounts.payer.key(),
            DemrError::UnauthorizedAccess
        );
        let config = &mut ctx.accounts.config;
        config.bump = ctx.bumps.config;
        config.mint_bump = ctx.bumps.mint;

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
            false,
            true,
            None,
        )?;
        Ok(())
    }

    pub fn init_mint(ctx: Context<InitMint>, amounts: [u64; 8]) -> Result<()> {
        let allowed_address = Pubkey::from_str(INITIALIZER).unwrap();
        require!(
            allowed_address == ctx.accounts.payer.key(),
            DemrError::UnauthorizedAccess
        );
        let config = &ctx.accounts.config;
        let seeds = CONFIG_SEED;
        let signer_seeds: &[&[&[u8]]] = &[&[seeds, &[config.bump]]];

        for receiver_index in 0..8u8 {
            mint_to(
                ctx.accounts
                    .mint_to_receiver_ctx(receiver_index)
                    .with_signer(signer_seeds),
                amounts[receiver_index as usize],
            )?;
        }

        set_authority(
            ctx.accounts.set_authority_ctx().with_signer(signer_seeds),
            MintTokens,
            None,
        )?;

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
pub struct InitMint<'info> {
    #[account(
        mut,
        seeds = [MINT_SEED],
        bump=config.mint_bump,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = config,
    )]
    pub mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump=config.bump,
    )]
    pub config: Box<Account<'info, DemrConfig>>,

    // /// CHECK
    #[account(mut)]
    pub receiver1_account: Box<Account<'info, TokenAccount>>,

    // /// CHECK
    #[account(mut)]
    pub receiver2_account: Box<Account<'info, TokenAccount>>,

    // /// CHECK
    #[account(mut)]
    pub receiver3_account: Box<Account<'info, TokenAccount>>,

    // /// CHECK
    #[account(mut)]
    pub receiver4_account: Box<Account<'info, TokenAccount>>,

    // /// CHECK
    #[account(mut)]
    pub receiver5_account: Box<Account<'info, TokenAccount>>,

    // /// CHECK
    #[account(mut)]
    pub receiver6_account: Box<Account<'info, TokenAccount>>,

    /// CHECK
    #[account(mut)]
    pub receiver7_account: Box<Account<'info, TokenAccount>>,

    /// CHECK
    #[account(mut)]
    pub receiver8_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitMint<'info> {
    pub fn get_receiver_account(&self, receiver_index: u8) -> Result<AccountInfo<'info>> {
        match receiver_index {
            0 => Ok(self.receiver1_account.to_account_info()),
            1 => Ok(self.receiver2_account.to_account_info()),
            2 => Ok(self.receiver3_account.to_account_info()),
            3 => Ok(self.receiver4_account.to_account_info()),
            4 => Ok(self.receiver5_account.to_account_info()),
            5 => Ok(self.receiver6_account.to_account_info()),
            6 => Ok(self.receiver7_account.to_account_info()),
            7 => Ok(self.receiver8_account.to_account_info()),
            _ => err!(DemrError::Receiver),
        }
    }

    pub fn mint_to_receiver_ctx(
        &self,
        receiver_index: u8,
    ) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.get_receiver_account(receiver_index).unwrap(),
            authority: self.config.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn set_authority_ctx(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.mint.to_account_info().clone(),
            current_authority: self.config.to_account_info().clone(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[account]
#[derive(InitSpace)]
pub struct DemrConfig {
    pub bump: u8,
    pub mint_bump: u8,
}

#[error_code]
pub enum DemrError {
    #[msg("receiver error")]
    Receiver,
    #[msg("UnauthorizedAccess error")]
    UnauthorizedAccess,
}
