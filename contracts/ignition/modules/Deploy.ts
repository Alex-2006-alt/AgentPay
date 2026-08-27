import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AgentPayModule", (m) => {
  // 1. Deploy MockUSDC with 6 decimals
  const mockUSDC = m.contract("MockUSDC", [6]);

  // 2. Deploy PaymentManager
  const paymentManager = m.contract("PaymentManager", []);

  // 3. Deploy AgentPay, passing the addresses of the two previous contracts
  const agentPay = m.contract("AgentPay", [mockUSDC, paymentManager]);

  return { mockUSDC, paymentManager, agentPay };
});
