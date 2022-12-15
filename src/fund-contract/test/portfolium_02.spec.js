const Treasury = artifacts.require("Treasury");
const Mirrored = artifacts.require("Mirrored");
const Oracle = artifacts.require("Oracle");
const Portfolium = artifacts.require("Portfolium");
const Reserve = artifacts.require("Reserve");
const Web3 = require('web3');

const amountToBuy = 15;
const tokenPrice = 5000;
const mirroredCommission = 1000;
const platformCommission = 10000;
const mirroredAlloc = 10;
const nativeAddress = "0x0000000000000000000000000000000000000001";
const nativeAlloc = 1000000000;
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

contract("Portfolium 02", (accounts) => {
    const portfolioOwner = accounts[3];

    before(async () => {
        const oracle = await Oracle.deployed();
        const mirrored = await Mirrored.deployed();
        const treasury = await Treasury.deployed();
        const portfolium = await Portfolium.deployed();
        const reserve = await Reserve.deployed();

        // Mirorred setup
        await oracle.setPrice(mirrored.address, tokenPrice, { from: accounts[1] });
        await oracle.setAssetTypeMirrored(mirrored.address, { from: accounts[1] });
        await mirrored.updateCommission(mirroredCommission);
        await reserve.addAccount(mirrored.address);

        // Portfolium setup
        await treasury.setPortfoliumAddress(portfolium.address);
        await portfolium.addSupportedMirroredAsset(mirrored.address);
        await portfolium.updatePlatformCommission(platformCommission);

        // Configuring portfolio
        await portfolium.createPortfolio("Sh1tFoli0", "SHT", 1000, { from: portfolioOwner, value: platformCommission });
        await portfolium.addAsset(mirrored.address, { from: portfolioOwner });
        await portfolium.updateAllocation(mirrored.address, mirroredAlloc, { from: portfolioOwner });
        await portfolium.updateAllocation(nativeAddress, nativeAlloc, { from: portfolioOwner });
    });

    it("should reduce native alloc and increase mirrored alloc", async () => {
        const portfolium = await Portfolium.deployed();
        const mirrored = await Mirrored.deployed();

        // Buying
        const cost = (await portfolium.calculateBuyingCost(portfolioOwner, amountToBuy)).toNumber();
        await portfolium.buyShares(portfolioOwner, amountToBuy, { from: portfolioOwner, value: cost });

        // Rebalancing
        await portfolium.updateAllocation(nativeAddress, nativeAlloc / 2, { from: portfolioOwner });
        let newAlloc = await portfolium.portfolioAssetAllocations.call(portfolioOwner, nativeAddress);
        assert.equal(
            newAlloc.perShareAmount.toNumber(),
            nativeAlloc / 2,
            "Native allocation incorrect"
        );

        const totalSupply = amountToBuy;
        const nativeFreedUp = (newAlloc.perShareAmount.toNumber() * totalSupply);
        const spendable = nativeFreedUp - mirroredCommission;
        const newMirroredAlloc = Math.floor(spendable / tokenPrice / totalSupply);

        await portfolium.updateAllocation(mirrored.address, newMirroredAlloc, { from: portfolioOwner });
        newAlloc = await portfolium.portfolioAssetAllocations.call(portfolioOwner, mirrored.address);
        assert.equal(
            newAlloc.perShareAmount.toNumber(),
            newMirroredAlloc,
            "Mirrored allocation incorrect"
        );
    });
});
