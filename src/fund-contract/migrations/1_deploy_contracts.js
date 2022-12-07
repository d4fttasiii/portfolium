const Treasury = artifacts.require("./Treasury.sol");
const Oracle = artifacts.require("./Oracle.sol");
const Portfolium = artifacts.require("./Portfolium.sol");
const Reserve = artifacts.require("./Reserve.sol");
const Mirrored = artifacts.require("./Mirrored.sol");

module.exports = async (deployer, network, accounts) => {
  const applicationAddress = accounts[1];
  const uniswapAddress = "0xc165449713452E86aF36dC681a1C7C92eAE9c3b3";

  await deployer.deploy(Reserve);
  await deployer.deploy(Treasury, uniswapAddress);
  await deployer.deploy(Oracle, applicationAddress);

  // Mirrored
  await deployer.deploy(
    Mirrored,
    Oracle.address,
    Reserve.address,
    1000000000,
    "Netflix, Inc.",
    "mNFLX",
    2
  );

  // Portolium
  await deployer.deploy(
    Portfolium,
    Oracle.address,
    Treasury.address,
    Reserve.address,
    10000,
    "Polygon",
    "MATIC",
    18
  );

  // Set portfolium address in treasury
  const treasury = await Treasury.deployed();
  // await treasury.setFundAddress(Portfolium.address);

  console.log(`portfolium: "${Portfolium.address}",`);
  console.log(`oracle: "${Oracle.address}",`);
  console.log(`treasury: "${Treasury.address}",`);
  console.log(`reserve: "${Reserve.address}",`);
};
