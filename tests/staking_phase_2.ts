import * as anchor from "@coral-xyz/anchor";
import { Program, web3, Wallet, AnchorProvider, BN } from "@coral-xyz/anchor";
import { StakingPhase2 } from "../target/types/staking_phase_2";
import { Demr } from "../target/types/demr";
import { MockNft } from "../target/types/mock_nft";
import {
  getAssociatedTokenAddressSync,
  createInitializeMintInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  createTransferInstruction,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import * as Buffer from "buffer";
import { PublicKey, Metaplex, Nft, Metadata } from "@metaplex-foundation/js";
import {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  AccountMeta,
  Keypair,
} from "@solana/web3.js";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("staking", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const stakingPhase2 = anchor.workspace
    .StakingPhase2 as Program<StakingPhase2>;
  const nft = anchor.workspace.MockNft as Program<MockNft>;

  const demr = anchor.workspace.Demr as Program<Demr>;

  const signer = provider.publicKey!;
  const signer1 = Keypair.generate();

  // const demrMint = new PublicKey(
  //   "FL8pJqtdYE57qPqsWsRmpw8ydh6QBMaM3vFzyskG2DCF"
  // );

  //create token
  const demrMintKey = Keypair.generate();
  const demrMint = demrMintKey.publicKey;

  // const collection2Addr = new PublicKey(
  //   "69Y7QVv6hMx7T7GHiQaHUmxFARhDeymt26yscDaLE5Uh"
  // );

  const collection2Addr = PublicKey.default;

  // metaplex token metadata program ID
  const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const [CollectionMint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("collection")],
    nft.programId
  );
  const collection1Addr = CollectionMint;

  const [PoolInfoPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("config", "utf8")],
    stakingPhase2.programId
  );

  const poolAssetPDA = getAssociatedTokenAddressSync(
    demrMint,
    PoolInfoPDA,
    true
  );

  const [ClaimConfigPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("claim-config", "utf8")],
    stakingPhase2.programId
  );

  const [nftAuthorityPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("nft-authority", "utf8")],
    stakingPhase2.programId
  );

  const [demrAuthorityPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("demr-stake-authority", "utf8")],
    stakingPhase2.programId
  );

  const [userInfoPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("user-info", "utf8"), signer.toBuffer()],
    stakingPhase2.programId
  );

  const [userInfo2PDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("user-info", "utf8"), provider.publicKey.toBuffer()],
    stakingPhase2.programId
  );

  const [demrMintPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("mint", "utf8")],
    demr.programId
  );

  const [demrConfPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("config", "utf8")],
    demr.programId
  );

  function getAssTokenAddr(
    mint: web3.PublicKey,
    owner: web3.PublicKey
  ): web3.PublicKey {
    return getAssociatedTokenAddressSync(mint, owner, true);
  }

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

  it("airdrop!", async () => {
    await provider.connection.requestAirdrop(
      signer1.publicKey,
      anchor.web3.LAMPORTS_PER_SOL * 1
    );
  });

  it("demr is initialized!", async () => {
    const receivers = [
      new web3.PublicKey("9jJiGcPz5MjFNwiTWzTLhEv3miMSoda2Par5hRb7XJZh"),
      new web3.PublicKey("96Tn6FpoQp4tX47dtbvzKfzLhEqBDSjpkE7LHpetvCf1"),
      new web3.PublicKey("Cwhmcksz9zUg4ZznBWz9qZYNUHs4JjF7bZk37YDUJH9D"),
      new web3.PublicKey("7EJLQQY9CZnceMG9wnEMA3o25sPDjNpfqnfUPkuwTaPy"),
      new web3.PublicKey("6WFPSBF44zbZxcFfuoSdgJJkkWH8iWofZJFvNmxeo3Tt"),
      new web3.PublicKey("9XUgPvWYyKaKz8GANHCVSsVG1ZWxhyb4Vd1XSHWZMiLj"),
      new web3.PublicKey("6T11Yq92fCbWr1mFcPa7UPS4Uq3CjnfmtVhk2hGpBSTA"),
      new web3.PublicKey("7kDqTzCSQ6Sp3E2co3Td8BpjAeGDQZpU3RBzBkx6ZMsC"),
    ];
    const amounts = [
      new anchor.BN("3000000000000000"),
      new anchor.BN("5000000000000000"),
      new anchor.BN("12000000000000000"),
      new anchor.BN("10000000000000000"),
      new anchor.BN("2000000000000000"),
      new anchor.BN("8000000000000000"),
      new anchor.BN("20000000000000000"),
      new anchor.BN("40000000000000000"),
    ];

    const [MintMetadataPDA] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.Buffer.from("metadata", "utf8"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        demrMintPDA.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    try {
      await demr.methods
        .initialize()
        .accounts({
          payer: provider.publicKey,
          mint: demrMintPDA,
          config: demrConfPDA,
          metadataAccount: MintMetadataPDA,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .rpc();

      for (let i = 0; i < receivers.length; i++) {
        const receiver = receivers[i];
        await provider.sendAndConfirm(
          new web3.Transaction().add(
            createAssociatedTokenAccountInstruction(
              provider.publicKey,
              getAssociatedTokenAddressSync(demrMintPDA, receiver, true), //Associated token account
              receiver, //token owner
              demrMintPDA //Mint
            )
          )
        );
      }

      await demr.methods
        .initMint(amounts)
        .accounts({
          payer: provider.publicKey,
          mint: demrMintPDA,
          config: demrConfPDA,
          receiver1Account: getAssociatedTokenAddressSync(
            demrMintPDA,
            receivers[0],
            true
          ),
          receiver2Account: getAssociatedTokenAddressSync(
            demrMintPDA,
            receivers[1],
            true
          ),
          receiver3Account: getAssociatedTokenAddressSync(
            demrMintPDA,
            receivers[2],
            true
          ),
          receiver4Account: getAssociatedTokenAddressSync(
            demrMintPDA,
            receivers[3],
            true
          ),
          receiver5Account: getAssociatedTokenAddressSync(
            demrMintPDA,
            receivers[4],
            true
          ),
          receiver6Account: getAssociatedTokenAddressSync(
            demrMintPDA,
            receivers[5],
            true
          ),
          receiver7Account: getAssociatedTokenAddressSync(
            demrMintPDA,
            receivers[6],
            true
          ),
          receiver8Account: getAssociatedTokenAddressSync(
            demrMintPDA,
            receivers[7],
            true
          ),
        })
        .rpc();
    } catch (error) {
      console.log(error);
      throw error;
    }
  });

  it("nft is initialized!", async () => {
    const TokenAccount = getAssociatedTokenAddressSync(CollectionMint, signer);

    await nft.methods
      .initialize()
      .accounts({
        signer: provider.publicKey,
        collectionMint: CollectionMint,
        tokenAccount: TokenAccount,
        masterEdition: CollectionMintMasterPDA,
        metadataAccount: CollectionMintMetadataPDA,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
  });

  it("mock token init mint ", async () => {
    const requiredBalance = await getMinimumBalanceForRentExemptMint(
      provider.connection
    );

    const createNewTokenTransaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: provider.publicKey,
        newAccountPubkey: demrMint,
        space: MINT_SIZE,
        lamports: requiredBalance,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        demrMint, //Mint Address
        9, //Number of Decimals of New mint
        provider.publicKey, //Mint Authority
        provider.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        provider.publicKey,
        getAssTokenAddr(demrMint, signer), //Associated token account
        provider.publicKey, //token owner
        demrMint //Mint
      ),
      // createMintToInstruction(
      //   demrMint, //Mint
      //   getAssTokenAddr(demrMint, signer), //Destination Token Account
      //   provider.publicKey, //Authority
      //   BigInt("10000000000000000000") //number of
      // ),
      createAssociatedTokenAccountInstruction(
        provider.publicKey,
        getAssTokenAddr(demrMint, PoolInfoPDA), //Associated token account
        PoolInfoPDA, //token owner
        demrMint //Mint
      ),
      createMintToInstruction(
        demrMint, //Mint
        getAssTokenAddr(demrMint, PoolInfoPDA), //Destination Token Account
        signer, //Authority
        BigInt("10000000000000000000") //number of
      )
    );
    let result = await provider.sendAndConfirm(createNewTokenTransaction, [
      demrMintKey,
    ]);
    // assert.exists(result);
    // const userAcc = await getAccount(
    //   provider.connection,
    //   getAssTokenAddr(demrMint, signer)
    // );
    // assert.equal(userAcc.amount, BigInt("10000000000000000000"));
  });

  it("stakeing phase1 Is initialized!", async () => {
    const cur = Math.floor(Date.now() / 1000) - 10;
    try {
      const tx = await stakingPhase2.methods
        .initStaking({
          admin: signer,
          collection: [collection1Addr, collection1Addr],
          demrMint: demrMint,
          energyPerBox: new anchor.BN("86400"),
          energyPerPeriod: [new anchor.BN("100000"), new anchor.BN("100000")],
          stakeStart: [new anchor.BN(cur), new anchor.BN(cur)],
          demrStakeAmount: new anchor.BN("1000000000"),
          demrPerBox: [
            new anchor.BN("1000000000"),
            new anchor.BN("2000000000"),
            new anchor.BN("3000000000"),
            new anchor.BN("4000000000"),
            new anchor.BN("5000000000"),
            new anchor.BN("6000000000"),
            new anchor.BN("8000000000"),
            new anchor.BN("10000000000"),
          ],
          openBoxRate: [
            new anchor.BN("10000"),
            new anchor.BN("24000"),
            new anchor.BN("44000"),
            new anchor.BN("74000"),
            new anchor.BN("84000"),
            new anchor.BN("94000"),
            new anchor.BN("99000"),
            new anchor.BN("100000"),
          ],
          perPeriod: new anchor.BN("86400"),
        })
        .accounts({
          poolInfo: PoolInfoPDA,
          demrAuthority: demrAuthorityPDA,
          admin: signer,
        })
        .rpc();
      console.log("Your transaction signature", tx);
    } catch (error) {
      console.log(error);
    }
  });

  const mintNft = async () => {
    const mintKey = anchor.web3.Keypair.generate();

    const [TokenMintMetadataPDA] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.Buffer.from("metadata", "utf8"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKey.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const [TokenMintMasterPDA] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.Buffer.from("metadata", "utf8"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKey.publicKey.toBuffer(),
        Buffer.Buffer.from("edition", "utf8"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const NftTokenAccount = getAssociatedTokenAddressSync(
      mintKey.publicKey,
      provider.publicKey
    );

    try {
      let tx = await nft.methods
        .mint()
        .accounts({
          signer: signer,
          collectionMint: CollectionMint,
          collectionMasterEdition: CollectionMintMasterPDA,
          collectionMetadataAccount: CollectionMintMetadataPDA,
          tokenMint: mintKey.publicKey,
          tokenAccount: NftTokenAccount,
          metadataAccount: TokenMintMetadataPDA,
          masterEdition: TokenMintMasterPDA,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([mintKey])
        .transaction();

      const txn = new anchor.web3.Transaction().add(
        anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
          units: 300_000,
        }),
        tx
      );

      let txsign = await provider.sendAndConfirm(txn, [mintKey]);
      await nft.provider.connection.confirmTransaction(txsign, "confirmed");
      console.log("Your transaction signature", txsign);
    } catch (error) {
      console.log(error);
    }

    return { meta: TokenMintMetadataPDA, mint: mintKey.publicKey };
  };

  it("update config!", async () => {
    try {
      const cur = Math.floor(Date.now() / 1000);
      const tx = await stakingPhase2.methods
        .updatePoolInfo({
          stakeEnd: [new anchor.BN(cur), new anchor.BN(cur)],
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

    const poolInfo = await stakingPhase2.account.poolInfo.fetch(PoolInfoPDA);
    console.log("poolInfo", poolInfo);
    console.log("demrMint", poolInfo.demrMint.toBase58());
  });

  const stake = async (isCollection: boolean) => {
    let stakeId = new anchor.BN("0");
    try {
      const userInfo = await stakingPhase2.account.userInfo.fetch(userInfo2PDA);
      stakeId = userInfo.stakeId;
    } catch (error) {}
    console.log(stakeId);
    // get nfts
    const metaplex = new Metaplex(anchor.getProvider().connection);
    const myNfts = await metaplex.nfts().findAllByOwner({
      owner: stakingPhase2.provider.publicKey!,
    });
    const nft = myNfts.find(
      (nft) =>
        nft.symbol == "test1" && nft.collection && nft.collection.verified
    ) as Metadata;
    const mintAddr = nft.mintAddress;
    console.log("mintAddr", mintAddr.toBase58());

    // const nftInfo = await stakingPhase2.account.nftInfo.fetch()
    const poolInfo = await stakingPhase2.account.poolInfo.fetch(PoolInfoPDA);
    console.log("poolInfo", poolInfo);
    console.log("demrMint", poolInfo.demrMint.toBase58());

    const [nftInfo2PDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.Buffer.from("nft-info", "utf8"), mintAddr.toBuffer()],
      stakingPhase2.programId
    );

    const [stakeInfo2PDA] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.Buffer.from("stake-info", "utf8"),
        stakingPhase2.provider.publicKey!.toBuffer(),
        stakeId.toArrayLike(Buffer.Buffer, "be", 8),
      ],
      stakingPhase2.programId
    );

    const tokenAccountStake = getAssociatedTokenAddressSync(
      mintAddr,
      stakingPhase2.provider.publicKey!
    );

    const nftCustodyPDA = getAssociatedTokenAddressSync(
      mintAddr,
      PoolInfoPDA,
      true
    );

    const poolDemrPDA = getAssociatedTokenAddressSync(
      demrMint,
      demrAuthorityPDA,
      true
    );

    const userDemrPDA = getAssociatedTokenAddressSync(
      demrMint,
      stakingPhase2.provider.publicKey!,
      true
    );

    const remain = [] as any;
    if (isCollection) {
      remain.push(
        {
          pubkey: demrAuthorityPDA,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: userDemrPDA,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: poolDemrPDA,
          isSigner: false,
          isWritable: true,
        }
      );
    }

    const tx = await stakingPhase2.methods
      .stake()
      .accounts({
        signer: stakingPhase2.provider.publicKey,
        poolInfo: PoolInfoPDA,
        nftInfo: nftInfo2PDA,
        userInfo: userInfo2PDA,
        stakeInfo: stakeInfo2PDA,
        nftMint: mintAddr,
        nftToken: tokenAccountStake,
        nftCustody: nftCustodyPDA,
        nftMetadata: nft.address,
      })
      .remainingAccounts(remain)
      .transaction();
    // await stakingPhase2.provider.connection.confirmTransaction(tx, "confirmed");
    const txn = new web3.Transaction().add(
      web3.ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000,
      }),
      tx
    );
    try {
      const txsign = await stakingPhase2.provider.sendAndConfirm!(txn);
      console.log(txsign);
    } catch (error) {
      console.log(error);
    }
  };

  const unstake = async (isCollection: boolean) => {
    const userInfo = await stakingPhase2.account.userInfo.fetch(userInfo2PDA);
    const stakeId = userInfo.stakeId;

    const [stakeInfoPDA] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.Buffer.from("stake-info", "utf8"),
        stakingPhase2.provider.publicKey!.toBuffer(),
        userInfo.stakeId
          .sub(new anchor.BN(1))
          .toArrayLike(Buffer.Buffer, "be", 8),
      ],
      stakingPhase2.programId
    );
    const stakeInfo = await stakingPhase2.account.stakeInfo.fetch(stakeInfoPDA);
    const mintAddr = new PublicKey(stakeInfo.nftMint);
    console.log(mintAddr.toBase58());

    // const nftInfo = await stakingPhase2.account.nftInfo.fetch()
    const poolInfo = await stakingPhase2.account.poolInfo.fetch(PoolInfoPDA);
    console.log("demrMint", poolInfo.demrMint.toBase58());

    const [nftInfo2PDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.Buffer.from("nft-info", "utf8"), mintAddr.toBuffer()],
      stakingPhase2.programId
    );

    const [claimInfoPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.Buffer.from("claim-info", "utf8"), mintAddr.toBuffer()],
      stakingPhase2.programId
    );

    const tokenAccountStake = getAssociatedTokenAddressSync(
      mintAddr,
      stakingPhase2.provider.publicKey!
    );

    const nftCustodyPDA = getAssociatedTokenAddressSync(
      mintAddr,
      PoolInfoPDA,
      true
    );

    console.log("PoolInfoPDA", PoolInfoPDA.toBase58());
    const poolDemrPDA = getAssociatedTokenAddressSync(
      demrMint,
      demrAuthorityPDA,
      true
    );

    const userDemrPDA = getAssociatedTokenAddressSync(
      demrMint,
      stakingPhase2.provider.publicKey!,
      true
    );

    console.log(demrAuthorityPDA, userDemrPDA, poolDemrPDA);

    const remain = [] as any;
    if (isCollection) {
      remain.push(
        {
          pubkey: demrAuthorityPDA,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: userDemrPDA,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: poolDemrPDA,
          isSigner: false,
          isWritable: true,
        }
      );
    }

    const tx = await stakingPhase2.methods
      .unstake()
      .accounts({
        staker: stakingPhase2.provider.publicKey,
        poolInfo: PoolInfoPDA,
        userInfo: userInfo2PDA,
        nftInfo: nftInfo2PDA,
        nftMint: mintAddr,
        nftReceiveAccount: tokenAccountStake,
        nftCustody: nftCustodyPDA,
      })
      .remainingAccounts(remain)
      .transaction();
    const txn = new web3.Transaction().add(
      web3.ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000,
      }),
      tx
    );
    try {
      const txsign = await stakingPhase2.provider.sendAndConfirm!(txn);
      console.log(txsign);
    } catch (error) {
      console.log(error);
    }
  };

  const transferNft = async () => {
    const metaplex = new Metaplex(anchor.getProvider().connection);
    const myNfts = await metaplex.nfts().findAllByOwner({
      owner: provider.publicKey,
    });
    console.log(myNfts.length);
    const nft = myNfts[0] as Metadata;
    const mintAddr = nft.mintAddress;
    console.log(mintAddr.toBase58());

    const createNewTokenTransaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        provider.publicKey,
        getAssTokenAddr(mintAddr, signer1.publicKey), //Associated token account
        signer1.publicKey, //token owner
        mintAddr //Mint
      ),
      createTransferInstruction(
        getAssTokenAddr(mintAddr, signer),
        getAssTokenAddr(mintAddr, signer1.publicKey),
        signer,
        1
      )
    );
    let result = await provider.sendAndConfirm(createNewTokenTransaction, []);
  };

  const swap_box = async (boxNum: number) => {
    const userInfo = await stakingPhase2.account.userInfo.fetch(userInfo2PDA);
    console.log(userInfo);

    const tx = await stakingPhase2.methods
      .swapBox(new anchor.BN(boxNum))
      .accounts({
        signer: stakingPhase2.provider.publicKey,
        poolInfo: PoolInfoPDA,
        userInfo: userInfo2PDA,
      })
      .transaction();
    const txn = new web3.Transaction().add(
      web3.ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000,
      }),
      tx
    );
    try {
      const txsign = await stakingPhase2.provider.sendAndConfirm!(txn);
      console.log(txsign);
    } catch (error) {
      console.log(error);
    }
    console.log(await stakingPhase2.account.userInfo.fetch(userInfo2PDA));
  };

  const openBox = async () => {
    // const nftInfo = await stakingPhase2.account.nftInfo.fetch()
    const poolInfo = await stakingPhase2.account.poolInfo.fetch(PoolInfoPDA);
    console.log("poolInfo", poolInfo);

    const poolRewardDemrPDA = getAssociatedTokenAddressSync(
      demrMint,
      PoolInfoPDA,
      true
    );

    const userDemrPDA = getAssociatedTokenAddressSync(
      demrMint,
      stakingPhase2.provider.publicKey!,
      true
    );

    const userInfo = await stakingPhase2.account.userInfo.fetch(userInfo2PDA);
    const [claimInfoPDA] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.Buffer.from("claim-info", "utf8"),
        signer.toBuffer(),
        userInfo.claimCount.toArrayLike(Buffer.Buffer, "be", 8),
      ],
      stakingPhase2.programId
    );

    const tx = await stakingPhase2.methods
      .openBox({
        num: new anchor.BN("2"),
      })
      .accounts({
        signer: stakingPhase2.provider.publicKey,
        poolInfo: PoolInfoPDA,
        claimInfo: claimInfoPDA,
        userInfo: userInfo2PDA,
      })

      .transaction();
    const txn = new web3.Transaction().add(
      web3.ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000,
      }),
      tx
    );
    try {
      const txsign = await stakingPhase2.provider.sendAndConfirm!(txn);
      console.log(txsign);
    } catch (error) {
      console.log(error);
    }
    console.log(await stakingPhase2.account.userInfo.fetch(userInfo2PDA));
  };

  const claim = async (claimIndex) => {
    const claimCount = new anchor.BN(claimIndex);
    // const nftInfo = await stakingPhase2.account.nftInfo.fetch()
    const poolInfo = await stakingPhase2.account.poolInfo.fetch(PoolInfoPDA);
    console.log("poolInfo", poolInfo);

    const poolRewardDemrPDA = getAssociatedTokenAddressSync(
      demrMint,
      PoolInfoPDA,
      true
    );

    const userDemrPDA = getAssociatedTokenAddressSync(
      demrMint,
      stakingPhase2.provider.publicKey!,
      true
    );

    const [claimInfoPDA] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.Buffer.from("claim-info", "utf8"),
        signer.toBuffer(),
        claimCount.toArrayLike(Buffer.Buffer, "be", 8),
      ],
      stakingPhase2.programId
    );

    const tx = await stakingPhase2.methods
      .claim(claimCount)
      .accounts({
        signer: stakingPhase2.provider.publicKey,
        poolInfo: PoolInfoPDA,
        mintAccount: demrMint,
        claimInfo: claimInfoPDA,
        poolAssetAccount: poolRewardDemrPDA,
        userAssetAccount: userDemrPDA,
      })

      .transaction();
    const txn = new web3.Transaction().add(
      web3.ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000,
      }),
      tx
    );
    try {
      const txsign = await stakingPhase2.provider.sendAndConfirm!(txn);
      console.log(txsign);
    } catch (error) {
      console.log(error);
    }
    console.log(await stakingPhase2.account.userInfo.fetch(userInfo2PDA));
  };

  // it("stake unstake ", async () => {
  //   await mintNft();
  //   // await mintNft();
  //   // await mintNft();
  //   await stake(false);
  //   await unstake(false);
  //   console.log("stakestakestake");
  //   await stake(true);
  //   await unstake(true);
  // });

  // it("stake unstake ", async () => {
  //   await mintNft();
  //   // await mintNft();
  //   // await mintNft();
  //   await stake(false);
  //   await unstake(false);
  //   console.log("stakestakestake");
  //   await stake(true);
  //   await unstake(true);
  // });

  // it(" transfer stake  ", async () => {
  //   const result = await mintNft();
  //   const [nftInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("nft-info", "utf8"), result.mint.toBuffer()],
  //     stakingPhase2.programId
  //   );
  //   await stake();
  //   await unstake();
  //   console.log("transfertransfer");

  //   const [userInfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("user-info", "utf8"), signer.toBuffer()],
  //     stakingPhase2.programId
  //   );
  //   const [user1InfoPDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.Buffer.from("user-info", "utf8"), signer1.publicKey.toBuffer()],
  //     stakingPhase2.programId
  //   );
  //   console.log(
  //     "sender info",
  //     await stakingPhase2.account.userInfo.fetch(userInfoPDA)
  //   );

  //   console.log(
  //     "nft info",
  //     await stakingPhase2.account.nftInfo.fetch(nftInfoPDA)
  //   );

  //   await transferNft();
  //   await stake(signer1.publicKey);
  //   await unstake(signer1.publicKey);

  //   await mintNft();
  //   await stake();
  //   await unstake();
  //   console.log(
  //     "sender1 info",
  //     await stakingPhase2.account.userInfo.fetch(userInfoPDA)
  //   );
  //   console.log(
  //     "sender11 info",
  //     await stakingPhase2.account.userInfo.fetch(user1InfoPDA)
  //   );
  //   const poolInfo = await stakingPhase2.account.poolInfo.fetch(PoolInfoPDA);
  //   console.log("poolInfo", poolInfo);

  //   console.log(
  //     "nft1 info",
  //     await stakingPhase2.account.nftInfo.fetch(nftInfoPDA)
  //   );
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
});
