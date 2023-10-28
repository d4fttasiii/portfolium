const PortfoliumGuard = artifacts.require("./PortfoliumGuard.sol");
const PortfoliumTokenStore = artifacts.require("./PortfoliumTokenStore.sol");

module.exports = async (deployer, network, accounts) => {
    const guard = await PortfoliumGuard.deployed();

    // Deploy token store
    await deployer.deploy(PortfoliumTokenStore, guard.address);
}
