// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PaymentManager is Ownable {
    // agent address => daily limit
    mapping(address => uint256) public dailyLimits;
    
    // agent address => max transaction limit
    mapping(address => uint256) public maxTxLimits;
    
    // agent address => mapping(service address => bool)
    mapping(address => mapping(address => bool)) public approvedServices;
    
    // agent address => mapping(day => uint256)
    // For simplicity, we use the timestamp / 1 days as the day index
    mapping(address => mapping(uint256 => uint256)) public dailySpending;

    event LimitsUpdated(address indexed agent, uint256 dailyLimit, uint256 maxTx);
    event ServiceApprovalUpdated(address indexed agent, address indexed service, bool approved);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Sets the spending limits for an agent.
     */
    function setLimits(address agent, uint256 _dailyLimit, uint256 _maxTxLimit) external onlyOwner {
        dailyLimits[agent] = _dailyLimit;
        maxTxLimits[agent] = _maxTxLimit;
        emit LimitsUpdated(agent, _dailyLimit, _maxTxLimit);
    }

    /**
     * @dev Approves or revokes a service for an agent.
     */
    function setServiceApproval(address agent, address service, bool approved) external onlyOwner {
        approvedServices[agent][service] = approved;
        emit ServiceApprovalUpdated(agent, service, approved);
    }

    /**
     * @dev Verifies if a payment is allowed according to the policy.
     * Reverts if any policy is violated.
     */
    function verifyPayment(address agent, address service, uint256 amount) external view {
        require(approvedServices[agent][service], "Service not approved");
        require(amount <= maxTxLimits[agent], "Exceeds max transaction limit");
        
        uint256 currentDay = block.timestamp / 1 days;
        require(dailySpending[agent][currentDay] + amount <= dailyLimits[agent], "Exceeds daily limit");
    }

    /**
     * @dev Records the spending. Should only be called by the AgentPay contract.
     * In a production environment, this would be access controlled to the AgentPay contract.
     */
    function recordSpending(address agent, uint256 amount) external {
        uint256 currentDay = block.timestamp / 1 days;
        dailySpending[agent][currentDay] += amount;
    }
}
