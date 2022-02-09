import { AccountInfo, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
import * as Layout from '../../layout';
import { LastUpdate, LastUpdateLayout } from './lastUpdate';
import type {Detail} from "./detail";


export interface MarketPrice {
    version: number;
    oracle:PublicKey;
    target_sql_token:PublicKey;
    pyth_product:PublicKey;
    pyth_price:PublicKey;
    lastUpdate: LastUpdate;
    verify:Boolean;
    expo:number;
    price:BN;
}
export const MarketPriceLayout: typeof  BufferLayout.Structure = BufferLayout.struct(
    [
        BufferLayout.u8('version'),
        Layout.publicKey('oracle'),
        Layout.publicKey('target_spl_token'),
        Layout.publicKey('pyth_product'),
        Layout.publicKey('pyth_price'),
        LastUpdateLayout,
        BufferLayout.u8("verify"),
        BufferLayout.u8("expo"),
        Layout.uint64("price"),
    ]
);
export const PriceParser = (pubkey: PublicKey, info: AccountInfo<Buffer>):Detail<MarketPrice> => {
    const buffer = Buffer.from(info.data);
    const marketPrice = MarketPriceLayout.decode(buffer);
    const details = {
        pubkey,
        account: {
            ...info,
        },
        info: marketPrice,
    };
    return details
};
