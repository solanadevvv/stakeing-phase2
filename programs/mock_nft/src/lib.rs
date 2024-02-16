use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_master_edition_v3, create_metadata_accounts_v3,
        set_and_verify_sized_collection_item, sign_metadata, CreateMasterEditionV3,
        CreateMetadataAccountsV3, Metadata, SetAndVerifySizedCollectionItem, SignMetadata,
    },
    token::{self, Mint, MintTo, Token, TokenAccount},
};

declare_id!("C5QPdEnjyHBvNXuAZcZvwH83wXcCewr7tzaZWiePH1qv");

#[constant]
const COLLECTION_URI: &str = "https://ipfs.io/ipfs/QmUXCpiS9GgUHMgfrmP3w5ZdxqZ8MpVcaj2MrtvHyWJcZz";

#[constant]
const COLLECTION_SYMBOL: &str = "test1";

#[constant]
const COLLECTION_NAME: &str = "test1";

#[constant]
const TOKEN_NAME: &str = "test1";

#[constant]
const TOKEN_URI: &str = "https://ipfs.io/ipfs/QmZyqPjEazkMZiqDq7nPCCbvqUPia41HLw3bNGu8JdzmzJ";

#[program]
pub mod mock_nft {

    use anchor_spl::metadata::mpl_token_metadata::types::{CollectionDetails, Creator, DataV2};

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let seeds = b"collection";
        let bump = ctx.bumps.collection_mint;
        let signer: &[&[&[u8]]] = &[&[seeds, &[bump]]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.collection_mint.to_account_info(),
                    authority: ctx.accounts.collection_mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                },
                signer,
            ),
            1,
        )?;

        create_metadata_accounts_v3(
            CpiContext::new_with_signer(
                ctx.accounts.token_metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata_account.to_account_info(),
                    mint: ctx.accounts.collection_mint.to_account_info(),
                    mint_authority: ctx.accounts.collection_mint.to_account_info(),
                    update_authority: ctx.accounts.collection_mint.to_account_info(),
                    payer: ctx.accounts.signer.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                signer,
            ),
            DataV2 {
                name: COLLECTION_NAME.to_string(),
                symbol: COLLECTION_SYMBOL.to_string(),
                uri: COLLECTION_URI.to_string(),
                seller_fee_basis_points: 0,
                creators: Some(vec![Creator {
                    address: ctx.accounts.collection_mint.key(),
                    verified: false,
                    share: 100,
                }]),
                collection: None,
                uses: None,
            },
            true,
            true,
            Some(CollectionDetails::V1 { size: 0 }),
        )?;

        create_master_edition_v3(
            CpiContext::new_with_signer(
                ctx.accounts.token_metadata_program.to_account_info(),
                CreateMasterEditionV3 {
                    payer: ctx.accounts.signer.to_account_info(),
                    mint: ctx.accounts.collection_mint.to_account_info(),
                    edition: ctx.accounts.master_edition.to_account_info(),
                    mint_authority: ctx.accounts.collection_mint.to_account_info(),
                    update_authority: ctx.accounts.collection_mint.to_account_info(),
                    metadata: ctx.accounts.metadata_account.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                signer,
            ),
            Some(0),
        )?;

        sign_metadata(CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            SignMetadata {
                creator: ctx.accounts.collection_mint.to_account_info(),
                metadata: ctx.accounts.metadata_account.to_account_info(),
            },
            signer,
        ))?;
        Ok(())
    }

    pub fn mint(ctx: Context<MintCard>) -> Result<()> {
        let clock = Clock::get().unwrap();
        let now = clock.unix_timestamp;
        msg!("Mint Timestamp: {}", now);

        let seeds = b"collection";
        let bump = ctx.bumps.collection_mint;
        let signer: &[&[&[u8]]] = &[&[seeds, &[bump]]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.collection_mint.to_account_info(),
                },
                signer,
            ),
            1,
        )?;

        create_metadata_accounts_v3(
            CpiContext::new_with_signer(
                ctx.accounts.token_metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata_account.to_account_info(),
                    mint: ctx.accounts.token_mint.to_account_info(),
                    mint_authority: ctx.accounts.collection_mint.to_account_info(),
                    update_authority: ctx.accounts.collection_mint.to_account_info(),
                    payer: ctx.accounts.signer.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                &signer,
            ),
            DataV2 {
                name: TOKEN_NAME.to_string(),
                symbol: COLLECTION_SYMBOL.to_string(),
                uri: TOKEN_URI.to_string(),
                seller_fee_basis_points: 0,
                creators: Some(vec![Creator {
                    address: ctx.accounts.collection_mint.key(),
                    verified: false,
                    share: 100,
                }]),
                collection: None,
                uses: None,
            },
            true,
            true,
            None,
        )?;



        create_master_edition_v3(
            CpiContext::new_with_signer(
                ctx.accounts.token_metadata_program.to_account_info(),
                CreateMasterEditionV3 {
                    payer: ctx.accounts.signer.to_account_info(),
                    mint: ctx.accounts.token_mint.to_account_info(),
                    edition: ctx.accounts.master_edition.to_account_info(),
                    mint_authority: ctx.accounts.collection_mint.to_account_info(),
                    update_authority: ctx.accounts.collection_mint.to_account_info(),
                    metadata: ctx.accounts.metadata_account.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                signer,
            ),
            Some(0),
        )?;

        set_and_verify_sized_collection_item(
            CpiContext::new_with_signer(
                ctx.accounts.token_metadata_program.to_account_info(),
                SetAndVerifySizedCollectionItem {
                    metadata: ctx.accounts.metadata_account.to_account_info(),
                    collection_authority: ctx.accounts.collection_mint.to_account_info(),
                    payer: ctx.accounts.signer.to_account_info(),
                    update_authority: ctx.accounts.collection_mint.to_account_info(),
                    collection_mint: ctx.accounts.collection_mint.to_account_info(),
                    collection_metadata: ctx.accounts.collection_metadata_account.to_account_info(),
                    collection_master_edition: ctx
                        .accounts
                        .collection_master_edition
                        .to_account_info(),
                },
                signer,
            ),
            None,
        )?;

        sign_metadata(CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            SignMetadata {
                creator: ctx.accounts.collection_mint.to_account_info(),
                metadata: ctx.accounts.metadata_account.to_account_info(),
            },
            signer,
        ))?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintCard<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"collection"],
        bump,
    )]
    pub collection_mint: Account<'info, Mint>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(mut)]
    pub collection_master_edition: UncheckedAccount<'info>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(mut)]
    pub collection_metadata_account: UncheckedAccount<'info>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(
        init,
        payer = signer,
        mint::decimals = 0,
        mint::authority = collection_mint,
        mint::freeze_authority = collection_mint
    )]
    pub token_mint: Account<'info, Mint>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(
        init,
        payer = signer,
        associated_token::mint = token_mint,
        associated_token::authority = signer
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        seeds = [b"collection"],
        bump,
        payer = signer,
        mint::decimals = 0,
        mint::authority = collection_mint,
        mint::freeze_authority = collection_mint
    )]
    pub collection_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = collection_mint,
        associated_token::authority = signer
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
