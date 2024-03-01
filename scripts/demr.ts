import * as anchor from "@coral-xyz/anchor";
import { Program, web3, Wallet, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Demr, IDL } from "../target/types/demr";
import {
  getAssociatedTokenAddressSync,
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
    "CQE4PQ3V4jLkPw2FXDyGCuMRLyBB4zXonMCz69bT8XyU",
    anchor.getProvider()
  );
  // metaplex token metadata program ID
  const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const [demrConfPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("config", "utf8")],
    program.programId
  );

  const [demrMintPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.Buffer.from("mint")],
    program.programId
  );

  console.log("demrMintPDA", demrMintPDA.toBase58());

  it("demr is initialized!", async () => {
    const [MintMetadataPDA] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.Buffer.from("metadata", "utf8"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        demrMintPDA.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    await program.methods
      .initialize(signer)
      .accounts({
        payer: provider.publicKey,
        mint: demrMintPDA,
        config: demrConfPDA,
        metadataAccount: MintMetadataPDA,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .rpc();
  });

  const mint = async (receiver: string, num: anchor.BN) => {
    const receiverAccount = getAssociatedTokenAddressSync(
      demrMintPDA,
      new PublicKey(receiver),
      true
    );
    await program.methods
      .mintToken(num)
      .accounts({
        signer: provider.publicKey,
        mint: demrMintPDA,
        config: demrConfPDA,
        receiver: receiver,
        receiverAccount: receiverAccount,
      })
      .rpc();
  };

  it("demr minted!", async () => {
    await mint(
      "9jJiGcPz5MjFNwiTWzTLhEv3miMSoda2Par5hRb7XJZh",
      new anchor.BN("3000000000000000")
    );
    await mint(
      "96Tn6FpoQp4tX47dtbvzKfzLhEqBDSjpkE7LHpetvCf1",
      new anchor.BN("5000000000000000")
    );
    await mint(
      "Cwhmcksz9zUg4ZznBWz9qZYNUHs4JjF7bZk37YDUJH9D",
      new anchor.BN("12000000000000000")
    );
    await mint(
      "7EJLQQY9CZnceMG9wnEMA3o25sPDjNpfqnfUPkuwTaPy",
      new anchor.BN("10000000000000000")
    );
    await mint(
      "6WFPSBF44zbZxcFfuoSdgJJkkWH8iWofZJFvNmxeo3Tt",
      new anchor.BN("2000000000000000")
    );
    await mint(
      "9XUgPvWYyKaKz8GANHCVSsVG1ZWxhyb4Vd1XSHWZMiLj",
      new anchor.BN("8000000000000000")
    );
    await mint(
      "6T11Yq92fCbWr1mFcPa7UPS4Uq3CjnfmtVhk2hGpBSTA",
      new anchor.BN("20000000000000000")
    );
    await mint(
      "7kDqTzCSQ6Sp3E2co3Td8BpjAeGDQZpU3RBzBkx6ZMsC",
      new anchor.BN("40000000000000000")
    );
  });
});
