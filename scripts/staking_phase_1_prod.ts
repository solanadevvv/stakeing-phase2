import * as anchor from "@coral-xyz/anchor";
import { Program, web3, Wallet, AnchorProvider, BN } from "@coral-xyz/anchor";
import { StakingPhase1, IDL } from "../target/types/staking_phase_1";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as Buffer from "buffer";
import { PublicKey, Metaplex, Nft, Metadata } from "@metaplex-foundation/js";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import bs58 from "bs58";


describe("staking", () => {
  // Configure the client to use the local cluster.

  anchor.setProvider(anchor.AnchorProvider.env());

  const program = new Program(
    IDL,
    "D7f2m4qFfAP1osnsJrU5r2xbXuqfF1Doi38A8GbgAovd",
    anchor.getProvider()
  );

  const collection1Addr = new PublicKey(
    "4iVeAqbFrkTFvZd86SJ6ea1SYur8K2ccZX4MNDEn8iE1"
  );

  const collection2Addr = PublicKey.default;

  const [PoolInfoPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("config", "utf8")],
    program.programId
  );

  const [demrAuthorityPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("demr-stake-authority", "utf8")],
    program.programId
  );

  it("Is initialized!", async () => {
    try {
      const tx = await program.methods
        .initStaking({
          collection: [collection1Addr, collection2Addr],
          //Mon Feb 26 2024 23:59:59 GMT+0000
          startTime: [new anchor.BN(1708991999), new anchor.BN(1708991999)],
          //Wed Feb 26 2025 23:59:59 GMT+0000
          endTime: [new anchor.BN(1740614399), new anchor.BN(1740614399)],
        })
        .accounts({
          poolInfo: PoolInfoPDA,
          demrAuthority: demrAuthorityPDA,
          admin: program.provider.publicKey,
        })
        .rpc();
      console.log("Your transaction signature", tx);
    } catch (error) {
      console.log(error);
    }
  });



  // it("update config!", async () => {
  //   try {
  //     const cur = Math.floor(Date.now() / 1000);
  //     const tx = await program.methods
  //       .updatePoolInfo({
  //         admin: null,
  //         collection: [collection1Addr, collection2Addr],
  //         demrMint: demrMint,
  //         // startTime: [new anchor.BN(cur + 600), new anchor.BN(cur + 600)],
  //         // endTime: [new anchor.BN(cur + 800), new anchor.BN(cur + 800)],
  //         startTime: [new anchor.BN(1707309600), new anchor.BN(1707309600)],
  //         endTime: [new anchor.BN(1707396600), new anchor.BN(1707396600)],
  //         fullReward: [
  //           new anchor.BN("2000000000"),
  //           new anchor.BN("2000000000"),
  //         ],
  //         partReward: [
  //           new anchor.BN("1000000000"),
  //           new anchor.BN("1000000000"),
  //         ],
  //         noStakeReward: [
  //           new anchor.BN("1000000000"),
  //           new anchor.BN("1000000000"),
  //         ],
  //       })
  //       .accounts({
  //         poolInfo: PoolInfoPDA,
  //         signer: program.provider.publicKey,
  //       })
  //       .rpc();
  //     console.log("Your transaction signature", tx);
  //   } catch (error) {
  //     console.log(error);
  //   }

  //   const poolInfo = await program.account.poolInfo.fetch(PoolInfoPDA);
  //   console.log("poolInfo", poolInfo);
  //   console.log("demrMint", poolInfo.demrMint.toBase58());
  // });
});
