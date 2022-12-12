const Treasury = artifacts.require("Treasury");
const Mirrored = artifacts.require("Mirrored");
const Oracle = artifacts.require("Oracle");
const Portfolium = artifacts.require("Portfolium");
const Reserve = artifacts.require("Reserve");
const Web3 = require('web3');

const tokenPrice = 5000;
const mirroredCommission = 1000;
const platformCommission = 10000;
const mirroredAlloc = 10;
const amountToBuy = 5;
const amountToSell = 3;
const amountRemaining = amountToBuy - amountToSell;
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')); 

contract("Portfolium", (accounts) => {
    before(async () => {
        const oracle = await Oracle.deployed();
        const mirrored = await Mirrored.deployed();
        const treasury = await Treasury.deployed();
        const portfolium = await Portfolium.deployed();
        const reserve = await Reserve.deployed();

        await oracle.setPrice(mirrored.address, tokenPrice, { from: accounts[1] });
        await oracle.setAssetTypeMirrored(mirrored.address, { from: accounts[1] });
        await treasury.setPortfoliumAddress(portfolium.address);
        await mirrored.updateCommission(mirroredCommission);
        await reserve.addAccount(mirrored.address);
        await portfolium.updatePlatformCommission(platformCommission);
    });

    it("should not exceed max contract size of 24.576KB", async () => {
        const instance = await Portfolium.deployed();
        var bytecode = instance.constructor._json.bytecode;
        
        assert.isAtMost(
            bytecode.length / 2,
            24576,
            "Max contract size exceeded"
        )
    });

    it("should set default addresses correctly", async () => {
        const portfolium = await Portfolium.deployed();
        const ownerAddress = await portfolium.ownerAddress.call();

        assert.equal(
            ownerAddress,
            accounts[0],
            "Deployer is not the owner"
        );
    });

    it("should update platform commission", async () => {
        const portfolium = await Portfolium.deployed();
        await portfolium.updatePlatformCommission(10000);

        const platformCommission = await portfolium.platformCommission.call();

        assert.equal(
            platformCommission,
            10000,
            "Commission was not updated correctly."
        );
    });

    it("should add supported mirrored asset", async () => {
        const portfolium = await Portfolium.deployed();
        const mirrored = await Mirrored.deployed();
        await portfolium.addSupportedMirroredAsset(mirrored.address);

        const asset = await portfolium.availableAssets.call(mirrored.address);

        assert.equal(
            asset.name,
            "Netflix, Inc.",
            "Asset name incorrect"
        );
        assert.equal(
            asset.symbol,
            "mNFLX",
            "Asset symbol incorrect"
        );
        assert.equal(
            asset.decimals,
            2,
            "Asset decimals incorrect"
        );
    });

    it("user should create new portfolio", async () => {
        const portfolium = await Portfolium.deployed();
        await portfolium.createPortfolio("Sh1tFoli0", "SHT", 1000, { from: accounts[3], value: platformCommission });

        const portfolio = await portfolium.portfolios.call(accounts[3]);
        assert.equal(
            portfolio.name,
            "Sh1tFoli0",
            "Portfolio name incorrect"
        );
        assert.equal(
            portfolio.symbol,
            "SHT",
            "Portfolio symbol incorrect"
        );
        assert.equal(
            portfolio.assetCount,
            1,
            "Portfolio assetCount incorrect"
        );
    });

    it("user should add new asset to portfolio", async () => {
        const portfolium = await Portfolium.deployed();
        const mirrored = await Mirrored.deployed();
        await portfolium.addAsset(mirrored.address, { from: accounts[3] });

        const portfolio = await portfolium.portfolios.call(accounts[3]);
        assert.equal(
            portfolio.assetCount,
            2,
            "Portfolio assetCount incorrect"
        );
    });

    it("user should update portfolio allocation", async () => {
        const portfolium = await Portfolium.deployed();
        const mirrored = await Mirrored.deployed();
        await portfolium.updateAllocation(mirrored.address, mirroredAlloc, { from: accounts[3] });

        const assetAlloc = await portfolium.portfolioAssetAllocations.call(accounts[3], mirrored.address);
        assert.equal(
            assetAlloc.perShareAmount.toNumber(),
            mirroredAlloc,
            "Allocation was not updated correctly"
        );
    });

    it("another user should buy shares from a portfolio", async () => {
        const portfolium = await Portfolium.deployed();
        const reserve = await Reserve.deployed();
        const mirrored = await Mirrored.deployed();
        const treasury = await Treasury.deployed();
        const buyer = accounts[6];
        const portfolio = accounts[3];

        const cost = (await portfolium.calculateBuyingCost(portfolio, amountToBuy)).toNumber();
        await portfolium.buyShares(portfolio, amountToBuy, { from: buyer, value: cost });

        const balance = await portfolium.portfolioBalanceOf.call(portfolio, buyer);
        assert.equal(
            balance.toNumber(),
            amountToBuy,
            "Balance is incorrect"
        );

        const reserveBalance = await web3.eth.getBalance(reserve.address);
        assert.equal(
            reserveBalance,
            (mirroredCommission) + (platformCommission) + (amountToBuy * mirroredAlloc * tokenPrice),
            "Reserve balance incorrect"
        );

        const tresuryBalance = await mirrored.balanceOf.call(treasury.address);
        assert.equal(
            tresuryBalance.toNumber(),
            amountToBuy * mirroredAlloc,
            "Treasury mirrored balance incorrect"
        );

        const userAssetBalance = await treasury.getBalanceOf(buyer, mirrored.address);
        assert.equal(
            userAssetBalance,
            amountToBuy * mirroredAlloc,
            "User asset balance incorrect"
        );

        const userNativeBalance = await treasury.getBalanceOf(buyer, "0x0000000000000000000000000000000000000001");
        assert.equal(
            userNativeBalance.toNumber(),
            0,
            "Native balance should be 0"
        );
    });

    it("another user should sell shares from a portfolio", async () => {
        const portfolium = await Portfolium.deployed();
        const reserve = await Reserve.deployed();
        const mirrored = await Mirrored.deployed();
        const treasury = await Treasury.deployed();
        const buyer = accounts[6];
        const portfolio = accounts[3];
        await portfolium.sellShares(portfolio, amountToSell, { from: buyer, value: platformCommission });

        const balance = await portfolium.portfolioBalanceOf.call(portfolio, buyer);
        assert.equal(
            balance.toNumber(),
            amountRemaining,
            "Balance is incorrect"
        );

        const reserveBalance = await web3.eth.getBalance(reserve.address);
        assert.equal(
            reserveBalance,
            (2 * mirroredCommission) + (2 * platformCommission) + (amountRemaining * mirroredAlloc * tokenPrice),
            "Reserve balance incorrect"
        );

        const tresuryBalance = await mirrored.balanceOf.call(treasury.address);
        assert.equal(
            tresuryBalance.toNumber(),
            amountRemaining * mirroredAlloc,
            "Treasury mirrored balance incorrect"
        );

        const userAssetBalance = await treasury.getBalanceOf(buyer, mirrored.address);
        assert.equal(
            userAssetBalance,
            amountRemaining * mirroredAlloc,
            "User asset balance incorrect"
        );

        const userNativeBalance = await treasury.getBalanceOf(buyer, "0x0000000000000000000000000000000000000001");
        assert.equal(
            userNativeBalance.toNumber(),
            0,
            "Native balance should be 0"
        );
    });
});
