// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LockCBTC is ReentrancyGuard {
    address public bridgeOperator;

    struct Lock {
        address user;
        uint256 amount;
        bool processed;
    }

    mapping(bytes32 => Lock) public locks;

    event CBTCLocked(
        bytes32 indexed lockId,
        address indexed user,
        uint256 amount
    );
    event LockProcessed(bytes32 indexed lockId);

    constructor(address _bridgeOperator) {
        bridgeOperator = _bridgeOperator;
    }

    function lockCBTC(uint256 amount) external payable nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(msg.value >= amount, "Transfer failed");

        bytes32 lockId = keccak256(
            abi.encodePacked(msg.sender, amount, block.timestamp)
        );
        locks[lockId] = Lock(msg.sender, amount, false);

        emit CBTCLocked(lockId, msg.sender, amount);
    }

    function processLock(bytes32 lockId) external {
        require(
            msg.sender == bridgeOperator,
            "Only bridge operator can process"
        );
        require(!locks[lockId].processed, "Already processed");

        locks[lockId].processed = true;
        emit LockProcessed(lockId);
    }
}
