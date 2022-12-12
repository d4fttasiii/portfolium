const Treasury = artifacts.require("Treasury");
const Mirrored = artifacts.require("Mirrored");
const Web3 = require('web3');

const assetAddress1 = new Web3().eth.accounts.create();
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')); 

contract("Treasury", (accounts) => {

    it("should not exceed max contract size of 24.576KB", async () => {
        const instance = await Treasury.deployed();
        var bytecode = instance.constructor._json.bytecode;

        assert.isAtMost(
            bytecode.length / 2,
            24576,
            "Max contract size exceeded"
        )
    });

    it("should set default addresses correctly", async () => {
        const treasury = await Treasury.deployed();
        const ownerAddress = await treasury.ownerAddress.call();

        assert.equal(
            ownerAddress,
            accounts[0],
            "Deployer is not the owner"
        );

        const asset = await treasury.assets.call("0x0000000000000000000000000000000000000001");
        assert.equal(
            asset.assetType,
            "0",
            "Asset should be Native"
        );
    });

    it("owner should be able to set portfolium address", async () => {
        const treasury = await Treasury.deployed();

        await treasury.setPortfoliumAddress(accounts[9], { from: accounts[0] });
        const portfoliumAddress = await treasury.portfoliumAddress.call();

        assert.equal(
            portfoliumAddress,
            accounts[9],
            "Owner couldn't set portfolium address"
        );
    });

    it("portfolium should add new asset", async () => {
        const treasury = await Treasury.deployed();
        const mirrored = await Mirrored.deployed();

        await treasury.setPortfoliumAddress(accounts[9], { from: accounts[0] });

        await treasury.addERC20Asset(assetAddress1.address, { from: accounts[9] });
        const asset1 = await treasury.assets.call(assetAddress1.address);
        assert.equal(
            asset1.assetType,
            "1",
            "Asset should be ERC-20"
        );

        await treasury.addMirroredAsset(mirrored.address, { from: accounts[9] });
        const asset2 = await treasury.assets.call(mirrored.address);
        assert.equal(
            asset2.assetType,
            "2",
            "Asset should be Mirrored"
        );
    });

    it("should deposit native tokens successfully", async () => {
        const treasury = await Treasury.deployed();
        await treasury.deposit({ from: accounts[9], value: 10000 });

        const balance = await treasury.getBalanceOf(accounts[9], "0x0000000000000000000000000000000000000001");
        assert.equal(
            balance,
            10000,
            "Balance should match deposited amount"
        );

        const treasuryBalance = await web3.eth.getBalance(treasury.address);
        assert.equal(
            treasuryBalance,
            10000,
            "Treasury balance should be deposited amount"
        );
    });
});
