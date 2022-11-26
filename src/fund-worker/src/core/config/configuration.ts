import { Config } from '../models/config';

export const FundyConfig = (): Config => ({
  app: {
    port: process.env.FUNDY_APP_PORT
      ? parseInt(process.env.FUNDY_APP_PORT, 10)
      : 3000,
  },
  web3: {
    url: process.env.FUNDY_WEB3_NODE_URL || 'https://polygon-rpc.com',
  },
  mongoDb: {
    endpoint:
      process.env.FUNDY_MONGODB_ENDPOINT ||
      'mongodb://mongo:mongo@localhost:27017',
    ssl: process.env.FUNDY_MONGODB_SSL == 'true',
    dbName: process.env.FUNDY_MONGODB_DB_NAME || 'fundy',
  },
  redis: {
    host: process.env.FUNDY_REDIS_URL || 'localhost',
    port: process.env.FUNDY_REDIS_PORT
      ? parseInt(process.env.FUNDY_REDIS_PORT, 10)
      : 6379,
    password: process.env.FUNDY_REDIS_PASSWORD,
  },
  contract: {
    fund:
      process.env.FUNDY_FUND_CONTRACT_ADDRESS ||
      '0x0A8E2beC4f2251869C49b64Ae0984b2f26bEEd5b',
    oracle:
      process.env.FUNDY_FUND_ORACLE_ADDRESS ||
      '0x1cb4F469EA63B4CbA568fcCF99e96A4D1cdB11dE',
    treasury:
      process.env.FUNDY_FUND_TREASURY_ADDRESS ||
      '0xD926a01717Bc704d450038155DF658a35dc0f72E',
    applicationPrivateKey:
      process.env.FUNDY_FUND_APPLICATION_PK ||
      '0x3a46f3fb16dcedaae30ece3cd1e6dca7df088393522a11ead8ccc6013ff9263a',
    applicationAddress:
      process.env.FUNDY_FUND_APPLICATION_ADDRESS ||
      '0xe317468EFBE96d559AC61C5bA8cD2a6690A9f90A',
  },
});
