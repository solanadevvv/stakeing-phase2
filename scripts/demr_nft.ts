// import * as anchor from "@coral-xyz/anchor";
// import { Program, web3, Wallet, AnchorProvider, BN } from "@coral-xyz/anchor";
// import { DemrNft, IDL } from "../target/types/demr_nft";
// import { getAssociatedTokenAddressSync } from "@solana/spl-token";
// import * as Buffer from "buffer";
// import { MerkleTree } from "merkletreejs";
// import keccak256 from "keccak256";
// import { PublicKey } from "@metaplex-foundation/js";

// describe("demr_nft", () => {
//   // Configure the client to use the local cluster.

//   anchor.setProvider(anchor.AnchorProvider.env());

//   const program = anchor.workspace.DemrNft as Program<DemrNft>;

//   console.log(program.programId.toBase58());

//   let root = Buffer.Buffer.from("0xfbe4cfa10bbaa2dd4a582b591fe4798366d86a410d21bbc92ef8b71227cf0620".replace("0x", ""), 'hex');

//   // metaplex token metadata program ID
//   const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
//     "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
//   );

//   // metaplex setup
//   const connection = anchor.getProvider().connection;

//   const [AdminStateAccountPDA] = anchor.web3.PublicKey.findProgramAddressSync(
//     [Buffer.Buffer.from("admin")],
//     program.programId
//   );

//   const [CollectionMint] = anchor.web3.PublicKey.findProgramAddressSync(
//     [Buffer.Buffer.from("collection")],
//     program.programId
//   );

//   const [CollectionMintMetadataPDA] = web3.PublicKey.findProgramAddressSync(
//     [Buffer.Buffer.from('metadata', 'utf8'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), CollectionMint.toBuffer()],
//     TOKEN_METADATA_PROGRAM_ID
//   )

//   const [CollectionMintMasterPDA] = web3.PublicKey.findProgramAddressSync(
//     [
//       Buffer.Buffer.from('metadata', 'utf8'),
//       TOKEN_METADATA_PROGRAM_ID.toBuffer(),
//       CollectionMint.toBuffer(),
//       Buffer.Buffer.from('edition', 'utf8')
//     ],
//     TOKEN_METADATA_PROGRAM_ID
//   )

//   it("Is initialized!", async () => {
//     // await connection.requestAirdrop(
//     //   program.provider.publicKey,
//     //   web3.LAMPORTS_PER_SOL * 20000000
//     // );


//     const TokenAccount = getAssociatedTokenAddressSync(
//       CollectionMint,
//       program.provider.publicKey
//     )

//     const tx = await program.methods
//       .initialize(
//         Array.from(root),
//         new BN(1704020400),
//         new BN(1704027600),
//         new BN(1704027600),
//         new BN(1706619600)
//       )
//       .accounts({
//         signer: program.provider.publicKey,
//         adminState: AdminStateAccountPDA,
//         collectionMint: CollectionMint,
//         tokenAccount: TokenAccount,
//         metadataAccount: CollectionMintMetadataPDA,
//         masterEdition: CollectionMintMasterPDA,
//         tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
//         associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
//       })
//       .rpc();

//     console.log("Your transaction signature", tx);
//   });

//   // it("Admin Set Root", async () => {
//   //   // console.log("Now Root :",
//   //   //   (await program.account.adminState.fetch(
//   //   //     AdminStateAccountPDA
//   //   //   )).merkleRoot
//   //   // )

//   //   // let root = Buffer.Buffer.from("27b24e20cc6d70fd54b4c7fb180d3f2989fe006a38fbfd46eee5c7f5b4a4b8b8",'hex');
//   //   const tx = await program.methods
//   //     .adminSetMerkleRoot(Array.from(root))
//   //     .accounts({
//   //       signer: program.provider.publicKey,
//   //       adminState: AdminStateAccountPDA,
//   //     })
//   //     .rpc();
//   //   await program.provider.connection.confirmTransaction(tx, "confirmed");

//   //   // console.log(
//   //   //   "Admin Root Set To: ",
//   //   //   (await program.account.adminState.fetch(
//   //   //     AdminStateAccountPDA
//   //   //   )).merkleRoot
//   //   // )
//   // });


//   // it("Admin Mint", async () => {

//   //   Array.from({ length: 9 }, async (i) => await AdminMint());
//   //   await AdminMint()
//   //   async function AdminMint() {
//   //     const mintKey = anchor.web3.Keypair.generate();

//   //     const [TokenMintMetadataPDA] = web3.PublicKey.findProgramAddressSync(
//   //       [Buffer.Buffer.from('metadata', 'utf8'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintKey.publicKey.toBuffer()],
//   //       TOKEN_METADATA_PROGRAM_ID
//   //     )

