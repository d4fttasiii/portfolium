const Treasury = artifacts.require("Treasury");

contract("Treasury", (accounts) => {
    it("should set default addresses correctly", async () => {
        const treasury = await Treasury.deployed();
        const ownerAddress = await treasury.ownerAddress.call();

        assert.equal(
            ownerAddress,
            accounts[0],
            "Deployer is not the owner"
        );
    });

    it("owner should be able to set portfolium address", async () => {
        const treasury = await Treasury.deployed();

        await treasury.setPortoliumAddress(accounts[9], { from: accounts[0] });
        const portfoliumAddress = await treasury.portfoliumAddress.call();

        assert.equal(
            portfoliumAddress,
            accounts[9],
            "Owner couldn't set portfolium address"
        );
    });
});
