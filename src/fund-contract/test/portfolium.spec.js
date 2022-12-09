const Treasury = artifacts.require("Treasury");
const Mirrored = artifacts.require("Mirrored");
const Oracle = artifacts.require("Oracle");
const Portfolium = artifacts.require("Portfolium");
const Reserve = artifacts.require("Reserve");
const Web3 = require('web3');

const tokenPrice = 5000;
const mirroredCommission = 1000;
const tokenAlloc = 10;

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
        const commission = await portfolium.platformCommission.call();
        await portfolium.createPortfolio("Sh1tFoli0", "SHT", 1000, { from: accounts[3], value: commission });

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
        await portfolium.updateAllocation(mirrored.address, tokenAlloc, { from: accounts[3] });

        const assetAlloc = await portfolium.portfolioAssetAllocations.call(accounts[3], mirrored.address);
        assert.equal(
            assetAlloc.perShareAmount.toNumber(),
            10,
            "Allocation was not updated correctly"
        );
    });

    it("another user should buy shares from a portfolio", async () => {
        const portfolium = await Portfolium.deployed();
        const tokensToBuy = 5;
        const cost = (await portfolium.calculateBuyingCost(accounts[3], tokensToBuy)).toNumber();

        await portfolium.buyShares(accounts[3], tokensToBuy, { from: accounts[6], value: cost });

        const balance = await portfolium.portfolioBalanceOf.call(accounts[3], accounts[6]);
        assert.equal(
            balance.toNumber(),
            5,
            "Balance is incorrect"
        );
    });

    it("another user should sell shares from a portfolio", async () => {
        const portfolium = await Portfolium.deployed();
        const reserve = await Reserve.deployed();
        const platformCommission = (await portfolium.platformCommission.call()).toNumber();
        await portfolium.sellShares(accounts[3], 3, { from: accounts[6], value: platformCommission });

        const balance = await portfolium.portfolioBalanceOf.call(accounts[3], accounts[6]);
        assert.equal(
            balance.toNumber(),
            2,
            "Balance is incorrect"
        );

        const reserveBalance = await new Web3(new Web3.providers.HttpProvider('http://localhost:8545')).eth.getBalance(reserve.address);
        assert.equal(
            reserveBalance,
            (2 * mirroredCommission) + (2 * platformCommission) + (2 * tokenAlloc * tokenPrice),
            "Reserve balance incorrect"
        );
    });
});
