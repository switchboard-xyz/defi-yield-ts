import { PublicKey } from '@solana/web3.js';
import {Detail, LendingMarket, LpConfig} from "./models";
//@ts-ignore
//import raydiumBridgeIdl from '../idl/raydium_bridge.json';
//export const BRIDGE_POOL_IDL = raydiumBridgeIdl
export const WRAPPED_SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112',
);
export const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

export let IS_PRODUCTION : boolean
export let URL:string
export let LENDING_PROGRAM_ID:PublicKey
export let LENDING_ID:PublicKey
export let RESERVE_IDS:Array<PublicKey>
export let LP_RESERVE_IDS:Array<LpConfig>
export let RESERVE_LARIX_ORACLES:Array<PublicKey>
//export let LENDING_MARKET:Detail<LendingMarket>
export let RESERVE_NAMES:Array<string>
export let RESERVE_FULLNAMES:Array<string>
export let USE_BACKUP_PRICE:boolean
export let BRIDGE_POOL_PROGRAM_ID:PublicKey
//export const LP_RESERVE_ID_ARRAY = []
URL = "https://larix.rpcpool.com/b9f4f7c826357818e91fbd79bd85"
IS_PRODUCTION = true
USE_BACKUP_PRICE = true
export const WSSURL = "wss://api.larix.app"
if (IS_PRODUCTION){
    LENDING_PROGRAM_ID = new PublicKey('7Zb1bGi32pfsrBkzWdqd4dFhUXwp5Nybr1zuaEwN34hy');
    LENDING_ID = new PublicKey("5geyZJdffDBNoMqEbogbPvdgH9ue7NREobtW8M3C1qfe")//test
    BRIDGE_POOL_PROGRAM_ID = new PublicKey('66TSa2MG2MMzYSesUAwKdf5SZ72wteTY1En1bzVNC9r1')
    RESERVE_IDS = [
        new PublicKey("DC832AzxQMGDaVLGiRQfRCkyXi6PUPjQyQfMbVRRjtKA"),
        new PublicKey("Emq1qT9MyyB5eHfftF5thYme84hoEwh4TCjm31K2Xxif"),
        new PublicKey("9oxCAYbaien8bqjhsGpfVGEV32GJyQ8fSRMsPzczHTEb"),
        new PublicKey("Egw1PCmsm3kAWnFtKFCJkTwi2EMfBi5P4Zfz6iURonFh"),
        new PublicKey("2RcrbkGNcfy9mbarLCCRYdW3hxph7pSbP38x35MR2Bjt"),
        new PublicKey("GaX5diaQz7imMTeNYs5LPAHX6Hq1vKtxjBYzLkjXipMh"),
        new PublicKey("AwL4nHEPDKL7GW91czV4dUAp72kAwMBq1kBvexUYDBMm"),
        new PublicKey("9xdoHwJr4tD2zj3QVpWrzafBKgLZUQWZ2UYPkqyAhQf6"),
        new PublicKey("7PwLriJiW2hRdviqnCEAHwvL21kptG1gs4jrZPqr3uMf"),
        new PublicKey("3GixAiDQgnCkMG6JDA1mxnDPHGjYkrNhWSYjLPzzN3Bs"),
        new PublicKey("FStv7oj29DghUcCRDRJN9sEkB4uuh4SqWBY9pvSQ4Rch"),
    ]
    RESERVE_LARIX_ORACLES = [
        new PublicKey("269apCw3MSNgFUeoW99hhAoAWyCArtDAAB39pzZYRdNx"),
        new PublicKey("7RhdnRymb4TqTYLM5bH7cALj86EZX2sFxH8KYUbhUmLB"),
        new PublicKey("9Hsq93xKsqeUf9b6PkiNDyr79BWphXPgxJ3KUoT4uLni"),
        new PublicKey("5KfiXEBkw745gSyEdmCJEbFEjVPqZCUDXgETycQrMA4n"),
        new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
        new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
        new PublicKey("14QSoduiLpjG74sN1CT5rLZPKafx5FaEgcFC2WRp2wK2"),
        new PublicKey("41qU3QVbNvJGJHRYS8zfNUrPJBUPQNtQD4DgABuPCeVH"),
        new PublicKey("GriuPR5KrTr64rfvVmvMcMdEbiynoNddfMT9BSdFZG2X"),
        new PublicKey("5KfiXEBkw745gSyEdmCJEbFEjVPqZCUDXgETycQrMA4n"),
        new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo")
    ]
    /*
    LENDING_MARKET = {
        pubkey: LENDING_ID,
        account: {},
        info: {
            larixOracleProgramId: new PublicKey("GMjBguH3ceg9wAHEMdY5iZnvzY6CgBACBDvkWmjR7upS"),
            mineSupply: new PublicKey("HCUZ8TiRfFcXAwCMEeTrirfrGCB1jB2KAocTi1jbfHrd"),
            mineMint: new PublicKey("Lrxqnh6ZHKbGy3dcrCED43nsoLkM1LTzU2jRfWe8qUC")
        },
    };
    */
    RESERVE_NAMES = ["USDT", "USDC", "BTC", "ETH", "SOL", "mSOL", "FTT", "SRM","RAY","weWETH","stSOL"]
    RESERVE_FULLNAMES = ["USDT", "USDC", "Bitcoin", "Ethereum", "Solana", "mSOL", "FTT", "Serum","Raydium","weWETH","stSOL"]

    LP_RESERVE_IDS = [
        {
            name:"mSOL-USDC",
            fullName:"Raydium mSOL-USDC",
            reserveID:new PublicKey("DmQn7amR56RdyztqgmdrHF3ZZt7GRUwZUZF4ysRq29Nd"),
            ammID:new PublicKey("ZfvDXXUhZDzDVsapffUyXHj9ByCoPjP4thL6YXcZ9ix"),
            lpMint:new PublicKey("4xTpJ4p76bAeggXoYywpCCNKfJspbuRzZ79R7pRhbqSf"),
            coinMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            pcMintPrice:new PublicKey("7RhdnRymb4TqTYLM5bH7cALj86EZX2sFxH8KYUbhUmLB"),
            ammOpenOrders:new PublicKey("4zoatXFjMSirW2niUNhekxqeEZujjC1oioKCEJQMLeWF"),
            ammCoinMintSupply:new PublicKey("8JUjWjAyXTMB4ZXcV7nk3p6Gg1fWAAoSck7xekuyADKL"),
            ammPcMintSupply:new PublicKey("DaXyxj42ZDrp3mjrL9pYjPNyBp5P8A2f37am4Kd4EyrK"),
            farmPoolID:new PublicKey('DjtZxyFBgifzpaZEzfsWXogNX5zUCnTRXJqarGe9CiSv'),
            farmPoolLpSupply:new PublicKey("HUM5nLWT94iRQRQ7GSsjJ1DDWqWKhKfdGQCJCf7SypeD"),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("AcTRjdD3x4ZHzKGaApVo2RdJ7Rm7f2kaheCiDEjSr1xe"),
            farmRewardVault:new PublicKey("A5W9spnyknywKui1vudnxUomdnebrZVUnjKW6BHgUdyz"),
            farmRewardVaultB:new PublicKey("JE9PvgvXMnVfBkCdwJU4id1w2BaxTuxheKKFdBfRiJZi"),
            version:5,
        },
        {
            name:"mSOL-USDT",
            fullName:"Raydium mSOL-USDT",
            reserveID:new PublicKey("8e3qLgXHdNYFNY5xcNTn34H9bRb1mhRJmRva6VwnpmWe"),
            ammID:new PublicKey("BhuMVCzwFVZMSuc1kBbdcAnXwFg9p4HJp7A9ddwYjsaF"),
            lpMint:new PublicKey("69NCmEW9mGpiWLjAcAWHq51k4ionJZmzgRfRT3wQaCCf"),
            coinMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            pcMintPrice:new PublicKey("269apCw3MSNgFUeoW99hhAoAWyCArtDAAB39pzZYRdNx"),
            ammOpenOrders:new PublicKey("67xxC7oyzGFMVX8AaAHqcT3UWpPt4fMsHuoHrHvauhog"),
            ammCoinMintSupply:new PublicKey("FaoMKkKzMDQaURce1VLewT6K38F6FQS5UQXD1mTXJ2Cb"),
            ammPcMintSupply:new PublicKey("GE8m3rHHejrNf4jE96n5gzMmLbxTfPPcmv9Ppaw24FZa"),
            farmPoolID:new PublicKey('HxhxYASqdLcR6yehT9hB9HUpgcF1R2t9HtkHdngGZ2Dh'),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("FGJKdv7Wm1j75cBsj7FsZU256fhDSYVTwYkzFQ3sVQqg"),
            farmPoolLpSupply:new PublicKey("CxY6pDZxPr8VAArC427NQficTpKEm3VxTVZEZQdQFexZ"),
            farmRewardVault:new PublicKey("94zGzNAzv2xU8YW3uHYkiysjG9Qw2gCv7wx9tye1uYbE"),
            farmRewardVaultB:new PublicKey("8mJzCGURgpUDLnB3qaSQt3xyM7MEKpPcvzXxWTGCQbTb"),
            version:5,
        },
        {
            name:"SOL-USDC",
            fullName:"Raydium SOL-USDC",
            reserveID:new PublicKey("7XbqSGrgrWfs2HErvGt3k9vHPBDGHRHSKtz5UxfK2DfH"),
            farmPoolID:new PublicKey('GUzaohfNuFbBqQTnPgPSNciv3aUvriXYjQduRE3ZkqFw'),
            ammID:new PublicKey("58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"),
            lpMint:new PublicKey("8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu"),
            coinMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            pcMintPrice:new PublicKey("7RhdnRymb4TqTYLM5bH7cALj86EZX2sFxH8KYUbhUmLB"),
            ammOpenOrders:new PublicKey("HRk9CMrpq7Jn9sh7mzxE8CChHG8dneX9p475QKz4Fsfc"),
            ammCoinMintSupply:new PublicKey("DQyrAcCrDXQ7NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz"),
            ammPcMintSupply:new PublicKey("HLmqeL62xR1QoZ1HKKbXRrdN1p3phKpxRMb2VVopvBBz"),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("DgbCWnbXg43nmeiAveMCkUUPEpAr3rZo3iop3TyP6S63"),
            farmPoolLpSupply:new PublicKey("J6ECnRDZEXcxuruvErXDWsPZn9czowKynUr9eDSQ4QeN"),
            farmRewardVault:new PublicKey("38YS2N7VUb856QDsXHS1h8zv5556YgEy9zKbbL2mefjf"),
            farmRewardVaultB:new PublicKey("ANDJUfDryy3jY6DngwGRXVyxCJBT5JfojLDXwZYSpnEL"),
            version:5,
        },
        {
            name:"RAY-SOL",
            fullName:"Raydium RAY-SOL",
            reserveID:new PublicKey("9ceTcxt18KiZyqXJDqDBiZSbm2iPhGjLwXKnHZYZiF87"),
            farmPoolID:new PublicKey('HUDr9BDaAGqi37xbQHzxCyXvfMCKPTPNF8g9c9bPu1Fu'),
            ammID:new PublicKey("AVs9TA4nWDzfPJE9gGVNJMVhcQy3V9PGazuz33BfG2RA"),
            lpMint:new PublicKey("89ZKE4aoyfLBe2RuV6jM3JGNhaV18Nxh8eNtjRcndBip"),
            coinMintPrice:new PublicKey("GriuPR5KrTr64rfvVmvMcMdEbiynoNddfMT9BSdFZG2X"),
            pcMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            ammOpenOrders:new PublicKey("6Su6Ea97dBxecd5W92KcVvv6SzCurE2BXGgFe9LNGMpE"),
            ammCoinMintSupply:new PublicKey("Em6rHi68trYgBFyJ5261A2nhwuQWfLcirgzZZYoRcrkX"),
            ammPcMintSupply:new PublicKey("3mEFzHsJyu2Cpjrz6zPmTzP7uoLFj9SbbecGVzzkL1mJ"),
            farmPoolProgramId:new PublicKey("EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q"),
            farmPoolAuthority:new PublicKey("9VbmvaaPeNAke2MAL3h2Fw82VubH1tBCzwBzaWybGKiG"),
            farmPoolLpSupply:new PublicKey("A4xQv2BQPB1WxsjiCC7tcMH7zUq255uCBkevFj8qSCyJ"),
            farmRewardVault:new PublicKey("6zA5RAQYgazm4dniS8AigjGFtRi4xneqjL7ehrSqCmhr"),
            farmRewardVaultB:new PublicKey("6zA5RAQYgazm4dniS8AigjGFtRi4xneqjL7ehrSqCmhr"),
            version:3,
        },
        {
            name:"SOL-USDT",
            fullName:"Raydium SOL-USDT",
            reserveID:new PublicKey("AbPtGMVG2XpC7cxqW5hWR6EnaTqKnfpYbzpxeKAmLEUr"),

            ammID:new PublicKey("7XawhbbxtsRcQA8KTkHT9f9nc6d69UwqCDh6U5EEbEmX"),
            lpMint:new PublicKey("Epm4KfTj4DMrvqn6Bwg2Tr2N8vhQuNbuK8bESFp4k33K"),
            coinMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            pcMintPrice:new PublicKey("269apCw3MSNgFUeoW99hhAoAWyCArtDAAB39pzZYRdNx"),
            ammOpenOrders:new PublicKey("4NJVwEAoudfSvU5kdxKm5DsQe4AAqG6XxpZcNdQVinS4"),
            ammCoinMintSupply:new PublicKey("876Z9waBygfzUrwwKFfnRcc7cfY4EQf6Kz1w7GRgbVYW"),
            ammPcMintSupply:new PublicKey("CB86HtaqpXbNWbq67L18y5x2RhqoJ6smb7xHUcyWdQAQ"),
            farmPoolID:new PublicKey('5r878BSWPtoXgnqaeFJi7BCycKZ5CodBB2vS9SeiV8q'),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("DimG1WK9N7NdbhddweGTDDBRaBdCmcbPtoWZJ4Fi4rn4"),
            farmPoolLpSupply:new PublicKey("jfhZy3B6sqeu95z71GukkxpkDtfHXJiFAMULM6STWxb"),
            farmRewardVault:new PublicKey("Bgj3meVYds8ficJc9xntbjmMBPVUuyn6CvDUm1AD39yq"),
            farmRewardVaultB:new PublicKey("DJifNDjNt7iHbkNHs9V6Wm5pdiuddtF9w3o4WEiraKrP"),
            version:5,
        },
        {
            name:"RAY-ETH",
            fullName:"Raydium RAY-ETH",
            reserveID:new PublicKey("By2vzoMtUjtziiUZkBd4V5pwFNKeEz4XeZsBXBLGPtoL"),

            ammID:new PublicKey("8iQFhWyceGREsWnLM8NkG9GC8DvZunGZyMzuyUScgkMK"),
            lpMint:new PublicKey("mjQH33MqZv5aKAbKHi8dG3g3qXeRQqq1GFcXceZkNSr"),
            coinMintPrice:new PublicKey("GriuPR5KrTr64rfvVmvMcMdEbiynoNddfMT9BSdFZG2X"),
            pcMintPrice:new PublicKey("5KfiXEBkw745gSyEdmCJEbFEjVPqZCUDXgETycQrMA4n"),
            ammOpenOrders:new PublicKey("7iztHknuo7FAXVrrpAjsHBEEjRTaNH4b3hecVApQnSwN"),
            ammCoinMintSupply:new PublicKey("G3Szi8fUqxfZjZoNx17kQbxeMTyXt2ieRvju4f3eJt9j"),
            ammPcMintSupply:new PublicKey("7MgaPPNa7ySdu5XV7ik29Xoav4qcDk4wznXZ2Muq9MnT"),
            farmPoolID:new PublicKey('B6fbnZZ7sbKHR18ffEDD5Nncgp54iKN1GbCgjTRdqhS1'),
            farmPoolProgramId:new PublicKey("EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q"),
            farmPoolAuthority:new PublicKey("6amoZ7YBbsz3uUUbkeEH4vDTNwjvgjxTiu6nGi9z1JGe"),
            farmPoolLpSupply:new PublicKey("BjAfXpHTHz2kipraNddS6WwQvGGtbvyobn7MxLEEYfrH"),
            farmRewardVault:new PublicKey("7YfTgYQFGEJ4kb8jCF8cBrrUwEFskLin3EbvE1crqiQh"),
            farmRewardVaultB:new PublicKey("7YfTgYQFGEJ4kb8jCF8cBrrUwEFskLin3EbvE1crqiQh"),
            version:3,
        },
        {
            name:"RAY-USDC",
            fullName:"Raydium RAY-USDC",
            reserveID:new PublicKey("EJkTqpmUMhvuiirfed1TjArZJvzUiC6Nq3rkRWXvJtuh"),

            ammID:new PublicKey("6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg"),
            lpMint:new PublicKey("FbC6K13MzHvN42bXrtGaWsvZY9fxrackRSZcBGfjPc7m"),
            coinMintPrice:new PublicKey("GriuPR5KrTr64rfvVmvMcMdEbiynoNddfMT9BSdFZG2X"),
            pcMintPrice:new PublicKey("7RhdnRymb4TqTYLM5bH7cALj86EZX2sFxH8KYUbhUmLB"),
            ammOpenOrders:new PublicKey("J8u8nTHYtvudyqwLrXZboziN95LpaHFHpd97Jm5vtbkW"),
            ammCoinMintSupply:new PublicKey("FdmKUE4UMiJYFK5ogCngHzShuVKrFXBamPWcewDr31th"),
            ammPcMintSupply:new PublicKey("Eqrhxd7bDUCH3MepKmdVkgwazXRzY6iHhEoBpY7yAohk"),
            farmPoolID:new PublicKey('CHYrUBX2RKX8iBg7gYTkccoGNBzP44LdaazMHCLcdEgS'),
            farmPoolProgramId:new PublicKey("EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q"),
            farmPoolAuthority:new PublicKey("5KQFnDd33J5NaMC9hQ64P5XzaaSz8Pt7NBCkZFYn1po"),
            farmPoolLpSupply:new PublicKey("BNnXLFGva3K8ACruAc1gaP49NCbLkyE6xWhGV4G2HLrs"),
            farmRewardVault:new PublicKey("DpRueBHHhrQNvrjZX7CwGitJDJ8eZc3AHcyFMG4LqCQR"),
            farmRewardVaultB:new PublicKey("DpRueBHHhrQNvrjZX7CwGitJDJ8eZc3AHcyFMG4LqCQR"),
            version:3,
        },
        {
            name:"RAY-USDT",
            fullName:"Raydium RAY-USDT",
            reserveID:new PublicKey("43rjwD7obASwjPjCvG8W1vUjkwhAbA95zc2eMa5itDKq"),

            ammID:new PublicKey("DVa7Qmb5ct9RCpaU7UTpSaf3GVMYz17vNVU67XpdCRut"),
            lpMint:new PublicKey("C3sT1R3nsw4AVdepvLTLKr5Gvszr7jufyBWUCvy4TUvT"),
            coinMintPrice:new PublicKey("GriuPR5KrTr64rfvVmvMcMdEbiynoNddfMT9BSdFZG2X"),
            pcMintPrice:new PublicKey("269apCw3MSNgFUeoW99hhAoAWyCArtDAAB39pzZYRdNx"),
            ammOpenOrders:new PublicKey("7UF3m8hDGZ6bNnHzaT2YHrhp7A7n9qFfBj6QEpHPv5S8"),
            ammCoinMintSupply:new PublicKey("3wqhzSB9avepM9xMteiZnbJw75zmTBDVmPFLTQAGcSMN"),
            ammPcMintSupply:new PublicKey("5GtSbKJEPaoumrDzNj4kGkgZtfDyUceKaHrPziazALC1"),
            farmPoolID:new PublicKey('AvbVWpBi2e4C9HPmZgShGdPoNydG4Yw8GJvG9HUcLgce'),
            farmPoolProgramId:new PublicKey("EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q"),
            farmPoolAuthority:new PublicKey("8JYVFy3pYsPSpPRsqf43KSJFnJzn83nnRLQgG88XKB8q"),
            farmPoolLpSupply:new PublicKey("4u4AnMBHXehdpP5tbD6qzB5Q4iZmvKKR5aUr2gavG7aw"),
            farmRewardVault:new PublicKey("HCHNuGzkqSnw9TbwpPv1gTnoqnqYepcojHw9DAToBrUj"),
            farmRewardVaultB:new PublicKey("HCHNuGzkqSnw9TbwpPv1gTnoqnqYepcojHw9DAToBrUj"),
            version:3,
        },
        {
            name:"weWETH-SOL",
            fullName:"Raydium weWETH-SOL",
            reserveID:new PublicKey("FRdb6Q7Mr8dfyjSZMuH9pDEZhHJW2KznhacTSJkxkQjP"),
            ammID:new PublicKey("4yrHms7ekgTBgJg77zJ33TsWrraqHsCXDtuSZqUsuGHb"),
            lpMint:new PublicKey("3hbozt2Por7bcrGod8N7kEeJNMocFFjCJrQR16TQGBrE"),
            coinMintPrice:new PublicKey("5KfiXEBkw745gSyEdmCJEbFEjVPqZCUDXgETycQrMA4n"),
            pcMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            ammOpenOrders:new PublicKey("FBU5FSjYeEZTbbLAjPCfkcDKJpAKtHVQUwL6zDgnNGRF"),
            ammCoinMintSupply:new PublicKey("5ushog8nHpHmYVJVfEs3NXqPJpne21sVZNuK3vqm8Gdg"),
            ammPcMintSupply:new PublicKey("CWGyCCMC7xmWJZgAynhfAG7vSdYoJcmh27FMwVPsGuq5"),
            farmPoolID:new PublicKey('Gi3Z6TXeH1ZhCCbwg6oJL8SE4LcmxmGRNhhfA6NZhwTK'),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("HoUqzaqKTueo1DMcVcTUgnc79uoiF5nRoD2iNGrVhkei"),
            farmPoolLpSupply:new PublicKey("9cTdfPLSkauS8Ys848Wz4pjfFvQjsmJpVTUnYXffkubb"),
            farmRewardVault:new PublicKey("2MMFGZGEjQRovNeNtj1xN9redsVLYTMVcXzFTLQCw6ue"),
            farmRewardVaultB:new PublicKey("6DhjnWKLbxnDSFZApaVJXCY2wbzgt2mYhvW3yBreaYsY"),
            version:5,
        },
        {
            name:"weWETH-USDC",
            fullName:"Raydium weWETH-USDC",
            reserveID:new PublicKey("FKyqkYFmFAEkPhEf6WMFrKuNVpPMYRDVc4fvjheD15o"),
            ammID:new PublicKey("EoNrn8iUhwgJySD1pHu8Qxm5gSQqLK3za4m8xzD2RuEb"),
            lpMint:new PublicKey("3529SBnMCDW3S3xQ52aABbRHo7PcHvpQA4no8J12L5eK"),
            coinMintPrice:new PublicKey("5KfiXEBkw745gSyEdmCJEbFEjVPqZCUDXgETycQrMA4n"),
            pcMintPrice:new PublicKey("7RhdnRymb4TqTYLM5bH7cALj86EZX2sFxH8KYUbhUmLB"),
            ammOpenOrders:new PublicKey("6iwDsRGaQucEcfXX8TgDW1eyTfxLAGrypxdMJ5uqoYcp"),
            ammCoinMintSupply:new PublicKey("DVWRhoXKCoRbvC5QUeTECRNyUSU1gwUM48dBMDSZ88U"),
            ammPcMintSupply:new PublicKey("HftKFJJcUTu6xYcS75cDkm3y8HEkGgutcbGsdREDWdMr"),
            farmPoolID:new PublicKey('8JJSdD1ca5SDtGCEm3yBbQKek2FvJ1EbNt9q2ET3E9Jt'),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("DBoKA7VTfnQDj7knPTrZcg6KKs5WhsKsVRFVjBsjyobs"),
            farmPoolLpSupply:new PublicKey("2ucKrVxYYCfWC6yRk3R7fRbQ5Mjz81ciEgS451TGq2hg"),
            farmRewardVault:new PublicKey("3nhoDqudHBBedE9CuUqnydrWWiMFLKcZf3Ydc9zbAFet"),
            farmRewardVaultB:new PublicKey("B4LA1grBYY9CE3W8sG9asR7Pi2a6eSt2A8RHcXXKJ1UM"),
            version:5,
        }
    ]

} else {
    LENDING_PROGRAM_ID = new PublicKey('BDBsJpBPWtMfTgxejekYCWUAJu1mvQshiwrKuTjdEeT3');
    LENDING_ID = new PublicKey("DwKvvvwpEmSCf8jDdyACrE2fWDhEnqTtjH2MTfXSAfiq")//test
    BRIDGE_POOL_PROGRAM_ID = new PublicKey('BLJ25fqgCiNu2355D2WnmR7Cqur6hCLCpnCNfYyg69pZ')
    RESERVE_IDS = [
        new PublicKey("HdH6SqBqJ1xVpQw4eGVyrxNsVVFPDMgDfX4ZDwoB8RGh"),
        new PublicKey("3D9EihuiHG4N9Sju5J2A8gg4QLtmMwKGiLHRWB8CkUtv"),
        new PublicKey("3T29A2imfP2dSXLSf1ML7zq6sJ19hDaKcWr1TgKUXhnA"),
        new PublicKey("HSSR3kBmK4yUKLfiLkexiHYqq4KDGRKDCxZzS5A69ZfR"),
        new PublicKey("CjsAvz7io4BxSWoZSunExSccPxRsVvscCRwAKrMR1VxX"),
        new PublicKey("E9bUhF1p5VvgLX1iGuAgYWdDPKGY1Ma9rVhN6gDbHkhm"),
        new PublicKey("2NJcGBQ71JiJCWF4AnDT3FvJfMNAuRhejbsoRu6rZmKm"),
        new PublicKey("EH449z9H4rx8G5N4MRR3CVDDAm5MpspfVStJo6FShVoo"),
        new PublicKey("DLHd3nkPNsY3mhpLHvqUehEBS6oBupLE1jZtFww8DR4L"),
        new PublicKey("DkT9XL85DPZjQCaVkXXRJqoMNJPxNC271zMkP92EckkX"),
        new PublicKey("FchB9vZy1Meh5B4rFaTEW2v8mpr29B68SuTADFahCT3X"),
        new PublicKey("6GJxBD9JUeG8ek3NWgCMQktK3JwwYQ4BSmuyY4oLFHL4")
    ]
    RESERVE_LARIX_ORACLES = [
        new PublicKey("269apCw3MSNgFUeoW99hhAoAWyCArtDAAB39pzZYRdNx"),
        new PublicKey("7RhdnRymb4TqTYLM5bH7cALj86EZX2sFxH8KYUbhUmLB"),
        new PublicKey("9Hsq93xKsqeUf9b6PkiNDyr79BWphXPgxJ3KUoT4uLni"),
        new PublicKey("5KfiXEBkw745gSyEdmCJEbFEjVPqZCUDXgETycQrMA4n"),
        new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
        new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
        new PublicKey("14QSoduiLpjG74sN1CT5rLZPKafx5FaEgcFC2WRp2wK2"),
        new PublicKey("41qU3QVbNvJGJHRYS8zfNUrPJBUPQNtQD4DgABuPCeVH"),
        new PublicKey("GriuPR5KrTr64rfvVmvMcMdEbiynoNddfMT9BSdFZG2X"),
        new PublicKey("5KfiXEBkw745gSyEdmCJEbFEjVPqZCUDXgETycQrMA4n"),
        new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
        new PublicKey("269apCw3MSNgFUeoW99hhAoAWyCArtDAAB39pzZYRdNx")
    ]
    /*
    LENDING_MARKET =  {
        pubkey: LENDING_ID,
        account: {
        },
        info: {
            larixOracleProgramId: new PublicKey("GMjBguH3ceg9wAHEMdY5iZnvzY6CgBACBDvkWmjR7upS"),
            mineSupply: new PublicKey("3M5cygbjmff4t5onqGk6mfYjkkhwBp12JNAhohZs83tk"),
            mineMint: new PublicKey("LR4nuUjSGNtRGBFD4tnStDGthJ69Sc8kDUR2ZFQB1Hh")
        },
    };
    */
    RESERVE_NAMES = ["USDT","USDC","BTC","ETH","SOL","mSOL","FTT","SRM","RAY","weWETH","stSOL","UST"]
    RESERVE_FULLNAMES = ["USDT","USDC","Bitcoin","Ethereum","Solana","mSOL","FTT","Serum","Raydium","weWETH","stSOL","UST"]

    // LP_RESERVE_IDS = []
    LP_RESERVE_IDS = [
        {
            name:"mSOL-USDC",
            fullName:"Raydium mSOL-USDC",
            reserveID:new PublicKey("C76MGe5xX2uyz51op5e7QQmqmmGUHLUWcMqhZGYzBYqT"),
            ammID:new PublicKey("ZfvDXXUhZDzDVsapffUyXHj9ByCoPjP4thL6YXcZ9ix"),
            lpMint:new PublicKey("4xTpJ4p76bAeggXoYywpCCNKfJspbuRzZ79R7pRhbqSf"),
            coinMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            pcMintPrice:new PublicKey("7RhdnRymb4TqTYLM5bH7cALj86EZX2sFxH8KYUbhUmLB"),
            ammOpenOrders:new PublicKey("4zoatXFjMSirW2niUNhekxqeEZujjC1oioKCEJQMLeWF"),
            ammCoinMintSupply:new PublicKey("8JUjWjAyXTMB4ZXcV7nk3p6Gg1fWAAoSck7xekuyADKL"),
            ammPcMintSupply:new PublicKey("DaXyxj42ZDrp3mjrL9pYjPNyBp5P8A2f37am4Kd4EyrK"),
            farmPoolID:new PublicKey('DjtZxyFBgifzpaZEzfsWXogNX5zUCnTRXJqarGe9CiSv'),
            farmPoolLpSupply:new PublicKey("HUM5nLWT94iRQRQ7GSsjJ1DDWqWKhKfdGQCJCf7SypeD"),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("AcTRjdD3x4ZHzKGaApVo2RdJ7Rm7f2kaheCiDEjSr1xe"),
            farmRewardVault:new PublicKey("A5W9spnyknywKui1vudnxUomdnebrZVUnjKW6BHgUdyz"),
            farmRewardVaultB:new PublicKey("JE9PvgvXMnVfBkCdwJU4id1w2BaxTuxheKKFdBfRiJZi"),
            version:5,
        },
        {
            name:"mSOL-USDT",
            fullName:"Raydium mSOL-USDT",
            reserveID:new PublicKey("HMiXrft7yP3i3g51Ee1nzcsimSqZNEgSHB2SB91hGLWq"),
            ammID:new PublicKey("BhuMVCzwFVZMSuc1kBbdcAnXwFg9p4HJp7A9ddwYjsaF"),
            lpMint:new PublicKey("69NCmEW9mGpiWLjAcAWHq51k4ionJZmzgRfRT3wQaCCf"),
            coinMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            pcMintPrice:new PublicKey("269apCw3MSNgFUeoW99hhAoAWyCArtDAAB39pzZYRdNx"),
            ammOpenOrders:new PublicKey("67xxC7oyzGFMVX8AaAHqcT3UWpPt4fMsHuoHrHvauhog"),
            ammCoinMintSupply:new PublicKey("FaoMKkKzMDQaURce1VLewT6K38F6FQS5UQXD1mTXJ2Cb"),
            ammPcMintSupply:new PublicKey("GE8m3rHHejrNf4jE96n5gzMmLbxTfPPcmv9Ppaw24FZa"),
            farmPoolID:new PublicKey('HxhxYASqdLcR6yehT9hB9HUpgcF1R2t9HtkHdngGZ2Dh'),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("FGJKdv7Wm1j75cBsj7FsZU256fhDSYVTwYkzFQ3sVQqg"),
            farmPoolLpSupply:new PublicKey("CxY6pDZxPr8VAArC427NQficTpKEm3VxTVZEZQdQFexZ"),
            farmRewardVault:new PublicKey("94zGzNAzv2xU8YW3uHYkiysjG9Qw2gCv7wx9tye1uYbE"),
            farmRewardVaultB:new PublicKey("8mJzCGURgpUDLnB3qaSQt3xyM7MEKpPcvzXxWTGCQbTb"),
            version:5,
        },
        {
            name:"SOL-USDC",
            fullName:"Raydium SOL-USDC",
            reserveID:new PublicKey("3FUiYASg5vm4V1awED7eimgCYPbr9Q2Ba6wLLEM7s8ZT"),
            farmPoolID:new PublicKey('GUzaohfNuFbBqQTnPgPSNciv3aUvriXYjQduRE3ZkqFw'),
            ammID:new PublicKey("58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"),
            lpMint:new PublicKey("8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu"),
            coinMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            pcMintPrice:new PublicKey("7RhdnRymb4TqTYLM5bH7cALj86EZX2sFxH8KYUbhUmLB"),
            ammOpenOrders:new PublicKey("HRk9CMrpq7Jn9sh7mzxE8CChHG8dneX9p475QKz4Fsfc"),
            ammCoinMintSupply:new PublicKey("DQyrAcCrDXQ7NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz"),
            ammPcMintSupply:new PublicKey("HLmqeL62xR1QoZ1HKKbXRrdN1p3phKpxRMb2VVopvBBz"),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("DgbCWnbXg43nmeiAveMCkUUPEpAr3rZo3iop3TyP6S63"),
            farmPoolLpSupply:new PublicKey("J6ECnRDZEXcxuruvErXDWsPZn9czowKynUr9eDSQ4QeN"),
            farmRewardVault:new PublicKey("38YS2N7VUb856QDsXHS1h8zv5556YgEy9zKbbL2mefjf"),
            farmRewardVaultB:new PublicKey("ANDJUfDryy3jY6DngwGRXVyxCJBT5JfojLDXwZYSpnEL"),
            version:5,
        },
        {
            name:"RAY-SOL",
            fullName:"Raydium RAY-SOL",
            reserveID:new PublicKey("Bbsvw2GKXC4UQSXo2eUq8hntBcjrUtbd59rHySerbxSe"),

            ammID:new PublicKey("AVs9TA4nWDzfPJE9gGVNJMVhcQy3V9PGazuz33BfG2RA"),
            lpMint:new PublicKey("89ZKE4aoyfLBe2RuV6jM3JGNhaV18Nxh8eNtjRcndBip"),
            coinMintPrice:new PublicKey("GriuPR5KrTr64rfvVmvMcMdEbiynoNddfMT9BSdFZG2X"),
            pcMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            ammOpenOrders:new PublicKey("6Su6Ea97dBxecd5W92KcVvv6SzCurE2BXGgFe9LNGMpE"),
            ammCoinMintSupply:new PublicKey("Em6rHi68trYgBFyJ5261A2nhwuQWfLcirgzZZYoRcrkX"),
            ammPcMintSupply:new PublicKey("3mEFzHsJyu2Cpjrz6zPmTzP7uoLFj9SbbecGVzzkL1mJ"),
            farmPoolID:new PublicKey('HUDr9BDaAGqi37xbQHzxCyXvfMCKPTPNF8g9c9bPu1Fu'),
            farmPoolProgramId:new PublicKey("EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q"),
            farmPoolAuthority:new PublicKey("9VbmvaaPeNAke2MAL3h2Fw82VubH1tBCzwBzaWybGKiG"),
            farmPoolLpSupply:new PublicKey("A4xQv2BQPB1WxsjiCC7tcMH7zUq255uCBkevFj8qSCyJ"),
            farmRewardVault:new PublicKey("6zA5RAQYgazm4dniS8AigjGFtRi4xneqjL7ehrSqCmhr"),
            farmRewardVaultB:new PublicKey("6zA5RAQYgazm4dniS8AigjGFtRi4xneqjL7ehrSqCmhr"),
            version:3,
        },
        {
            name:"SOL-USDT",
            fullName:"Raydium SOL-USDT",
            reserveID:new PublicKey("5FrUGFhuD3kFoZGhhRN85sEXuXRkzHTXzadKepuqY7CH"),

            ammID:new PublicKey("7XawhbbxtsRcQA8KTkHT9f9nc6d69UwqCDh6U5EEbEmX"),
            lpMint:new PublicKey("Epm4KfTj4DMrvqn6Bwg2Tr2N8vhQuNbuK8bESFp4k33K"),
            coinMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            pcMintPrice:new PublicKey("269apCw3MSNgFUeoW99hhAoAWyCArtDAAB39pzZYRdNx"),
            ammOpenOrders:new PublicKey("4NJVwEAoudfSvU5kdxKm5DsQe4AAqG6XxpZcNdQVinS4"),
            ammCoinMintSupply:new PublicKey("876Z9waBygfzUrwwKFfnRcc7cfY4EQf6Kz1w7GRgbVYW"),
            ammPcMintSupply:new PublicKey("CB86HtaqpXbNWbq67L18y5x2RhqoJ6smb7xHUcyWdQAQ"),
            farmPoolID:new PublicKey('5r878BSWPtoXgnqaeFJi7BCycKZ5CodBB2vS9SeiV8q'),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("DimG1WK9N7NdbhddweGTDDBRaBdCmcbPtoWZJ4Fi4rn4"),
            farmPoolLpSupply:new PublicKey("jfhZy3B6sqeu95z71GukkxpkDtfHXJiFAMULM6STWxb"),
            farmRewardVault:new PublicKey("Bgj3meVYds8ficJc9xntbjmMBPVUuyn6CvDUm1AD39yq"),
            farmRewardVaultB:new PublicKey("DJifNDjNt7iHbkNHs9V6Wm5pdiuddtF9w3o4WEiraKrP"),
            version:5,
        },
        {
            name:"RAY-ETH",
            fullName:"Raydium RAY-ETH",
            reserveID:new PublicKey("8tnp1JtmptRshirRTTnDUvE2v47XNDmW4FzW2zeuorey"),

            ammID:new PublicKey("8iQFhWyceGREsWnLM8NkG9GC8DvZunGZyMzuyUScgkMK"),
            lpMint:new PublicKey("mjQH33MqZv5aKAbKHi8dG3g3qXeRQqq1GFcXceZkNSr"),
            coinMintPrice:new PublicKey("GriuPR5KrTr64rfvVmvMcMdEbiynoNddfMT9BSdFZG2X"),
            pcMintPrice:new PublicKey("5KfiXEBkw745gSyEdmCJEbFEjVPqZCUDXgETycQrMA4n"),
            ammOpenOrders:new PublicKey("7iztHknuo7FAXVrrpAjsHBEEjRTaNH4b3hecVApQnSwN"),
            ammCoinMintSupply:new PublicKey("G3Szi8fUqxfZjZoNx17kQbxeMTyXt2ieRvju4f3eJt9j"),
            ammPcMintSupply:new PublicKey("7MgaPPNa7ySdu5XV7ik29Xoav4qcDk4wznXZ2Muq9MnT"),
            farmPoolID:new PublicKey('B6fbnZZ7sbKHR18ffEDD5Nncgp54iKN1GbCgjTRdqhS1'),
            farmPoolProgramId:new PublicKey("EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q"),
            farmPoolAuthority:new PublicKey("6amoZ7YBbsz3uUUbkeEH4vDTNwjvgjxTiu6nGi9z1JGe"),
            farmPoolLpSupply:new PublicKey("BjAfXpHTHz2kipraNddS6WwQvGGtbvyobn7MxLEEYfrH"),
            farmRewardVault:new PublicKey("7YfTgYQFGEJ4kb8jCF8cBrrUwEFskLin3EbvE1crqiQh"),
            farmRewardVaultB:new PublicKey("7YfTgYQFGEJ4kb8jCF8cBrrUwEFskLin3EbvE1crqiQh"),
            version:3,
        },
        {
            name:"RAY-USDC",
            fullName:"Raydium RAY-USDC",
            reserveID:new PublicKey("3kmHFhQoPYkaxm2iFvED83737gtprppkXRRFvphyLBs1"),

            ammID:new PublicKey("6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg"),
            lpMint:new PublicKey("FbC6K13MzHvN42bXrtGaWsvZY9fxrackRSZcBGfjPc7m"),
            coinMintPrice:new PublicKey("GriuPR5KrTr64rfvVmvMcMdEbiynoNddfMT9BSdFZG2X"),
            pcMintPrice:new PublicKey("7RhdnRymb4TqTYLM5bH7cALj86EZX2sFxH8KYUbhUmLB"),
            ammOpenOrders:new PublicKey("J8u8nTHYtvudyqwLrXZboziN95LpaHFHpd97Jm5vtbkW"),
            ammCoinMintSupply:new PublicKey("FdmKUE4UMiJYFK5ogCngHzShuVKrFXBamPWcewDr31th"),
            ammPcMintSupply:new PublicKey("Eqrhxd7bDUCH3MepKmdVkgwazXRzY6iHhEoBpY7yAohk"),
            farmPoolID:new PublicKey('CHYrUBX2RKX8iBg7gYTkccoGNBzP44LdaazMHCLcdEgS'),
            farmPoolProgramId:new PublicKey("EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q"),
            farmPoolAuthority:new PublicKey("5KQFnDd33J5NaMC9hQ64P5XzaaSz8Pt7NBCkZFYn1po"),
            farmPoolLpSupply:new PublicKey("BNnXLFGva3K8ACruAc1gaP49NCbLkyE6xWhGV4G2HLrs"),
            farmRewardVault:new PublicKey("DpRueBHHhrQNvrjZX7CwGitJDJ8eZc3AHcyFMG4LqCQR"),
            farmRewardVaultB:new PublicKey("DpRueBHHhrQNvrjZX7CwGitJDJ8eZc3AHcyFMG4LqCQR"),
            version:3,
        }
        ,
        {
            name:"RAY-USDT",
            fullName:"Raydium RAY-USDT",
            reserveID:new PublicKey("8zQ2khmmcgcDpioa1hHQS118tNkh7VMhEPwqjtp84WwN"),

            ammID:new PublicKey("DVa7Qmb5ct9RCpaU7UTpSaf3GVMYz17vNVU67XpdCRut"),
            lpMint:new PublicKey("C3sT1R3nsw4AVdepvLTLKr5Gvszr7jufyBWUCvy4TUvT"),
            coinMintPrice:new PublicKey("GriuPR5KrTr64rfvVmvMcMdEbiynoNddfMT9BSdFZG2X"),
            pcMintPrice:new PublicKey("269apCw3MSNgFUeoW99hhAoAWyCArtDAAB39pzZYRdNx"),
            ammOpenOrders:new PublicKey("7UF3m8hDGZ6bNnHzaT2YHrhp7A7n9qFfBj6QEpHPv5S8"),
            ammCoinMintSupply:new PublicKey("3wqhzSB9avepM9xMteiZnbJw75zmTBDVmPFLTQAGcSMN"),
            ammPcMintSupply:new PublicKey("5GtSbKJEPaoumrDzNj4kGkgZtfDyUceKaHrPziazALC1"),
            farmPoolID:new PublicKey('AvbVWpBi2e4C9HPmZgShGdPoNydG4Yw8GJvG9HUcLgce'),
            farmPoolProgramId:new PublicKey("EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q"),
            farmPoolAuthority:new PublicKey("8JYVFy3pYsPSpPRsqf43KSJFnJzn83nnRLQgG88XKB8q"),
            farmPoolLpSupply:new PublicKey("4u4AnMBHXehdpP5tbD6qzB5Q4iZmvKKR5aUr2gavG7aw"),
            farmRewardVault:new PublicKey("HCHNuGzkqSnw9TbwpPv1gTnoqnqYepcojHw9DAToBrUj"),
            farmRewardVaultB:new PublicKey("HCHNuGzkqSnw9TbwpPv1gTnoqnqYepcojHw9DAToBrUj"),
            version:3,
        },
        {
            name:"weWETH-SOL",
            fullName:"Raydium weWETH-SOL",
            reserveID:new PublicKey("645zYQCGnBMNRdrmk28VFyY8xthx2km9jFz1s2BYZP3k"),
            ammID:new PublicKey("4yrHms7ekgTBgJg77zJ33TsWrraqHsCXDtuSZqUsuGHb"),
            lpMint:new PublicKey("3hbozt2Por7bcrGod8N7kEeJNMocFFjCJrQR16TQGBrE"),
            coinMintPrice:new PublicKey("5KfiXEBkw745gSyEdmCJEbFEjVPqZCUDXgETycQrMA4n"),
            pcMintPrice:new PublicKey("4b48cC9RJwmLxGSPZGgPSh2qdQfwqzsxp2AZRyAdtHSo"),
            ammOpenOrders:new PublicKey("FBU5FSjYeEZTbbLAjPCfkcDKJpAKtHVQUwL6zDgnNGRF"),
            ammCoinMintSupply:new PublicKey("5ushog8nHpHmYVJVfEs3NXqPJpne21sVZNuK3vqm8Gdg"),
            ammPcMintSupply:new PublicKey("CWGyCCMC7xmWJZgAynhfAG7vSdYoJcmh27FMwVPsGuq5"),
            farmPoolID:new PublicKey('Gi3Z6TXeH1ZhCCbwg6oJL8SE4LcmxmGRNhhfA6NZhwTK'),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("HoUqzaqKTueo1DMcVcTUgnc79uoiF5nRoD2iNGrVhkei"),
            farmPoolLpSupply:new PublicKey("9cTdfPLSkauS8Ys848Wz4pjfFvQjsmJpVTUnYXffkubb"),
            farmRewardVault:new PublicKey("2MMFGZGEjQRovNeNtj1xN9redsVLYTMVcXzFTLQCw6ue"),
            farmRewardVaultB:new PublicKey("6DhjnWKLbxnDSFZApaVJXCY2wbzgt2mYhvW3yBreaYsY"),
            version:5,
        },
        {
            name:"weWETH-USDC",
            fullName:"Raydium weWETH-USDC",
            reserveID:new PublicKey("CnEZByV8ZsG67idVUD68NQzzNa9vebdPQwXP5pqAd6Yt"),
            ammID:new PublicKey("EoNrn8iUhwgJySD1pHu8Qxm5gSQqLK3za4m8xzD2RuEb"),
            lpMint:new PublicKey("3529SBnMCDW3S3xQ52aABbRHo7PcHvpQA4no8J12L5eK"),
            coinMintPrice:new PublicKey("5KfiXEBkw745gSyEdmCJEbFEjVPqZCUDXgETycQrMA4n"),
            pcMintPrice:new PublicKey("7RhdnRymb4TqTYLM5bH7cALj86EZX2sFxH8KYUbhUmLB"),
            ammOpenOrders:new PublicKey("6iwDsRGaQucEcfXX8TgDW1eyTfxLAGrypxdMJ5uqoYcp"),
            ammCoinMintSupply:new PublicKey("DVWRhoXKCoRbvC5QUeTECRNyUSU1gwUM48dBMDSZ88U"),
            ammPcMintSupply:new PublicKey("HftKFJJcUTu6xYcS75cDkm3y8HEkGgutcbGsdREDWdMr"),
            farmPoolID:new PublicKey('8JJSdD1ca5SDtGCEm3yBbQKek2FvJ1EbNt9q2ET3E9Jt'),
            farmPoolProgramId:new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
            farmPoolAuthority:new PublicKey("DBoKA7VTfnQDj7knPTrZcg6KKs5WhsKsVRFVjBsjyobs"),
            farmPoolLpSupply:new PublicKey("2ucKrVxYYCfWC6yRk3R7fRbQ5Mjz81ciEgS451TGq2hg"),
            farmRewardVault:new PublicKey("3nhoDqudHBBedE9CuUqnydrWWiMFLKcZf3Ydc9zbAFet"),
            farmRewardVaultB:new PublicKey("B4LA1grBYY9CE3W8sG9asR7Pi2a6eSt2A8RHcXXKJ1UM"),
            version:5,
        }
    ]

}
export const RESERVE_IDS_LENGTH = RESERVE_IDS.length
export const LP_TOKEN_LENGTH = LP_RESERVE_IDS.length
export const SINGLE_LP_RESERVE_IDS_LENGTH = 10
export const ALL_IDS:PublicKey[] =[]
RESERVE_IDS.map((item)=>{
    ALL_IDS.push(item)
})
RESERVE_LARIX_ORACLES.map((item)=>{
    ALL_IDS.push(item)
})
export const LP_CONFIG_LENGTH = 10
LP_RESERVE_IDS.map(lpReserve=>{
    ALL_IDS.push(lpReserve.reserveID);
    ALL_IDS.push(lpReserve.ammID);
    ALL_IDS.push(lpReserve.lpMint);
    ALL_IDS.push(lpReserve.coinMintPrice);
    ALL_IDS.push(lpReserve.pcMintPrice);
    ALL_IDS.push(lpReserve.ammOpenOrders);
    ALL_IDS.push(lpReserve.ammCoinMintSupply);
    ALL_IDS.push(lpReserve.ammPcMintSupply);
    //Used to calculate APR
    ALL_IDS.push(lpReserve.farmPoolID);
    ALL_IDS.push(lpReserve.farmPoolLpSupply);
    //LP_RESERVE_ID_ARRAY.push(lpReserve.reserveID.toString())
})
export const LP_REWARD_TOKEN={
    "mSOL-USDT":{
        rewardA:'RAY',
        rewardB:'MNDE'
    },
    "mSOL-USDC":{
        rewardA:'RAY',
        rewardB:'MNDE'
    },
    "SOL-USDC":{
        rewardA:'RAY',
        rewardB:'SRM'
    },
    "RAY-SOL":{
        rewardA:'',
        rewardB:'RAY'// only one
    },
    "SOL-USDT":{
        rewardA:'RAY',
        rewardB:'SRM'
    },
    "RAY-ETH":{
        rewardA:'',// only one
        rewardB:'RAY'
    },
    "RAY-USDC":{
        rewardA:'',// only one
        rewardB:'RAY'
    },
    "RAY-USDT":{
        rewardA:'',// only one
        rewardB:'RAY'
    },
    "weWETH-SOL":{
        rewardA:'RAY',
        rewardB:'SRM'
    },
    "weWETH-USDC":{
        rewardA:'RAY',
        rewardB:'SRM'
    },
}
