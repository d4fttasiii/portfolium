export interface Config {
  app: AppConfig;
  web3: Web3Config;
  redis: RedisConfig;
  mongoDb: MongoDbConfig;
  contract: ContractConfig;
}

export interface MongoDbConfig {
  endpoint: string;
  dbName: string;
  ssl: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface Web3Config {
  url: string;
}

export interface AppConfig {
  port: number;
}

export interface ContractConfig {
  fund: string;
  oracle: string;
  treasury: string;
  applicationPrivateKey: string;
  applicationAddress: string;
}
