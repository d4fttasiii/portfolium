const Oracle = artifacts.require("Oracle");

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

    it("should set price for native asset by application address", async () => {
        const oracleInstance = await Oracle.deployed();
        const nativeAssetAddress = "0x0000000000000000000000000000000000000001";

        await oracleInstance
            .setPrice
            .call(nativeAssetAddress, 1337, { from: accounts[1] });

        const nativePrice = await oracleInstance
            .getPrice
            .call(nativeAssetAddress);

        console.log(nativePrice);

        assert.equal(nativePrice[0], 1337, "Native price is not set");
    });

    it("should not be able to set price for native asset", async () => {
        const oracleInstance = await Oracle.deployed();
        const nativeAssetAddress = "0x0000000000000000000000000000000000000001";

        try {
            await oracleInstance
                .setPrice
                .call(nativeAssetAddress, 1, { from: accounts[9] });
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
