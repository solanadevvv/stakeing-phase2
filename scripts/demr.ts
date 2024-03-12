import * as anchor from "@coral-xyz/anchor";
import { Program, web3, Wallet, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Demr, IDL } from "../target/types/demr";
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
    "FMcmweJZFaKd7AKkxVf2tYNakCueebbkcGVmzpHPXsba",
    anchor.getProvider()
  );
  // metaplex token metadata program ID
  const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

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
    try {
      await program.methods
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

      await program.methods
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
    }
  });
});
