import * as anchor from "@coral-xyz/anchor";
import { Program, web3, Wallet, AnchorProvider, BN } from "@coral-xyz/anchor";
import { StakingPhase2, IDL } from "../target/types/staking_phase_2";
import {
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import * as Buffer from "buffer";
import { PublicKey, Metaplex, Nft, Metadata } from "@metaplex-foundation/js";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import bs58 from "bs58";

describe("staking", () => {
  // Configure the client to use the local cluster.

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const signer = provider.publicKey!;

  const program = new Program(
    IDL,
    "7sg4HY7phWephPRSLsWSaGRVeWsRmn4bk3QLUsw22wdy",
    anchor.getProvider()
  );

  // const program = anchor.workspace.Staking as Program<Staking>;

  const [demrMint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("mint")],
    new PublicKey("FMcmweJZFaKd7AKkxVf2tYNakCueebbkcGVmzpHPXsba")
  );

  console.log("demrMint:",demrMint.toBase58());

  const collection1Addr = new PublicKey(
    "7uqzvGccE64bRmyBVr3knP9pG9hgJZpJXF7XPKvMiEwA"
  );

  // const collection2Addr = PublicKey.default;
  const collection2Addr = new PublicKey(
    "69Y7QVv6hMx7T7GHiQaHUmxFARhDeymt26yscDaLE5Uh"
  );

  // metaplex token metadata program ID
  const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const [CollectionMint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("collection")],
    program.programId
  );

  const [PoolInfoPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("config", "utf8")],
    program.programId
  );

  console.log("PoolInfoPDA (demr reward address)", PoolInfoPDA.toBase58());

  const poolAssetPDA = getAssociatedTokenAddressSync(
    demrMint,
    PoolInfoPDA,
    true
  );

  // console.log("todo mint reward to  poolAssetPDA:", poolAssetPDA.toBase58());

  const [ClaimConfigPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("claim-config", "utf8")],
    program.programId
  );

  const [nftAuthorityPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("nft-authority", "utf8")],
    program.programId
  );

  const [demrAuthorityPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("demr-stake-authority", "utf8")],
    program.programId
  );

  const [userInfoPDA] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.Buffer.from("user-info", "utf8"),
      program.provider.publicKey.toBuffer(),
    ],
    program.programId
  );

  const [userInfo2PDA] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.Buffer.from("user-info2", "utf8"),
      program.provider.publicKey.toBuffer(),
    ],
    program.programId
  );
  console.log("userInfo2PDA:", userInfo2PDA.toBase58());

  const [CollectionMintMetadataPDA] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      CollectionMint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  const [CollectionMintMasterPDA] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      CollectionMint.toBuffer(),
      Buffer.Buffer.from("edition", "utf8"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  // it("pri", async () => {
  //   let secretKey = bs58.decode(
  //     ""
  //   );
  //   console.log(`[${web3.Keypair.fromSecretKey(secretKey).secretKey}]`);

  //   // exporting back from Uint8Array to bs58 private key
  //   // == from solana cli id.json key file to phantom private key

  //   // privkey = new Uint8Array([111, 43, 24, ...]); // content of id.json here
  //   // console.log(bs58.encode(privkey));
  // });

  // it("stakeing phase2 Is initialized!", async () => {
  //   const cur = Math.floor(Date.now() / 1000);

  //   try {
  //     const tx = await program.methods
  //       .initStaking({
  //         admin: signer,
  //         collection: [collection1Addr, collection2Addr],
  //         demrMint: demrMint,
  //         energyPerBox: new anchor.BN("10"),
  //         perPeriod: new anchor.BN("60"), //to update
  //         energyPerPeriod: [new anchor.BN("1"), new anchor.BN("12")],
  //         stakeStart: [new anchor.BN(1710223200), new anchor.BN(1710225000)],
  //         demrStakeAmount: new anchor.BN("500000000000"),
  //         demrPerBox: [
  //           new anchor.BN("1000000000"),
  //           new anchor.BN("2000000000"),
  //           new anchor.BN("3000000000"),
  //           new anchor.BN("4000000000"),
  //           new anchor.BN("5000000000"),
  //           new anchor.BN("6000000000"),
  //           new anchor.BN("8000000000"),
  //           new anchor.BN("10000000000"),
  //         ],
  //         openBoxRate: [
  //           new anchor.BN("10000"),
  //           new anchor.BN("20000"),
  //           new anchor.BN("34000"),
  //           new anchor.BN("64000"),
  //           new anchor.BN("84000"),
  //           new anchor.BN("94000"),
  //           new anchor.BN("99000"),
  //           new anchor.BN("100000"),
  //         ],
  //       })
  //       .accounts({
  //         poolInfo: PoolInfoPDA,
  //         demrAuthority: demrAuthorityPDA,
  //         admin: signer,
  //       })
  //       .rpc();

  //     // 
  //     const createNewTokenTransaction = new web3.Transaction().add(
  //       createAssociatedTokenAccountInstruction(
  //         provider.publicKey,
  //         getAssociatedTokenAddressSync(demrMint, demrAuthorityPDA, true), //Associated token account
  //         demrAuthorityPDA, //token owner
  //         demrMint //Mint
  //       )
  //     );
  //     await provider.sendAndConfirm(createNewTokenTransaction);



  //     const createNewTokenTransaction1 = new web3.Transaction().add(
  //       createAssociatedTokenAccountInstruction(
  //         provider.publicKey,
  //         getAssociatedTokenAddressSync(demrMint, PoolInfoPDA, true), //Associated token account
  //         PoolInfoPDA, //token owner
  //         demrMint //Mint
  //       )
  //     );
  //     await provider.sendAndConfirm(createNewTokenTransaction1);

  //     console.log("Your transaction signature", tx);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  it("update config!", async () => {
    try {
      const cur = Math.floor(Date.now() / 1000);
      const tx = await program.methods
        .updatePoolInfo({
          stakeEnd: [
            new anchor.BN(1710336800),
            new anchor.BN(1710336800),
          ],
        })
        .accounts({
          poolInfo: PoolInfoPDA,
          signer: provider.publicKey,
        })
        .rpc();
      console.log("Your transaction signature", tx);
    } catch (error) {
      console.log(error);
    }

    // const poolInfo = await program.account.poolInfo.fetch(PoolInfoPDA);
    // console.log("poolInfo", poolInfo);
    // console.log("demrMint", poolInfo.demrMint.toBase58());
  });

  // it(" demr pre ", async () => {
  //   console.log(
  //     "todo create  token account PoolInfoPDA:",
  //     PoolInfoPDA.toBase58()
  //   );

  //   console.log(
  //     "todo mint reward to demr  poolAssetPDA:",
  //     poolAssetPDA.toBase58()
  //   );

  //   console.log("todo create demrAuthorityPDA", demrAuthorityPDA.toBase58());

  //   console.log("userInfo2PDA:", userInfo2PDA.toBase58());
  //   const poolInfo = await program.account.poolInfo.fetch(PoolInfoPDA);
  //   console.log("poolInfo", poolInfo);
  // });

  // it("stake", async () => {
  //   let stakeId = new anchor.BN("0");
  //   try {
  //     const userInfo = await program.account.userInfo.fetch(userInfoPDA);
  //     stakeId = userInfo.stakeId;
  //   } catch (error) {}
  //   console.log(stakeId);
  //   // get nfts
  //   const metaplex = new Metaplex(anchor.getProvider().connection);
  //   const myNfts = await metaplex.nfts().findAllByOwner({
  //     owner: program.provider.publicKey,
  //   });
  //   console.log(myNfts.length);
  //   const nft = myNfts[1] as Metadata;
  //   const mintAddr = nft.mintAddress;
  //   console.log(nft);
  //   console.log(mintAddr.toBase58());

  //   const [nftInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("nft-info", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const [stakeInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.Buffer.from("stake-info", "utf8"),
  //       program.provider.publicKey.toBuffer(),
  //       stakeId.toArrayLike(Buffer.Buffer, "be", 8),
  //     ],
  //     program.programId
  //   );

  //   const tokenAccountStake = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     program.provider.publicKey
  //   );

  //   const nftCustody = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     PoolInfoPDA,
  //     true
  //   );

  //   const [nftEditionPDA] = web3.PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.Buffer.from("metadata", "utf8"),
  //       TOKEN_METADATA_PROGRAM_ID.toBuffer(),
  //       mintAddr.toBuffer(),
  //       Buffer.Buffer.from("edition", "utf8"),
  //     ],
  //     TOKEN_METADATA_PROGRAM_ID
  //   );

  //   const tx = await program.methods
  //     .stake()
  //     .accounts({
  //       signer: program.provider.publicKey,
  //       poolInfo: PoolInfoPDA,
  //       nftInfo: nftInfoPDA,
  //       userInfo: userInfoPDA,
  //       stakeInfo: stakeInfoPDA,
  //       nftMint: mintAddr,
  //       nftToken: tokenAccountStake,
  //       nftMetadata: nft.address,
  //       nftCustody: nftCustody,
  //     })
  //     .transaction();
  //   // await program.provider.connection.confirmTransaction(tx, "confirmed");
  //   const txn = new web3.Transaction().add(
  //     web3.ComputeBudgetProgram.setComputeUnitLimit({
  //       units: 300_000,
  //     }),
  //     tx
  //   );
  //   try {
  //     const txsign = await program.provider.sendAndConfirm(txn);
  //     console.log(txsign);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  // it("unstake", async () => {
  //   const userInfo = await program.account.userInfo.fetch(userInfoPDA);
  //   console.log(userInfo);

  //   const [stakeInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.Buffer.from("stake-info", "utf8"),
  //       program.provider.publicKey.toBuffer(),
  //       userInfo.stakeId
  //         .sub(new anchor.BN("1"))
  //         .toArrayLike(Buffer.Buffer, "be", 8),
  //     ],
  //     program.programId
  //   );
  //   const stakeInfo = await program.account.stakeInfo.fetch(stakeInfoPDA);
  //   console.log(stakeInfo);

  //   const mintAddr = new PublicKey(stakeInfo.nftMint);
  //   const [nftInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("nft-info", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const nftReceiveAccount = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     program.provider.publicKey
  //   );

  //   const nftCustody = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     PoolInfoPDA,
  //     true
  //   );

  //   const tx = await program.methods
  //     .unstake()
  //     .accounts({
  //       staker: program.provider.publicKey,
  //       poolInfo: PoolInfoPDA,
  //       nftInfo: nftInfoPDA,
  //       userInfo: userInfoPDA,
  //       nftMint: mintAddr,
  //       nftReceiveAccount: nftReceiveAccount,
  //       nftCustody: nftCustody,
  //     })
  //     .rpc();
  //   await program.provider.connection.confirmTransaction(tx, "confirmed");
  // });

  // it("get user nft", async () => {
  //   const connection = new Connection(
  //     // "https://devnet.helius-rpc.com/?api-key=448ab5a2-40cb-44c1-8a48-5da06b40fb82",
  //     "https://solana-devnet.g.alchemy.com/v2/oGx_ikfhYmFE3gCnaeZjWU_te5h8eJFq",
  //     "confirmed"
  //   );
  //   const metaplex = new Metaplex(connection);
  //   const address = "DcieYK5Vs6jTeAdzDUawFRNPDM5fvghqKTT9geMNZdmg"; //用户地址
  //   const owner = new PublicKey(address);
  //   const myNfts = await metaplex.nfts().findAllByOwner({
  //     owner,
  //   });
  //   // const nfts = myNfts.filter((nft) => nft.symbol.includes("DMRN")); //根据symbol筛选
  //   console.log(myNfts.length);
  //   console.log(myNfts);
  // });

  // it("init claim", async () => {
  //   const tx = await program.methods
  //     .initClaim({
  //       collection1: collection1Addr,
  //       collection2: collection2Addr,
  //       period1: [new anchor.BN(""), new anchor.BN("")],
  //       period2: [new anchor.BN(""), new anchor.BN("")],
  //       reward1: [new anchor.BN(""), new anchor.BN(""), new anchor.BN("")],
  //       reward2: [new anchor.BN(""), new anchor.BN(""), new anchor.BN("")],
  //     })
  //     .accounts({
  //       signer: program.provider.publicKey,
  //       poolInfo: PoolInfoPDA,
  //       claimConfig: ClaimConfigPDA,
  //     })
  //     .transaction();
  //   // await program.provider.connection.confirmTransaction(tx, "confirmed");
  //   const txn = new web3.Transaction().add(
  //     web3.ComputeBudgetProgram.setComputeUnitLimit({
  //       units: 300_000,
  //     }),
  //     tx
  //   );
  //   try {
  //     const txsign = await program.provider.sendAndConfirm(txn);
  //     console.log(txsign);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  // it("claim", async () => {
  //   let stakeId = new anchor.BN("0");
  //   try {
  //     const userInfo = await program.account.userInfo.fetch(userInfoPDA);
  //     stakeId = userInfo.stakeId;
  //   } catch (error) {}
  //   console.log(stakeId);
  //   // get nfts
  //   const metaplex = new Metaplex(anchor.getProvider().connection);
  //   const myNfts = await metaplex.nfts().findAllByOwner({
  //     owner: program.provider.publicKey,
  //   });
  //   console.log(myNfts.length);
  //   const nft = myNfts[5] as Metadata;
  //   const mintAddr = nft.mintAddress;
  //   console.log(mintAddr.toBase58());

  //   // const nftInfo = await program.account.nftInfo.fetch()
  //   const poolInfo = await program.account.poolInfo.fetch(PoolInfoPDA);
  //   console.log("demrMint", poolInfo.demrMint.toBase58());

  //   const [nftInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("nft-info", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const [claimInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("claim-info", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const [stakeInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.Buffer.from("stake-info", "utf8"),
  //       stakeId.toArrayLike(Buffer.Buffer, "be", 8),
  //     ],
  //     program.programId
  //   );

  //   const tokenAccountStake = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     program.provider.publicKey
  //   );

  //   console.log("PoolInfoPDA", PoolInfoPDA.toBase58());

  //   const userAssetPDA = getAssociatedTokenAddressSync(
  //     demrMint,
  //     program.provider.publicKey,
  //     true
  //   );

  //   const tx = await program.methods
  //     .claim()
  //     .accounts({
  //       signer: program.provider.publicKey,
  //       poolInfo: PoolInfoPDA,
  //       claimInfo: claimInfoPDA,
  //       nftMint: mintAddr,
  //       nftMetadata: nft.address,
  //       mintAccount: demrMint,
  //       poolAssetAccount: poolAssetPDA,
  //       userAssetAccount: userAssetPDA,
  //     })
  //     .remainingAccounts([
  //       {
  //         pubkey: nftInfoPDA,
  //         isSigner: false,
  //         isWritable: false,
  //       },
  //     ])
  //     .transaction();
  //   // await program.provider.connection.confirmTransaction(tx, "confirmed");
  //   const txn = new web3.Transaction().add(
  //     web3.ComputeBudgetProgram.setComputeUnitLimit({
  //       units: 300_000,
  //     }),
  //     tx
  //   );
  //   try {
  //     const txsign = await program.provider.sendAndConfirm(txn);
  //     console.log(txsign);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  // it("stake2-1", async () => {
  //   let stakeId = new anchor.BN("0");
  //   try {
  //     const userInfo = await program.account.userInfoPhase2.fetch(userInfo2PDA);
  //     stakeId = userInfo.stakeId;
  //   } catch (error) {}
  //   console.log(stakeId);
  //   // get nfts
  //   const metaplex = new Metaplex(anchor.getProvider().connection);
  //   const myNfts = await metaplex.nfts().findAllByOwner({
  //     owner: program.provider.publicKey,
  //   });
  //   const nft = myNfts.find(
  //     (nft) => nft.symbol == "test" && nft.collection.verified
  //   ) as Metadata;
  //   // console.log(myNfts.length);
  //   // const nft = myNfts[5] as Metadata;
  //   const mintAddr = nft.mintAddress;
  //   console.log(mintAddr.toBase58());

  //   // const nftInfo = await program.account.nftInfo.fetch()
  //   const poolInfo = await program.account.poolInfo.fetch(PoolInfoPDA);
  //   console.log("demrMint", poolInfo.demrMint.toBase58());

  //   const [nftInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("nft-info", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const [nftInfo2PDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("nft-info2", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const [claimInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("claim-info", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const [stakeInfo2PDA] = web3.PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.Buffer.from("stake-info2", "utf8"),
  //       stakeId.toArrayLike(Buffer.Buffer, "be", 8),
  //     ],
  //     program.programId
  //   );

  //   const tokenAccountStake = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     program.provider.publicKey
  //   );

  //   const nftCustodyPDA = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     PoolInfoPDA,
  //     true
  //   );

  //   console.log("PoolInfoPDA", PoolInfoPDA.toBase58());

  //   const userAssetPDA = getAssociatedTokenAddressSync(
  //     demrMint,
  //     program.provider.publicKey,
  //     true
  //   );

  //   const tx = await program.methods
  //     .stake2()
  //     .accounts({
  //       signer: program.provider.publicKey,
  //       poolInfo: PoolInfoPDA,
  //       nftInfo: nftInfo2PDA,
  //       userInfo: userInfo2PDA,
  //       stakeInfo: stakeInfo2PDA,
  //       nftMint: mintAddr,
  //       nftToken: tokenAccountStake,
  //       nftCustody: nftCustodyPDA,
  //       nftMetadata: nft.address,
  //     })
  //     .transaction();
  //   // await program.provider.connection.confirmTransaction(tx, "confirmed");
  //   const txn = new web3.Transaction().add(
  //     web3.ComputeBudgetProgram.setComputeUnitLimit({
  //       units: 300_000,
  //     }),
  //     tx
  //   );
  //   try {
  //     const txsign = await program.provider.sendAndConfirm(txn);
  //     console.log(txsign);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  // it("stake2-2", async () => {
  //   let stakeId = new anchor.BN("0");
  //   try {
  //     const userInfo = await program.account.userInfoPhase2.fetch(userInfo2PDA);
  //     stakeId = userInfo.stakeId;
  //   } catch (error) {}
  //   console.log(stakeId);
  //   // get nfts
  //   const metaplex = new Metaplex(anchor.getProvider().connection);
  //   const myNfts = await metaplex.nfts().findAllByOwner({
  //     owner: program.provider.publicKey,
  //   });
  //   const nft = myNfts.find(
  //     (nft) =>
  //       nft.symbol == "test1" && nft.collection && nft.collection.verified
  //   ) as Metadata;
  //   const mintAddr = nft.mintAddress;
  //   console.log("mintAddr", mintAddr.toBase58());

  //   // const nftInfo = await program.account.nftInfo.fetch()
  //   const poolInfo = await program.account.poolInfo.fetch(PoolInfoPDA);
  //   console.log("poolInfo", poolInfo);
  //   console.log("demrMint", poolInfo.demrMint.toBase58());

  //   const [nftInfo2PDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("nft-info2", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const [stakeInfo2PDA] = web3.PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.Buffer.from("stake-info2", "utf8"),
  //       stakeId.toArrayLike(Buffer.Buffer, "be", 8),
  //     ],
  //     program.programId
  //   );

  //   const tokenAccountStake = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     program.provider.publicKey
  //   );

  //   const nftCustodyPDA = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     PoolInfoPDA,
  //     true
  //   );

  //   const poolDemrPDA = getAssociatedTokenAddressSync(
  //     demrMint,
  //     demrAuthorityPDA,
  //     true
  //   );

  //   const userDemrPDA = getAssociatedTokenAddressSync(
  //     demrMint,
  //     program.provider.publicKey,
  //     true
  //   );

  //   const tx = await program.methods
  //     .stake2()
  //     .accounts({
  //       signer: program.provider.publicKey,
  //       poolInfo: PoolInfoPDA,
  //       nftInfo: nftInfo2PDA,
  //       userInfo: userInfo2PDA,
  //       stakeInfo: stakeInfo2PDA,
  //       nftMint: mintAddr,
  //       nftToken: tokenAccountStake,
  //       nftCustody: nftCustodyPDA,
  //       nftMetadata: nft.address,
  //     })
  //     .remainingAccounts([
  //       {
  //         pubkey: demrAuthorityPDA,
  //         isSigner: false,
  //         isWritable: false,
  //       },
  //       {
  //         pubkey: userDemrPDA,
  //         isSigner: false,
  //         isWritable: true,
  //       },
  //       {
  //         pubkey: poolDemrPDA,
  //         isSigner: false,
  //         isWritable: true,
  //       },
  //     ])
  //     .transaction();
  //   // await program.provider.connection.confirmTransaction(tx, "confirmed");
  //   const txn = new web3.Transaction().add(
  //     web3.ComputeBudgetProgram.setComputeUnitLimit({
  //       units: 300_000,
  //     }),
  //     tx
  //   );
  //   try {
  //     const txsign = await program.provider.sendAndConfirm(txn);
  //     console.log(txsign);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  // it("unstake2-1", async () => {
  //   const userInfo = await program.account.userInfoPhase2.fetch(userInfo2PDA);
  //   const stakeId = userInfo.stakeId;

  //   let stakeInfo;
  //   for (let i = 1; i <= stakeId.toNumber(); i++) {
  //     const [stakeInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //       [
  //         Buffer.Buffer.from("stake-info2", "utf8"),
  //         userInfo.stakeId
  //           .sub(new anchor.BN(i))
  //           .toArrayLike(Buffer.Buffer, "be", 8),
  //       ],
  //       program.programId
  //     );

  //     const _stakeInfo = await program.account.stakeInfo.fetch(stakeInfoPDA);
  //     const mintAddr = new PublicKey(_stakeInfo.nftMint);
  //     const [nftInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //       [Buffer.Buffer.from("nft-info2", "utf8"), mintAddr.toBuffer()],
  //       program.programId
  //     );

  //     const _nftInfo = await program.account.nftInfoPhase2.fetch(nftInfoPDA);

  //     if (_stakeInfo.collection == 1 && _nftInfo.staking) {
  //       stakeInfo = _stakeInfo;
  //       break;
  //     }
  //     // console.log(stakeInfo);
  //   }
  //   const mintAddr = new PublicKey(stakeInfo.nftMint);
  //   console.log(mintAddr.toBase58());

  //   // const nftInfo = await program.account.nftInfo.fetch()
  //   const poolInfo = await program.account.poolInfo.fetch(PoolInfoPDA);
  //   console.log("demrMint", poolInfo.demrMint.toBase58());

  //   const [nftInfo2PDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("nft-info2", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const [claimInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("claim-info", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const [stakeInfo2PDA] = web3.PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.Buffer.from("stake-info2", "utf8"),
  //       stakeId.toArrayLike(Buffer.Buffer, "be", 8),
  //     ],
  //     program.programId
  //   );

  //   const tokenAccountStake = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     program.provider.publicKey
  //   );

  //   const nftCustodyPDA = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     PoolInfoPDA,
  //     true
  //   );

  //   console.log("PoolInfoPDA", PoolInfoPDA.toBase58());

  //   const userAssetPDA = getAssociatedTokenAddressSync(
  //     demrMint,
  //     program.provider.publicKey,
  //     true
  //   );

  //   const tx = await program.methods
  //     .unstake2()
  //     .accounts({
  //       staker: program.provider.publicKey,
  //       poolInfo: PoolInfoPDA,
  //       nftInfo: nftInfo2PDA,
  //       nftMint: mintAddr,
  //       nftReceiveAccount: tokenAccountStake,
  //       nftCustody: nftCustodyPDA,
  //     })
  //     .transaction();
  //   // await program.provider.connection.confirmTransaction(tx, "confirmed");
  //   const txn = new web3.Transaction().add(
  //     web3.ComputeBudgetProgram.setComputeUnitLimit({
  //       units: 300_000,
  //     }),
  //     tx
  //   );
  //   try {
  //     const txsign = await program.provider.sendAndConfirm(txn);
  //     console.log(txsign);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  // it("unstake2-2", async () => {
  //   const userInfo = await program.account.userInfoPhase2.fetch(userInfo2PDA);
  //   const stakeId = userInfo.stakeId;

  //   let stakeInfo;
  //   for (let i = 1; i <= stakeId.toNumber(); i++) {
  //     const [stakeInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //       [
  //         Buffer.Buffer.from("stake-info2", "utf8"),
  //         userInfo.stakeId
  //           .sub(new anchor.BN(i))
  //           .toArrayLike(Buffer.Buffer, "be", 8),
  //       ],
  //       program.programId
  //     );

  //     const _stakeInfo = await program.account.stakeInfo.fetch(stakeInfoPDA);
  //     const mintAddr = new PublicKey(_stakeInfo.nftMint);
  //     const [nftInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //       [Buffer.Buffer.from("nft-info2", "utf8"), mintAddr.toBuffer()],
  //       program.programId
  //     );

  //     const _nftInfo = await program.account.nftInfoPhase2.fetch(nftInfoPDA);

  //     if (_stakeInfo.collection == 2 && _nftInfo.staking) {
  //       stakeInfo = _stakeInfo;
  //       break;
  //     }
  //     // console.log(stakeInfo);
  //   }
  //   const mintAddr = new PublicKey(stakeInfo.nftMint);
  //   console.log(mintAddr.toBase58());

  //   // const nftInfo = await program.account.nftInfo.fetch()
  //   const poolInfo = await program.account.poolInfo.fetch(PoolInfoPDA);
  //   console.log("demrMint", poolInfo.demrMint.toBase58());

  //   const [nftInfo2PDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("nft-info2", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const [claimInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("claim-info", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   const [stakeInfo2PDA] = web3.PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.Buffer.from("stake-info2", "utf8"),
  //       stakeId.toArrayLike(Buffer.Buffer, "be", 8),
  //     ],
  //     program.programId
  //   );

  //   const tokenAccountStake = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     program.provider.publicKey
  //   );

  //   const nftCustodyPDA = getAssociatedTokenAddressSync(
  //     mintAddr,
  //     PoolInfoPDA,
  //     true
  //   );

  //   console.log("PoolInfoPDA", PoolInfoPDA.toBase58());
  //   const poolDemrPDA = getAssociatedTokenAddressSync(
  //     demrMint,
  //     demrAuthorityPDA,
  //     true
  //   );

  //   const userDemrPDA = getAssociatedTokenAddressSync(
  //     demrMint,
  //     program.provider.publicKey,
  //     true
  //   );

  //   console.log(demrAuthorityPDA, userDemrPDA, poolDemrPDA);

  //   const tx = await program.methods
  //     .unstake2()
  //     .accounts({
  //       staker: program.provider.publicKey,
  //       poolInfo: PoolInfoPDA,
  //       nftInfo: nftInfo2PDA,
  //       nftMint: mintAddr,
  //       nftReceiveAccount: tokenAccountStake,
  //       nftCustody: nftCustodyPDA,
  //     })
  //     .remainingAccounts([
  //       {
  //         pubkey: demrAuthorityPDA,
  //         isSigner: false,
  //         isWritable: false,
  //       },
  //       {
  //         pubkey: userDemrPDA,
  //         isSigner: false,
  //         isWritable: true,
  //       },
  //       {
  //         pubkey: poolDemrPDA,
  //         isSigner: false,
  //         isWritable: true,
  //       },
  //     ])
  //     .transaction();
  //   const txn = new web3.Transaction().add(
  //     web3.ComputeBudgetProgram.setComputeUnitLimit({
  //       units: 300_000,
  //     }),
  //     tx
  //   );
  //   try {
  //     const txsign = await program.provider.sendAndConfirm(txn);
  //     console.log(txsign);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  // it("claim energy", async () => {
  //   const userInfo = await program.account.userInfoPhase2.fetch(userInfo2PDA);
  //   console.log(userInfo);
  //   const stakeId = userInfo.stakeId;

  //   let stakeInfo;
  //   for (let i = 1; i <= stakeId.toNumber(); i++) {
  //     const [stakeInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //       [
  //         Buffer.Buffer.from("stake-info2", "utf8"),
  //         userInfo.stakeId
  //           .sub(new anchor.BN(i))
  //           .toArrayLike(Buffer.Buffer, "be", 8),
  //       ],
  //       program.programId
  //     );
  //     const _stakeInfo = await program.account.stakeInfo.fetch(stakeInfoPDA);
  //     const mintAddr = new PublicKey(_stakeInfo.nftMint);
  //     const [nftInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //       [Buffer.Buffer.from("nft-info2", "utf8"), mintAddr.toBuffer()],
  //       program.programId
  //     );

  //     const _nftInfo = await program.account.nftInfoPhase2.fetch(nftInfoPDA);

  //     if (_stakeInfo.collection == 2 && _nftInfo.staking) {
  //       stakeInfo = _stakeInfo;
  //       break;
  //     }
  //     // console.log(stakeInfo);
  //   }
  //   const mintAddr = new PublicKey(stakeInfo.nftMint);
  //   console.log(mintAddr.toBase58());

  //   // const nftInfo = await program.account.nftInfo.fetch()
  //   const poolInfo = await program.account.poolInfo.fetch(PoolInfoPDA);
  //   console.log("demrMint", poolInfo.demrMint.toBase58());

  //   const [nftInfo2PDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("nft-info2", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   console.log("PoolInfoPDA", PoolInfoPDA.toBase58());
  //   const poolDemrPDA = getAssociatedTokenAddressSync(
  //     demrMint,
  //     demrAuthorityPDA,
  //     true
  //   );

  //   const userDemrPDA = getAssociatedTokenAddressSync(
  //     demrMint,
  //     program.provider.publicKey,
  //     true
  //   );

  //   console.log(demrAuthorityPDA, userDemrPDA, poolDemrPDA);

  //   const tx = await program.methods
  //     .claimEnergy()
  //     .accounts({
  //       signer: program.provider.publicKey,
  //       poolInfo: PoolInfoPDA,
  //       userInfo: userInfo2PDA,
  //       nftMint: mintAddr,
  //     })
  // .remainingAccounts([
  //   {
  //     pubkey: nftInfo2PDA,
  //     isSigner: false,
  //     isWritable: true,
  //   },
  // ])
  //     .transaction();
  //   const txn = new web3.Transaction().add(
  //     web3.ComputeBudgetProgram.setComputeUnitLimit({
  //       units: 300_000,
  //     }),
  //     tx
  //   );
  //   try {
  //     const txsign = await program.provider.sendAndConfirm(txn);
  //     console.log(txsign);
  //   } catch (error) {
  //     console.log(error);
  //   }
  //   console.log(await program.account.userInfoPhase2.fetch(userInfo2PDA));
  // });

  // it("open box", async () => {
  //   const userInfo = await program.account.userInfoPhase2.fetch(userInfo2PDA);
  //   console.log(userInfo);
  //   const stakeId = userInfo.stakeId;

  //   let stakeInfo;
  //   for (let i = 1; i <= stakeId.toNumber(); i++) {
  //     const [stakeInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //       [
  //         Buffer.Buffer.from("stake-info2", "utf8"),
  //         userInfo.stakeId
  //           .sub(new anchor.BN(i))
  //           .toArrayLike(Buffer.Buffer, "be", 8),
  //       ],
  //       program.programId
  //     );

  //     const _stakeInfo = await program.account.stakeInfo.fetch(stakeInfoPDA);
  //     const mintAddr = new PublicKey(_stakeInfo.nftMint);
  //     const [nftInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //       [Buffer.Buffer.from("nft-info2", "utf8"), mintAddr.toBuffer()],
  //       program.programId
  //     );

  //     const _nftInfo = await program.account.nftInfoPhase2.fetch(nftInfoPDA);

  //     if (_stakeInfo.collection == 2 && _nftInfo.staking) {
  //       stakeInfo = _stakeInfo;
  //       break;
  //     }
  //     // console.log(stakeInfo);
  //   }
  //   const mintAddr = new PublicKey(stakeInfo.nftMint);
  //   console.log(mintAddr.toBase58());

  //   // const nftInfo = await program.account.nftInfo.fetch()
  //   const poolInfo = await program.account.poolInfo.fetch(PoolInfoPDA);
  //   console.log("poolInfo", poolInfo);

  //   const [nftInfo2PDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("nft-info2", "utf8"), mintAddr.toBuffer()],
  //     program.programId
  //   );

  //   console.log("PoolInfoPDA", PoolInfoPDA.toBase58());
  //   const poolRewardDemrPDA = getAssociatedTokenAddressSync(
  //     demrMint,
  //     PoolInfoPDA,
  //     true
  //   );

  //   const userDemrPDA = getAssociatedTokenAddressSync(
  //     demrMint,
  //     program.provider.publicKey,
  //     true
  //   );

  //   console.log(demrAuthorityPDA, userDemrPDA, poolRewardDemrPDA);

  //   const tx = await program.methods
  //     .openBox({
  //       num: new anchor.BN("2"),
  //     })
  //     .accounts({
  //       signer: program.provider.publicKey,
  //       poolInfo: PoolInfoPDA,
  //       mintAccount: demrMint,
  //       userInfo: userInfo2PDA,
  //       poolAssetAccount: poolRewardDemrPDA,
  //       userAssetAccount: userDemrPDA,
  //     })

  //     .transaction();
  //   const txn = new web3.Transaction().add(
  //     web3.ComputeBudgetProgram.setComputeUnitLimit({
  //       units: 300_000,
  //     }),
  //     tx
  //   );
  //   try {
  //     const txsign = await program.provider.sendAndConfirm(txn);
  //     console.log(txsign);
  //   } catch (error) {
  //     console.log(error);
  //   }
  //   console.log(await program.account.userInfoPhase2.fetch(userInfo2PDA));
  // });
});
