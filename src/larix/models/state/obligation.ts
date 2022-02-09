import {AccountInfo, PublicKey} from '@solana/web3.js';
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
import * as Layout from '../../layout';
import {LastUpdate, LastUpdateLayout} from './lastUpdate';
import {Detail} from './detail';
import BigNumber from 'bignumber.js';
import type {Reserve} from './reserve';

export interface Obligation {
  version: number;
  lastUpdate: LastUpdate;
  lendingMarket: PublicKey;
  owner: PublicKey;
  // @FIXME: check usages
  deposits: ObligationCollateral[];
  sortedDeposits: ObligationCollateral[];
  // @FIXME: check usages
  borrows: ObligationLiquidity[];
  sortedBorrows: ObligationLiquidity[];
  depositedValue: BN; // decimals
  borrowedValue: BN; // decimals
  allowedBorrowValue: BN; // decimals
  unhealthyBorrowValue: BN; // decimals
  unclaimedMine: BN;
  depositedValueInBibNumber: BigNumber;
  borrowLimitValueInBibNumber: BigNumber;
  borrowedValueInBigNumber: BigNumber;
  debtRatio:BigNumber;
}

export interface ObligationCollateral {
  index: BN,
  depositReserve: PublicKey;
  depositedAmount: BN;
  marketValue: BN; // decimals
  depositedMarketValue: BigNumber;
  depositedInTokenUnit:BigNumber;
  reserve: Detail<Reserve>
}

export interface ObligationLiquidity {
  index: BN,
  borrowReserve: PublicKey;
  cumulativeBorrowRateWads: BN; // decimals
  borrowedAmountWads: BN; // decimals
  marketValue: BN; // decimals
  marketValueInBigNumber: BigNumber;
  borrowAmountValueInTokenUnit:BigNumber;
  reserve: Detail<Reserve>
}


export const ObligationLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('version'),
    LastUpdateLayout,
    Layout.publicKey('lendingMarket'),
    Layout.publicKey('owner'),
    Layout.uint128('depositedValue'),
    Layout.uint128('borrowedValue'),
    Layout.uint128('allowedBorrowValue'),
    Layout.uint128('unhealthyBorrowValue'),
    BufferLayout.u8('depositsLen'),
    BufferLayout.u8('borrowsLen'),
    Layout.uint128('unclaimedMine'),
    BufferLayout.blob(96 * 9 + 72, 'dataFlat'),
  ],
);

export const ObligationCollateralLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    Layout.publicKey('depositReserve'),
    Layout.uint64('depositedAmount'),
    Layout.uint128('marketValue'),
    Layout.uint128('index'),
  ],
);

export const ObligationLiquidityLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    Layout.publicKey('borrowReserve'),
    Layout.uint128('cumulativeBorrowRateWads'),
    Layout.uint128('borrowedAmountWads'),
    Layout.uint128('marketValue'),
    Layout.uint128('index'),
  ],
);

export const isObligation = (info: AccountInfo<Buffer>) => {
  return info.data.length === ObligationLayout.span;
};


export const ObligationParser = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>,
): Detail<Obligation> => {
  const buffer = Buffer.from(info.data);
  const {
    version,
    lastUpdate,
    lendingMarket,
    owner,
    depositedValue,
    borrowedValue,
    allowedBorrowValue,
    unhealthyBorrowValue,
    depositsLen,
    borrowsLen,
    unclaimedMine,
    dataFlat,
  } = ObligationLayout.decode(buffer);

  if (lastUpdate.slot.isZero()) {
    throw new Error('lastUpdate.slot.isZero()');
  }

  const depositsBuffer = dataFlat.slice(
    0,
    depositsLen * ObligationCollateralLayout.span,
  );
  const deposits = BufferLayout.seq(
    ObligationCollateralLayout,
    depositsLen,
  ).decode(depositsBuffer);

  const borrowsBuffer = dataFlat.slice(
    depositsBuffer.length,
    depositsBuffer.length + borrowsLen * ObligationLiquidityLayout.span,
  );
  const borrows = BufferLayout.seq(
    ObligationLiquidityLayout,
    borrowsLen,
  ).decode(borrowsBuffer);
  const obligation = {
    version,
    lastUpdate,
    lendingMarket,
    owner,
    depositedValue,
    borrowedValue,
    allowedBorrowValue,
    unhealthyBorrowValue,
    unclaimedMine,
    deposits,
    borrows,
  };

  const details = {
    pubkey,
    account: {
      ...info,
    },
    info: obligation,
  };

  return details as Detail<Obligation>;
};

// @TODO: implement
export const healthFactorToRiskColor = (health: number) => {
  return '';
};
