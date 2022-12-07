const Mirrored = artifacts.require("Mirrored");
const Oracle = artifacts.require("Oracle");
const Reserve = artifacts.require("Reserve");
const web3 = require('web3');

const tokenPrice = 13370000000;
const commission = 1000000000;

contract("Mirrored", (accounts) => {
    before(async () => {
        const oracle = await Oracle.deployed();
        const mirrored = await Mirrored.deployed();
        const reserve = await Reserve.deployed();

        await oracle.setPrice(mirrored.address, tokenPrice, { from: accounts[1] });
        await reserve.addAccount(mirrored.address);
    });


    it("should set default addresses correctly", async () => {
        const mirrored = await Mirrored.deployed();
        const ownerAddress = await mirrored.ownerAddress.call();

        assert.equal(
            ownerAddress,
            accounts[0],
            "Deployer is not the owner"
        );
    });

    it("should mint and burn 10 tokens", async () => {
        const mirrored = await Mirrored.deployed();
        await mirrored.mint(10, { from: accounts[5], value: 10 * tokenPrice + commission });

        const balance = await mirrored.balanceOf.call(accounts[5]);
        assert.equal(
            balance.toNumber(),
            10,
            "Balance doesn't match"
        );
    });

    it("should burn 10 tokens", async () => {
        const mirrored = await Mirrored.deployed();
        await mirrored.burn(10, { from: accounts[5] });

        const balance = await mirrored.balanceOf.call(accounts[5]);
        assert.equal(
            balance.toNumber(),
            0,
            "Balance doesn't match"
        );
    });
});
