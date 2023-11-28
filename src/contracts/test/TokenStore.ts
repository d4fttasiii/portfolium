// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { Contract } from "ethers";

// describe("PortfoliumTokenStore", function () {
//   let tokenStore: any;
//   let guard: any;
//   let weth: any;
//   let mockERC20: any;
//   let admin: any, signer1: any, signer2: any, portfolium: any, nonExistingToken: any, nonPortfolium: any;

//   before(async function () {
//     [admin, signer1, signer2, portfolium, nonExistingToken, nonPortfolium] = await ethers.getSigners();
//     const PortfoliumGuard = await ethers.getContractFactory("PortfoliumGuard");
//     guard = await PortfoliumGuard.deploy([signer1.address, signer2.address], 2);
//     await guard.deployed();

//     const role = await guard.PORTFOLIUM_ROLE();
//     const tx = await guard.createRequest(portfolium.address, role);
//     const requestId = tx.logs[0].args.requestId;
//     await guard.approveRequest(requestId, { from: signer1.address });

//     const MockERC20 = await ethers.getContractFactory("MockERC20");
//     mockERC20 = await MockERC20.deploy('Mock Token', 'MTK');
//     await mockERC20.deployed();
//     weth = await MockERC20.deploy("Wrapped Ether", "WETH");
//     await weth.deployed();

//     const PortfoliumTokenStore = await ethers.getContractFactory("PortfoliumTokenStore");
//     tokenStore = await PortfoliumTokenStore.deploy(guard.address, weth.address);
//     await tokenStore.deployed();
//   });

//   // it("should not exceed max contract size of 24.576KB", async function () {
//   //   const bytecode = tokenStore.interface.format(ethers.utils.FormatTypes.full);
//   //   expect(bytecode.length / 2).to.be.at.most(24576);
//   // });

//   describe('addToken', function () {
//     it('should revert if caller is not the portfolium address', async function () {
//       await expect(
//         tokenStore.addToken(mockERC20.address, 1, { from: nonPortfolium.address })
//       ).to.be.revertedWith("PortfoliumTokenStore: Caller must be the portfolium contract");
//     });

//     it('should add a new token', async function () {
//       const tx = await tokenStore.addToken(mockERC20.address, 1, { from: portfolium.address });
//       // Add your event assertion here

//       const token = await tokenStore.getToken(mockERC20.address);
//       expect(token.name).to.equal('Mock Token');
//       expect(token.symbol).to.equal('MTK');
//       expect(token.decimals).to.equal(18);
//     });

//     it('should revert if token already exists', async function () {
//       await expect(
//         tokenStore.addToken(mockERC20.address, 1, { from: portfolium.address })
//       ).to.be.revertedWith("PortfoliumTokenStore: Token already exists!");
//     });
//   });

//   describe('removeToken', function () {
//     it('should revert if caller is not the portfolium address', async function () {
//       await expect(
//         tokenStore.removeToken(mockERC20.address, { from: nonPortfolium.address })
//       ).to.be.revertedWith("PortfoliumTokenStore: Caller must be the portfolium contract");
//     });

//     it('should remove a token', async function () {
//       const tx = await tokenStore.removeToken(mockERC20.address, { from: portfolium.address });
//       // Add your event assertion here

//       const tokenExists = await tokenStore.tokenExists(mockERC20.address);
//       expect(tokenExists).to.equal(false);
//     });

//     it('should revert if token does not exist', async function () {
//       await expect(
//         tokenStore.removeToken(nonExistingToken, { from: portfolium.address })
//       ).to.be.revertedWith("PortfoliumTokenStore: Token already removed!");
//     });
//   });
// });
