const Treasury = artifacts.require("./Treasury.sol");
const Oracle = artifacts.require("./Oracle.sol");
const Synthetic = artifacts.require("./Synthetic.sol");
const Fund = artifacts.require("./Fund.sol");
const Reserve = artifacts.require("./Reserve.sol");
const Mirrored = artifacts.require("./Mirrored.sol");

module.exports = async (deployer, network, accounts) => {
  const managerAddress = accounts[0];
  const applicationAddress = accounts[1];
  const uniswapAddress = "0xc165449713452E86aF36dC681a1C7C92eAE9c3b3";

  await deployer.deploy(Reserve);
  await deployer.deploy(Treasury, uniswapAddress);
  await deployer.deploy(Oracle, applicationAddress);

  // Synthetics
  await deployer.deploy(
    Synthetic,
    Oracle.address,
    Treasury.address,
    applicationAddress,
    "D4FT Hodling",
    "1337",
    "1337",
    "Tesla, Inc.",
    "synTSLA",
    0
  );
  await deployer.deploy(
    Synthetic,
    Oracle.address,
    Treasury.address,
    applicationAddress,
    "D4FT Hodling",
    "1337",
    "1337",
    "Advanced Micro Devices, Inc.",
    "synAMD",
    3
  );

  // Mirrored
  await deployer.deploy(
    Mirrored,
    Oracle.address,
    Reserve.address,
    1000000000,
    "Netflix, Inc.",
    "synNFLX",
    2
  );  
  await deployer.deploy(
    Mirrored,
    Oracle.address,
    Reserve.address,
    1000000000,
    "NVIDIA Corporation",
    "synNVDA",
    1
  );

  // Fund
  await deployer.deploy(
    Fund,
    Oracle.address,
    Treasury.address,
    Reserve.address,
    managerAddress,
    applicationAddress,
    "Enceladus",
    "ENCE",
    "Polygon",
    "MATIC"
  );

  // Set fund address in treasury
  const treasury = await Treasury.deployed();
  await treasury.setFundAddress(Fund.address);

  console.log(`fund: "${Fund.address}",`);
  console.log(`oracle: "${Oracle.address}",`);
  console.log(`treasury: "${Treasury.address}",`);
  console.log(`reserve: "${Reserve.address}",`);
};
