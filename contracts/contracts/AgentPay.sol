// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PaymentManager.sol";

contract AgentPay {
    IERC20 public usdcToken;
    PaymentManager public paymentManager;

    event PaymentCompleted(address indexed agent, address indexed service, uint256 amount);

    constructor(address _usdcToken, address _paymentManager) {
        usdcToken = IERC20(_usdcToken);
        paymentManager = PaymentManager(_paymentManager);
    }

    /**
     * @dev Executes a payment from an agent to a service provider.
     * The agent must have approved this contract to spend their USDC.
     */
    function makePayment(address service, uint256 amount) external {
        address agent = msg.sender;

        // 1. Verify against policy limits
        paymentManager.verifyPayment(agent, service, amount);

        // 2. Record the spending in the PaymentManager
        paymentManager.recordSpending(agent, amount);

        // 3. Execute the payment
        require(
            usdcToken.transferFrom(agent, service, amount),
            "USDC transfer failed"
        );

        emit PaymentCompleted(agent, service, amount);
    }
}
