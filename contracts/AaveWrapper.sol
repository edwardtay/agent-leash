// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AaveWrapper
 * @notice Wraps ETH → WETH → Aave supply in one deposit() call
 * @dev For AgentLeash - enables simple ETH deposits to earn Aave yield
 * 
 * Sepolia Addresses:
 * - Aave V3 Pool: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
 * - WETH: 0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c
 * - aWETH: 0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830
 */

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface IAToken {
    function balanceOf(address) external view returns (uint256);
}

contract AaveWrapper {
    // Sepolia addresses
    IWETH public constant WETH = IWETH(0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c);
    IAavePool public constant AAVE_POOL = IAavePool(0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951);
    IAToken public constant aWETH = IAToken(0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830);
    
    // Track deposits per user (for UI display, actual balance is in aWETH)
    mapping(address => uint256) public deposited;
    uint256 public totalDeposited;
    
    // Events for Envio indexing
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 timestamp);
    
    constructor() {
        // Approve Aave Pool to spend WETH (max approval)
        WETH.approve(address(AAVE_POOL), type(uint256).max);
    }
    
    /**
     * @notice Deposit ETH → WETH → Aave in one call
     * @dev User receives aWETH which earns yield
     */
    function deposit() external payable {
        require(msg.value > 0, "Must deposit > 0");
        
        // 1. Wrap ETH to WETH
        WETH.deposit{value: msg.value}();
        
        // 2. Supply WETH to Aave (aWETH goes to user)
        AAVE_POOL.supply(address(WETH), msg.value, msg.sender, 0);
        
        // Track for UI
        deposited[msg.sender] += msg.value;
        totalDeposited += msg.value;
        
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @notice Withdraw from Aave → unwrap WETH → ETH
     * @param amount Amount to withdraw (in WETH/ETH terms)
     * @dev User must have approved this contract to spend their aWETH
     */
    function withdraw(uint256 amount) external {
        require(deposited[msg.sender] >= amount, "Insufficient deposited");
        
        // 1. Withdraw WETH from Aave (burns user's aWETH)
        AAVE_POOL.withdraw(address(WETH), amount, address(this));
        
        // 2. Unwrap WETH to ETH
        WETH.withdraw(amount);
        
        // 3. Send ETH to user
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        // Update tracking
        deposited[msg.sender] -= amount;
        totalDeposited -= amount;
        
        emit Withdrawal(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @notice Get user's aWETH balance (includes yield)
     */
    function getAaveBalance(address user) external view returns (uint256) {
        return aWETH.balanceOf(user);
    }
    
    /**
     * @notice Get user's original deposit amount
     */
    function getDeposited(address user) external view returns (uint256) {
        return deposited[user];
    }
    
    /**
     * @notice Receive ETH (auto-deposit)
     */
    receive() external payable {
        // Wrap and supply
        WETH.deposit{value: msg.value}();
        AAVE_POOL.supply(address(WETH), msg.value, msg.sender, 0);
        
        deposited[msg.sender] += msg.value;
        totalDeposited += msg.value;
        
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }
}
