const Reserve = artifacts.require("Reserve");
const Web3 = require('web3');

contract("Reserve", (accounts) => {
    it("should set default addresses correctly", async () => {
        const reserve = await Reserve.deployed();
        const ownerAddress = await reserve.ownerAddress.call();

        assert.equal(
            ownerAddress,
            accounts[0],
            "Deployer is not the owner"
        );

        const firstAccessingAccount = await reserve.accessingAccountAddresses.call(0);
        assert.equal(
            firstAccessingAccount,
            accounts[0],
            "First accessing account it not the owner"
        );
    });

    it("should add new accessing account", async () => {
        const reserve = await Reserve.deployed();
        await reserve.addAccount(accounts[5]);

        const accessingAccount = await reserve.accessingAccountAddresses.call(1);
        assert.equal(
            accessingAccount,
            accounts[5],
            "Accessing account is not set correctly"
        );
    });
    
    it("should remove accessing account", async () => {
        const reserve = await Reserve.deployed();
        await reserve.removeAccount(accounts[5]);

        const accessingAccount = await reserve.accessingAccounts.call(accounts[5]);
        assert.equal(
            accessingAccount,
            false,
            "Accessing account was not removed"
        );
    });

    it("should deposit 1 native token", async () => {
        const reserve = await Reserve.deployed();
        await reserve.deposit({ from: accounts[8], value: Math.pow(10, 18) });

        const balance = await new Web3(new Web3.providers.HttpProvider('http://localhost:8545')).eth.getBalance(reserve.address);
        assert(
            balance,
            Math.pow(10, 18),
            "Incorrect balance!"
        );
    });

    it("should withdraw 1000 wei", async () => {
        const reserve = await Reserve.deployed();
        await reserve.withdraw(accounts[0], 1000);

        const balance = await new Web3(new Web3.providers.HttpProvider('http://localhost:8545')).eth.getBalance(reserve.address);        
        assert(
            balance,
            Math.pow(10, 18) - 1000,
            "Incorrect balance!"
        );
    });
});
