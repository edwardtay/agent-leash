// @ts-nocheck
import generated from "../generated/index.js";
const { SimpleVault, YieldVault, AaveWrapper } = generated;

// Generic deposit handler
const handleDeposit = async ({ event, context }: any) => {
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
};

// Generic withdrawal handler
const handleWithdrawal = async ({ event, context }: any) => {
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
};

// SimpleVault handlers
SimpleVault.Deposit.handler(handleDeposit);
SimpleVault.Withdrawal.handler(handleWithdrawal);

// YieldVault handlers (same events, same schema)
YieldVault.Deposit.handler(handleDeposit);
YieldVault.Withdrawal.handler(handleWithdrawal);

// AaveWrapper handlers (same events, same schema)
AaveWrapper.Deposit.handler(handleDeposit);
AaveWrapper.Withdrawal.handler(handleWithdrawal);
