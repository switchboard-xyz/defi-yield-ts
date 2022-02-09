import {LENDING_PROGRAM_ID} from '../../utils/ids';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import BufferLayout from 'buffer-layout';

export const refreshObligationInstruction = (
  obligation: PublicKey,
  depositReserves: PublicKey[],
  borrowReserves: PublicKey[],
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {instruction: 7},
    data,
  );

  const keys = [
    {pubkey: obligation, isSigner: false, isWritable: true},
    {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
  ];

  for (const depositReserve of depositReserves) {
    console.log("depositReserve",depositReserve.toString())
    keys.push({pubkey: depositReserve, isSigner: false, isWritable: false});
  }
  for (const borrowReserve of borrowReserves) {
    console.log("borrowReserve",borrowReserve.toString())
    keys.push({pubkey: borrowReserve, isSigner: false, isWritable: false});
  }
  console.log("keys")
  keys.map((key)=>{
    console.log(key.pubkey.toString());
  })
  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};
