import { expect } from "chai";
import { ethers } from "hardhat";

describe("AgentPay Policy and Payment Engine", function () {
  let mockUSDC: any;
  let paymentManager: any;
  let agentPay: any;
  let owner: any;
  let agent: any;
  let service: any;
  let unauthorizedService: any;

  const DECIMALS = 6;
  // Use ethers.parseUnits for ethers v6
  const parseUSDC = (amount: string) => ethers.parseUnits(amount, DECIMALS);

  beforeEach(async function () {
    [owner, agent, service, unauthorizedService] = await ethers.getSigners();

    // 1. Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy(DECIMALS);

    // 2. Deploy Payment Manager
    const PaymentManager = await ethers.getContractFactory("PaymentManager");
    paymentManager = await PaymentManager.deploy();

    // 3. Deploy AgentPay
    const AgentPay = await ethers.getContractFactory("AgentPay");
    agentPay = await AgentPay.deploy(await mockUSDC.getAddress(), await paymentManager.getAddress());

    // Setup Agent Wallet
    // Mint 100 USDC to agent
    await mockUSDC.mint(agent.address, parseUSDC("100"));
    // Agent approves AgentPay contract to spend their USDC
    await mockUSDC.connect(agent).approve(await agentPay.getAddress(), parseUSDC("1000"));

    // Setup Policies via PaymentManager
    // Daily Limit: 10 USDC, Max Tx: 2 USDC
    await paymentManager.setLimits(agent.address, parseUSDC("10"), parseUSDC("2"));
    
    // Whitelist the authorized service
    await paymentManager.setServiceApproval(agent.address, service.address, true);
  });

  it("should successfully execute a valid payment", async function () {
    const amount = parseUSDC("1.5");
    await expect(agentPay.connect(agent).makePayment(service.address, amount))
      .to.emit(agentPay, "PaymentCompleted")
      .withArgs(agent.address, service.address, amount);

    expect(await mockUSDC.balanceOf(service.address)).to.equal(amount);
    expect(await mockUSDC.balanceOf(agent.address)).to.equal(parseUSDC("98.5"));
  });

  it("should revert if payment exceeds max transaction limit", async function () {
    const amount = parseUSDC("2.5"); // Limit is 2.0
    await expect(
      agentPay.connect(agent).makePayment(service.address, amount)
    ).to.be.revertedWith("Exceeds max transaction limit");
  });

  it("should revert if service is not whitelisted", async function () {
    const amount = parseUSDC("1");
    await expect(
      agentPay.connect(agent).makePayment(unauthorizedService.address, amount)
    ).to.be.revertedWith("Service not approved");
  });

  it("should revert if daily limit is exceeded through multiple transactions", async function () {
    // Limit is 10. We do 5 txs of 2 USDC.
    for (let i = 0; i < 5; i++) {
      await agentPay.connect(agent).makePayment(service.address, parseUSDC("2"));
    }

    // 6th transaction should fail
    await expect(
      agentPay.connect(agent).makePayment(service.address, parseUSDC("1"))
    ).to.be.revertedWith("Exceeds daily limit");
  });
});
