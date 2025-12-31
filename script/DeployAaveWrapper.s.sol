// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/AaveWrapper.sol";

contract DeployAaveWrapper is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        AaveWrapper wrapper = new AaveWrapper();
        
        console.log("AaveWrapper deployed to:", address(wrapper));
        console.log("Network: Sepolia");
        console.log("");
        console.log("Aave V3 Pool:", address(wrapper.AAVE_POOL()));
        console.log("WETH:", address(wrapper.WETH()));
        console.log("aWETH:", address(wrapper.aWETH()));
        
        vm.stopBroadcast();
    }
}
