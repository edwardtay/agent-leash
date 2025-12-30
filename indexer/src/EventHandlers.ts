// @ts-nocheck
import { SimpleVault } from "../generated/index.js";

// Handle Deposit events
SimpleVault.Deposit.handler(async ({ event, context }) => {
  const id = `${event.chainId}-${event.transaction.hash}-${event.logIndex}`;
  
  context.VaultDeposit.set({
    id,
    user: event.params.user,
    amount: event.params.amount,
    timestamp: event.params.timestamp,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    chainId: event.chainId,
  });

  // Update daily stats
  const date = new Date(Number(event.params.timestamp) * 1000).toISOString().split('T')[0];
  const statsId = `${date}-${event.chainId}`;
  
  const existingStats = await context.DailyStats.get(statsId);
  
  if (existingStats) {
    context.DailyStats.set({
      ...existingStats,
      totalDeposits: existingStats.totalDeposits + 1,
      totalVolume: existingStats.totalVolume + event.params.amount,
    });
  } else {
    context.DailyStats.set({
      id: statsId,
      date,
      chainId: event.chainId,
      totalDeposits: 1,
      totalWithdrawals: 0,
      totalVolume: event.params.amount,
      uniqueUsers: 1,
    });
  }
});

// Handle Withdrawal events
SimpleVault.Withdrawal.handler(async ({ event, context }) => {
  const id = `${event.chainId}-${event.transaction.hash}-${event.logIndex}`;
  
  context.VaultWithdrawal.set({
    id,
    user: event.params.user,
    amount: event.params.amount,
    timestamp: event.params.timestamp,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    chainId: event.chainId,
  });

  // Update daily stats
  const date = new Date(Number(event.params.timestamp) * 1000).toISOString().split('T')[0];
  const statsId = `${date}-${event.chainId}`;
  
  const existingStats = await context.DailyStats.get(statsId);
  
  if (existingStats) {
    context.DailyStats.set({
      ...existingStats,
      totalWithdrawals: existingStats.totalWithdrawals + 1,
    });
  } else {
    context.DailyStats.set({
      id: statsId,
      date,
      chainId: event.chainId,
      totalDeposits: 0,
      totalWithdrawals: 1,
      totalVolume: BigInt(0),
      uniqueUsers: 1,
    });
  }
});
