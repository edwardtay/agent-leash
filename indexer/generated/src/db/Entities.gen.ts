/* TypeScript file generated from Entities.res by genType. */

/* eslint-disable */
/* tslint:disable */

export type id = string;

export type whereOperations<entity,fieldType> = {
  readonly eq: (_1:fieldType) => Promise<entity[]>; 
  readonly gt: (_1:fieldType) => Promise<entity[]>; 
  readonly lt: (_1:fieldType) => Promise<entity[]>
};

export type DailyStats_t = {
  readonly chainId: number; 
  readonly date: string; 
  readonly id: id; 
  readonly totalDeposits: number; 
  readonly totalVolume: bigint; 
  readonly totalWithdrawals: number; 
  readonly uniqueUsers: number
};

export type DailyStats_indexedFieldOperations = { readonly date: whereOperations<DailyStats_t,string> };

export type VaultDeposit_t = {
  readonly amount: bigint; 
  readonly blockNumber: number; 
  readonly chainId: number; 
  readonly id: id; 
  readonly timestamp: bigint; 
  readonly txHash: string; 
  readonly user: string
};

export type VaultDeposit_indexedFieldOperations = { readonly user: whereOperations<VaultDeposit_t,string> };

export type VaultWithdrawal_t = {
  readonly amount: bigint; 
  readonly blockNumber: number; 
  readonly chainId: number; 
  readonly id: id; 
  readonly timestamp: bigint; 
  readonly txHash: string; 
  readonly user: string
};

export type VaultWithdrawal_indexedFieldOperations = { readonly user: whereOperations<VaultWithdrawal_t,string> };
