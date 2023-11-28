// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { Contract, parseEther, FormatType } from "ethers";

// describe("PortfoliumTreasury", function () {
//   let treasury: any;
//   let weth: any;
//   let usdt: any;
//   let tokenStore: any;
//   let guard: any;
//   let swapRouter: any;
//   let admin: any,
//     signer1: any,
//     signer2: any,
//     portfolium: any,
//     recipient: any,
//     faucet: any,
//     nonPortfolium: any;

//   beforeEach(async function () {
//     [admin, signer1, signer2, portfolium, recipient, faucet, nonPortfolium] =
//       await ethers.getSigners();

//     const MockERC20 = await ethers.getContractFactory("MockERC20");
//     weth = await MockERC20.deploy("Wrapped Ether", "WETH");
//     usdt = await MockERC20.deploy("USDT", "USDT");

//     const PortfoliumGuard = await ethers.getContractFactory("PortfoliumGuard");
//     guard = await PortfoliumGuard.deploy([signer1.address, signer2.address], 2);
//     await guard.deployed();

//     const role = await guard.PORTFOLIUM_ROLE();
//     const tx = await guard.createRequest(portfolium.address, role);
//     const requestId = tx.logs[0].args.requestId;
//     await guard.approveRequest(requestId, { from: signer1.address });

//     const PortfoliumTokenStore = await ethers.getContractFactory(
//       "PortfoliumTokenStore"
//     );
//     tokenStore = await PortfoliumTokenStore.deploy(guard.address, weth.address);
//     await tokenStore.deployed();

//     const MockSwapRouter = await ethers.getContractFactory("MockSwapRouter");
//     swapRouter = await MockSwapRouter.deploy();
//     await swapRouter.deployed();

//     const PortfoliumTreasury = await ethers.getContractFactory(
//       "PortfoliumTreasury"
//     );
//     treasury = await PortfoliumTreasury.deploy(
//       guard.address,
//       tokenStore.address,
//       swapRouter.address,
//       weth.address
//     );
//     await treasury.deployed();

//     // Adding tokens
//     await tokenStore.addToken(weth.address, 1, { from:  });
//     await tokenStore.addToken(usdt.address, 1);
//   });

//   it("should not exceed max contract size of 24.576KB", async function () {
//     const bytecode = treasury.interface.format(false);
//     expect(bytecode.length / 2).to.be.at.most(24576);
//   });

//   // "deposit" tests
//   describe("deposit", function () {
//     it("should deposit ether and wrap it into WETH", async function () {
//       const depositAmount = parseEther("1");

//       await treasury.deposit({ value: depositAmount });

//       const wethBalance = await weth.balanceOf(treasury.address);
//       expect(wethBalance).to.equal(depositAmount);
//     });

//     it("should only allow the portfolium account to deposit", async function () {
//       const depositAmount = parseEther("1");

//       await expect(
//         treasury.deposit({ value: depositAmount })
//       ).to.be.revertedWith(
//         "PortfoliumTreasury: Caller must be the portfolium contract"
//       );
//     });
//   });

//   // "withdraw" tests
//   describe("withdraw", function () {
//     it("should withdraw WETH, unwrap it, and send ether to the recipient", async function () {
//       const depositAmount = parseEther("1");
//       const withdrawAmount = parseEther("0.5");

//       await treasury.deposit({ value: depositAmount });
//       const recipientBalanceBefore = await ethers.provider.getBalance(
//         recipient.address
//       );

//       await treasury.withdraw(recipient.address, withdrawAmount);

//       const recipientBalanceAfter = await ethers.provider.getBalance(
//         recipient.address
//       );
//       expect(recipientBalanceAfter.sub(recipientBalanceBefore)).to.equal(
//         withdrawAmount
//       );

//       const wethBalance = await weth.balanceOf(treasury.address);
//       expect(wethBalance).to.equal(depositAmount.sub(withdrawAmount));
//     });

//     it("should only allow the portfolium account to withdraw", async function () {
//       const withdrawAmount = parseEther("0.5");

//       await expect(
//         treasury
          
//           .withdraw(recipient.address, withdrawAmount)
//       ).to.be.revertedWith(
//         "PortfoliumTreasury: Caller must be the portfolium contract"
//       );
//     });
//   });

//   // "swapTokens" tests
//   describe("swapTokens", function () {
//     it("should swap tokens using the swap router", async function () {
//       const amountIn = parseEther("0.4");
//       const amountOutMin = parseEther("0.6");

//       await weth
//         .connect(faucet)
//         .deposit({ value: parseEther("1") });
//       await usdt
//         .connect(faucet)
//         .deposit({ value: parseEther("1") });
//       await weth
//         .connect(faucet)
//         .transfer(treasury.address, parseEther("1"));
//       await usdt
//         .connect(faucet)
//         .transfer(swapRouter.address, parseEther("1"));

//       await treasury.swapTokens(
//         weth.address,
//         usdt.address,
//         amountIn,
//         amountOutMin
//       );

//       const wethBalance = await weth.balanceOf(treasury.address);
//       const usdtBalance = await usdt.balanceOf(treasury.address);

//       expect(wethBalance).to.equal(parseEther("0.6"));
//       expect(usdtBalance).to.equal(parseEther("0.6"));
//     });

//     it("should only allow the portfolium account to swap tokens", async function () {
//       const amountIn = parseEther("0.4");
//       const amountOutMin = parseEther("0.6");

//       await expect(
//         treasury
          
//           .swapTokens(weth.address, usdt.address, amountIn, amountOutMin)
//       ).to.be.revertedWith(
//         "PortfoliumTreasury: Caller must be the portfolium contract"
//       );
//     });
//   });
// });
