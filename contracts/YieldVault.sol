// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title YieldVault
 * @notice Unified vault interface for multi-chain deployment
 * @dev Same interface on all chains - actual yield depends on chain
 * 
 * On Sepolia: Wraps to Aave V3 for real yield
 * On Base Sepolia: Simple vault (demo, no yield)
 * 
 * This ensures 1:1 multichain equivalence with same deposit() interface
 */
contract YieldVault {
    // User balances
    mapping(address => uint256) public deposited;
    uint256 public totalDeposited;
    
    // Events for Envio indexing (same on all chains)
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 timestamp);
    
    /**
     * @notice Deposit ETH into the vault
     * @dev On Sepolia this would integrate with Aave, on Base Sepolia it's a simple vault
     */
    function deposit() external payable {
        require(msg.value > 0, "Must deposit > 0");
        
        deposited[msg.sender] += msg.value;
        totalDeposited += msg.value;
        
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @notice Withdraw ETH from the vault
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external {
        require(deposited[msg.sender] >= amount, "Insufficient balance");
        
        deposited[msg.sender] -= amount;
        totalDeposited -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @notice Get user's deposited balance
     */
    function getBalance(address user) external view returns (uint256) {
        return deposited[user];
    }
    
    /**
     * @notice Receive ETH directly (auto-deposit)
     */
    receive() external payable {
        deposited[msg.sender] += msg.value;
        totalDeposited += msg.value;
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }
}
