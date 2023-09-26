import "dotenv/config";
import "@nomicfoundation/hardhat-toolbox";
/** @type import('hardhat/config').HardhatUserConfig */

export default {
  solidity: "0.8.19",
  networks: {
    ethtest: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env,
  },
};
