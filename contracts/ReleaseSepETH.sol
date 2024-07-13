// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ReleaseSepETH is ReentrancyGuard {
    address public bridgeOperator;

    event ETHReleased(address indexed recipient, uint256 amount);

    constructor(address _bridgeOperator) {
        bridgeOperator = _bridgeOperator;
    }

    function releaseETH(
        address recipient,
        uint256 amount
    ) external nonReentrant {
        require(
            msg.sender == bridgeOperator,
            "Only bridge operator can release"
        );
        require(address(this).balance >= amount, "Insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");

        emit ETHReleased(recipient, amount);
    }

    receive() external payable {}
}