//   //     const [TokenMintMasterPDA] = web3.PublicKey.findProgramAddressSync(
//   //       [
//   //         Buffer.Buffer.from('metadata', 'utf8'),
//   //         TOKEN_METADATA_PROGRAM_ID.toBuffer(),
//   //         mintKey.publicKey.toBuffer(),
//   //         Buffer.Buffer.from('edition', 'utf8')
//   //       ],
//   //       TOKEN_METADATA_PROGRAM_ID
//   //     )

//   //     const NftTokenAccount = getAssociatedTokenAddressSync(
//   //       mintKey.publicKey,
//   //       program.provider.publicKey
//   //     );


//   //     let tx = await program.methods
//   //       .adminMint()
//   //       .accounts({
//   //         signer: program.provider.publicKey,
//   //         adminState: AdminStateAccountPDA,
//   //         tokenMint: mintKey.publicKey,
//   //         tokenAccount: NftTokenAccount,
//   //         metadataAccount: TokenMintMetadataPDA,
//   //         masterEdition: TokenMintMasterPDA,
//   //         collectionMint: CollectionMint,
//   //         collectionMetadataAccount: CollectionMintMetadataPDA,
//   //         collectionMasterEdition: CollectionMintMasterPDA,
//   //         tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
//   //       })
//   //       .transaction();
//   //     const txn = new anchor.web3.Transaction().add(
//   //       anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
//   //         units: 300_000,
//   //       }),
//   //       tx
//   //     );

//   //     let txsign = await program.provider.sendAndConfirm(txn, [mintKey]);
//   //     await program.provider.connection.confirmTransaction(txsign, "confirmed");

//   //     console.log("Your transaction signature", txsign);

//   //   }
//   // })


//   // it("User Mint", async () => {
//   //   Array.from({ length: 8 }, async (i) => await UserMint());
//   //   async function UserMint() {

//   //     const mintKey = anchor.web3.Keypair.generate();

//   //     const [MintCounterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
//   //       [Buffer.Buffer.from("demr"), program.provider.publicKey.toBuffer()],
//   //       program.programId
//   //     );

//   //     const [TokenMintMetadataPDA] = web3.PublicKey.findProgramAddressSync(
//   //       [Buffer.Buffer.from('metadata', 'utf8'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintKey.publicKey.toBuffer()],
//   //       TOKEN_METADATA_PROGRAM_ID
//   //     )

//   //     const [TokenMintMasterPDA] = web3.PublicKey.findProgramAddressSync(
//   //       [
//   //         Buffer.Buffer.from('metadata', 'utf8'),
//   //         TOKEN_METADATA_PROGRAM_ID.toBuffer(),
//   //         mintKey.publicKey.toBuffer(),
//   //         Buffer.Buffer.from('edition', 'utf8')
//   //       ],
//   //       TOKEN_METADATA_PROGRAM_ID
//   //     )

//   //     const NftTokenAccount = getAssociatedTokenAddressSync(
//   //       mintKey.publicKey,
//   //       program.provider.publicKey
//   //     );

//   //     let proof = merkleTree.getProof(
//   //       keccak256(program.provider.publicKey.toBase58())
//   //     );

//   //     let tx = await program.methods
//   //       .mint(
//   //         proof.map(i => Array.from(i.data))
//   //       )
//   //       .accounts({
//   //         signer: program.provider.publicKey,
//   //         adminState: AdminStateAccountPDA,
//   //         mintCounter: MintCounterPDA,
//   //         to: new web3.PublicKey("CSTY52Qh6XM5PYVpqewBvXha7DfJBLDD5CJA3vHQLDzV"),
//   //         tokenMint: mintKey.publicKey,
//   //         tokenAccount: NftTokenAccount,
//   //         metadataAccount: TokenMintMetadataPDA,
//   //         masterEdition: TokenMintMasterPDA,
//   //         collectionMint: CollectionMint,
//   //         collectionMetadataAccount: CollectionMintMetadataPDA,
//   //         collectionMasterEdition: CollectionMintMasterPDA,
//   //         tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
//   //       })
//   //       .signers([mintKey])
//   //       .transaction();

//   //     const txn = new anchor.web3.Transaction().add(
//   //       anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
//   //         units: 300_000,
//   //       }),
//   //       tx
//   //     );

//   //     let txsign = await program.provider.sendAndConfirm(txn, [mintKey]);
//   //     await program.provider.connection.confirmTransaction(txsign, "confirmed");

//   //     console.log("Your transaction signature", txsign);
//   //   }
//   // })
// });


