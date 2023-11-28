import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { readFileSync } from "fs";

const ownerPrivateKeys = readFileSync(".secret")
  .toString()
  .trim()
  .split(/\r?\n/);

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        mnemonic:
          "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat",
      },
    },
    polygon: {
      chainId: 137,
      url: "https://polygon-rpc.com",
      accounts: ownerPrivateKeys.map((key) => `0x${key}`),
    },
  },
};

export default config;
