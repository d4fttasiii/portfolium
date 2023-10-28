const PortfoliumGuard = artifacts.require("./PortfoliumGuard.sol");

module.exports = async (deployer, network, accounts) => {
  const signer2 = (network === "development") ? accounts[1] : "0x54BB9caA37442C95300adD5D719C537d82DC8Cd9";
  const quorum = 2;

  await deployer.deploy(PortfoliumGuard, [signer2], quorum);
}
