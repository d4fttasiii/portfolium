const Oracle = artifacts.require("Oracle");

contract("Oracle", (accounts) => {
    it("should set default addresses correctly", async () => {
        const oracleInstance = await Oracle.deployed();
        const ownerAddress = await oracleInstance.ownerAddress.call();
        const applicationAddress = await oracleInstance.applicationAddress.call();

        assert.equal(
            ownerAddress,
            accounts[0],
            "Deployer is not the owner"
        );

        assert.equal(
            applicationAddress,
            accounts[1],
            "Application address is not set correctly"
        );
    });

    it("should set price for native asset by application address", async () => {
        const oracleInstance = await Oracle.deployed();
        const nativeAssetAddress = "0x0000000000000000000000000000000000000001";

        await oracleInstance
            .setPrice
            .call(nativeAssetAddress, 1, { from: accounts[1] });

        const nativePrice = await oracleInstance
            .getPrice
            .call(nativeAssetAddress);

        assert.equal(nativePrice[0], 1, "Native price is not set");
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
                err.message.includes("revert Caller must be the application account!"),
                true,
                "Non-application address can call setPrice"
            );
        }
    });


    //   it("should send coin correctly", async () => {
    //     const metaCoinInstance = await MetaCoin.deployed();

    //     // Setup 2 accounts.
    //     const accountOne = accounts[0];
    //     const accountTwo = accounts[1];

    //     // Get initial balances of first and second account.
    //     const accountOneStartingBalance = (
    //       await metaCoinInstance.getBalance.call(accountOne)
    //     ).toNumber();
    //     const accountTwoStartingBalance = (
    //       await metaCoinInstance.getBalance.call(accountTwo)
    //     ).toNumber();

    //     // Make transaction from first account to second.
    //     const amount = 10;
    //     await metaCoinInstance.sendCoin(accountTwo, amount, { from: accountOne });

    //     // Get balances of first and second account after the transactions.
    //     const accountOneEndingBalance = (
    //       await metaCoinInstance.getBalance.call(accountOne)
    //     ).toNumber();
    //     const accountTwoEndingBalance = (
    //       await metaCoinInstance.getBalance.call(accountTwo)
    //     ).toNumber();

    //     assert.equal(
    //       accountOneEndingBalance,
    //       accountOneStartingBalance - amount,
    //       "Amount wasn't correctly taken from the sender"
    //     );
    //     assert.equal(
    //       accountTwoEndingBalance,
    //       accountTwoStartingBalance + amount,
    //       "Amount wasn't correctly sent to the receiver"
    //     );
    //   });
});
