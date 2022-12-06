const Oracle = artifacts.require("Oracle");
const web3 = require('web3');

const nativeAccount = new web3().eth.accounts.create();

contract("Oracle", (accounts) => {
    it("should set default addresses correctly", async () => {
        const oracleInstance = await Oracle.deployed();
        const ownerAddress = await oracleInstance.ownerAddress.call();
        const trustedAccount = await oracleInstance.trustedAccounts.call(accounts[1]);

        assert.equal(
            ownerAddress,
            accounts[0],
            "Deployer is not the owner"
        );

        assert.equal(
            trustedAccount,
            true,
            "Initial trusted account is not set correctly"
        );
    });

    it("should set price for asset by application address", async () => {
        const oracleInstance = await Oracle.deployed();

        await oracleInstance
            .setPrice(nativeAccount.address, 1337, { from: accounts[1] });

        const nativePrice = await oracleInstance
            .getPrice(nativeAccount.address);

        assert.equal(nativePrice[0], 1337, "Price was not set for: " + nativeAccount.address);
    });

    it("should not be able to set price for asset", async () => {
        const oracleInstance = await Oracle.deployed();

        try {
            await oracleInstance
                .setPrice
                .call(nativeAccount.address, 1, { from: accounts[9] });
        }
        catch (err) {
            assert.equal(
                err.message.includes("Caller must be a trusted account!"),
                true,
                "Non-application address can call setPrice"
            );
        }
    });
});
