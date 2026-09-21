// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PaymentManager.sol";

contract AgentPay is ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable usdcToken;
    PaymentManager public immutable paymentManager;

    event PaymentCompleted(address indexed agent, address indexed service, uint256 amount);

    constructor(address _usdcToken, address _paymentManager) {
        require(_usdcToken.code.length > 0 && _paymentManager.code.length > 0, "Invalid contracts");
        usdcToken = IERC20(_usdcToken);
        paymentManager = PaymentManager(_paymentManager);
    }

    /**
     * @dev Executes a payment from an agent to a service provider.
     * The agent must have approved this contract to spend their USDC.
     */
    function makePayment(address service, uint256 amount) external nonReentrant {
        address agent = msg.sender;

        // 1. Verify against policy limits
        paymentManager.verifyPayment(agent, service, amount);

        // 2. Record the spending in the PaymentManager
        paymentManager.recordSpending(agent, amount);

        // 3. Execute the payment
        usdcToken.safeTransferFrom(agent, service, amount);

        emit PaymentCompleted(agent, service, amount);
    }
}
