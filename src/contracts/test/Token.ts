// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { Contract } from "ethers";
// import { PortfoliumToken } from "../typechain-types";

// describe("PortfoliumToken", function () {
//     let token: PortfoliumToken;
//     let guardAddress: string;
//     let maximumSupply: number;
//     let initialTokenHolder: string;
//     let minter: string;
//     let nonMinter: string;

//     beforeEach(async function () {
//         // Deploy the Guard contract and other setup here

//         // Deploy the PortfoliumToken contract
//         const PortfoliumTokenFactory = await ethers.getContractFactory("PortfoliumToken");
//         token = await PortfoliumTokenFactory.deploy(guardAddress, maximumSupply, initialTokenHolder);

//         // Assign roles and addresses
//         minter = await ethers.getSigner(/* Minter address */);
//         nonMinter = await ethers.getSigner(/* Non-minter address */);
//     });

//     describe("Deployment", function () {
//         it("Should set the right maximumSupply", async function () {
//             expect(await token.maximumSupply()).to.equal(maximumSupply);
//         });

//         // Add more tests for initial deployment conditions
//     });

//     describe("Minting", function () {
//         it("Should mint the correct amount of tokens to the specified address", async function () {
//             const mintAmount = 100;
//             await token.connect(minter).mint(initialTokenHolder, mintAmount);
//             expect(await token.balanceOf(initialTokenHolder)).to.equal(mintAmount);
//         });

//         it("Should fail to mint if called by a non-minter", async function () {
//             const mintAmount = 100;
//             await expect(token.connect(nonMinter).mint(initialTokenHolder, mintAmount)).to.be.revertedWith("PortfoliumToken: caller must be a minter");
//         });

//         // Add more tests for edge cases, such as minting more than maximum supply
//     });

//     // Add more tests for other functionalities and edge cases
// });
