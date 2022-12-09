const Oracle = artifacts.require("Oracle");
const Mirrored = artifacts.require("Mirrored");

const mirroredCommission = 1000;
const mirroredPrice = 1337;

contract("Oracle", (accounts) => {
    before(async () => {
        const oracle = await Oracle.deployed();
        const mirrored = await Mirrored.deployed();

        await oracle.setAssetTypeMirrored(mirrored.address, { from: accounts[1] });
        await mirrored.updateCommission(mirroredCommission);
    });

    it("should not exceed max contract size of 24.576KB", async () => {
        const instance = await Oracle.deployed();
        var bytecode = instance.constructor._json.bytecode;
        
        assert.isAtMost(
            bytecode.length / 2,
            24576,
            "Max contract size exceeded"
        )
    });

    it("should set default addresses correctly", async () => {
        const oracleInstance = await Oracle.deployed();
        const ownerAddress = await oracleInstance.ownerAddress.call();
        const trustedAccount1 = await oracleInstance.trustedAccounts.call(accounts[0]);
        const trustedAccount2 = await oracleInstance.trustedAccounts.call(accounts[1]);

        assert.equal(
            ownerAddress,
            accounts[0],
            "Deployer is not the owner"
        );

        assert.equal(
            trustedAccount1,
            true,
            "Initial trusted account is not set correctly"
        );

        assert.equal(
            trustedAccount2,
            true,
            "Initial trusted account is not set correctly"
        );
    });

    it("should set price for asset by application address", async () => {
        const oracle = await Oracle.deployed();
        const mirrored = await Mirrored.deployed();

        await oracle
            .setPrice(mirrored.address, mirroredPrice, { from: accounts[1] });

        const price = await oracle.getPrice(mirrored.address);
        assert.equal(
            price[0],
            mirroredPrice,
            "Price was not set for: " + mirrored.address
        );
    });

    it("should not be able to set price for asset", async () => {
        const oracle = await Oracle.deployed();
        const mirrored = await Mirrored.deployed();

        try {
            await oracle.setPrice(mirrored.address, mirroredPrice, {
                from: accounts[9]
            });
        }
        catch (err) {
            assert.equal(
                err.message.includes("Caller must be a trusted account!"),
                true,
                "Non-application address can call setPrice"
            );
        }
    });

    it("should calculate buying cost for mirrored", async () => {
        const oracle = await Oracle.deployed();
        const mirrored = await Mirrored.deployed();
        const amount = 15;

        const totalCost = await oracle.getBuyingCost(mirrored.address, amount);
        assert.equal(
            totalCost,
            (mirroredPrice * amount) + mirroredCommission,
            "Buying cost calculated incorrectly"
        );
    });

    it("should calculate payout amount for mirrored", async () => {
        const oracle = await Oracle.deployed();
        const mirrored = await Mirrored.deployed();
        const amount = 15;

        const payoutAmount = await oracle.getPayoutAmount(mirrored.address, amount);
        assert.equal(
            payoutAmount,
            (mirroredPrice * amount) - mirroredCommission,
            "Payout amount calculated incorrectly"
        );
    });
});
