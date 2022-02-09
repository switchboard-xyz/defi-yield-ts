import {AccountInfo, PublicKey} from "@solana/web3.js";
import {Buffer} from "buffer";

export interface Detail<T>{
    pubkey:PublicKey;
    account: AccountInfo<Buffer>;
    info: T,
}