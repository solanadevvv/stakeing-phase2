use anchor_lang::prelude::*;

#[error_code]
pub enum StakeError {
    #[msg("the given mint account doesn't belong to NFT")]
    TokenNotNFT,
    #[msg("the given token account has no token")]
    TokenAccountEmpty,
    #[msg("the collection field in the metadata is not verified")]
    CollectionNotVerified,
    #[msg("the collection doesn't match the staking details")]
    InvalidCollection,
    #[msg("user info bump error")]
    UserInfoBumpError,
    #[msg("owner  error")]
    OwnerError,
    #[msg("open box too much error")]
    OpenBoxTooMuchError,
    #[msg("demr token error")]
    DemrError,
    #[msg("demr auth check error")]
    DemrAuthError,
    #[msg("demr custody check error")]
    DemrCustodyError,
    #[msg("user demr account check error")]
    UserAccountError,
    #[msg("staking is not start error")]
    StartError,
    #[msg("staking is end error")]
    EndError,
    #[msg("open box reward zero error")]
    RewardZreoError,
    #[msg("no enough energy error")]
    NoEnoughEnergyError,
    #[msg("account writable error")]
    AccWritableError,
    #[msg("claimed error")]
    ClaimedError,
    #[msg("init param error")]
    InitParamError,
    #[msg("UnauthorizedAccess error")]
    UnauthorizedAccess,
}
