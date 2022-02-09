import { PublicKey } from "@solana/web3.js";
import {AccountInfo} from "@solana/web3.js";

export interface LpConfig{
    name:string,
    fullName:string,
    reserveID:PublicKey;
    ammID:PublicKey;
    lpMint:PublicKey;
    coinMintPrice:PublicKey;
    pcMintPrice:PublicKey;
    ammOpenOrders:PublicKey;
    ammCoinMintSupply:PublicKey;
    ammPcMintSupply:PublicKey;
    farmPoolID:PublicKey;
    farmPoolLpSupply:PublicKey;
    farmPoolProgramId:PublicKey|undefined;
    farmPoolAuthority:PublicKey|undefined;
    farmRewardVault:PublicKey|undefined;
    farmRewardVaultB:PublicKey|undefined;
    version:number;

}
export interface LpPriceAccountData{
    reserveID:AccountInfo<Buffer>;
    ammID:AccountInfo<Buffer>;
    lpMint:AccountInfo<Buffer>;
    coinMintPrice:AccountInfo<Buffer>;
    pcMintPrice:AccountInfo<Buffer>;
    ammOpenOrders:AccountInfo<Buffer>;
    ammCoinMintSupply:AccountInfo<Buffer>;
    ammPcMintSupply:AccountInfo<Buffer>;
}