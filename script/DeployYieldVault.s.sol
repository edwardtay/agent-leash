// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/YieldVault.sol";

contract DeployYieldVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        YieldVault vault = new YieldVault();
        
        console.log("YieldVault deployed to:", address(vault));
        console.log("Chain ID:", block.chainid);
        
        vm.stopBroadcast();
    }
}
