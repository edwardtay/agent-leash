// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/SimpleVault.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        SimpleVault vault = new SimpleVault();
        
        console.log("SimpleVault deployed to:", address(vault));
        
        vm.stopBroadcast();
    }
}
