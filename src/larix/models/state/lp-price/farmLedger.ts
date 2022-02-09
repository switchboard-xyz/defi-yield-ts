import * as BufferLayout from 'buffer-layout';
import * as Layout from '../../../layout';
import {AccountInfo, PublicKey} from "@solana/web3.js";
import {Detail} from "../detail";
import BN from "bn.js";
export interface FarmLedger {
    state:BN,
    id:PublicKey,
    owner:PublicKey,
    deposited:BN
}
const FarmLedgerLayout = BufferLayout.struct([
    Layout.uint64("state"),
    Layout.publicKey("id"),
    Layout.publicKey("owner"),
    Layout.uint64("deposited"),
]);
export const FarmLedgerParser = (pubkey: PublicKey, info: AccountInfo<Buffer>|null):Detail<FarmLedger> => {
    if (info==null){
        throw new Error("Info can not be null")
    }
    const buffer = Buffer.from(info.data);
    const mint = FarmLedgerLayout.decode(buffer)
    const details = {
        pubkey,
        account: {
            ...info,
        },
        info: mint,
    };

    return details;
}
