import { FUND } from '@core/abis/fund';
import { ORACLE } from '@core/abis/oracle';
import { Asset, AssetTypes } from '@core/models/asset';
import { ContractConfig, Web3Config } from '@core/models/config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import BN from 'bn.js';
import Web3 from 'web3';

@Injectable()
export class OracleTaskService {
  private applicationAddress: string;
  private applicationPrivateKey: string;
  private oracleAddress: string;
  private fundAddress: string;
  private url: string;

  constructor(private configService: ConfigService) {
    const contractConfig = this.configService.get<ContractConfig>('contract');
    const web3Config = this.configService.get<Web3Config>('web3');
    this.oracleAddress = contractConfig.oracle;
    this.fundAddress = contractConfig.fund;
    this.applicationAddress = contractConfig.applicationAddress;
    this.applicationPrivateKey = contractConfig.applicationPrivateKey;
    this.url = web3Config.url;
  }

  @Cron('*/2 * * * *')
  async handleCron() {
    console.log('Updating prices!');
    const assets = await this.getRelevantAssets();
    for (let i = 0; i < assets.length; i++) {
      try {
        const asset = assets[i];
        const price = await this.getRemoteAssetPrice(asset);
        await this.setAssetPrice(
          asset.address,
          new BN(Web3.utils.toWei(price.toString().substring(0, 8), 'ether')),
        );
      } catch (error) {
        console.error(error);
      }
    }
  }

  private async getRemoteAssetPrice(asset: Asset): Promise<number> {
    // TODO: Replace with actual API call to get price
    return 0.001;
  }

  private async setAssetPrice(assetAddress: string, price: BN) {
    const web3 = new Web3(this.url);
    const contract = new web3.eth.Contract(ORACLE, this.oracleAddress);

    const encodedABI = contract.methods
      .setPrice(assetAddress, price)
      .encodeABI();

    const tx = {
      from: this.applicationAddress,
      to: this.oracleAddress,
      gas: 200000,
      data: encodedABI,
    };

    const gas = await web3.eth.estimateGas(tx);
    tx.gas = Math.floor(gas * 1.05);

    const signedTx = await web3.eth.accounts.signTransaction(
      tx,
      this.applicationPrivateKey,
    );

    await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`Asset: ${assetAddress} price is: ${price}`);
  }

  private async getRelevantAssets(): Promise<Asset[]> {
    const web3 = new Web3(this.url);
    const fundContract = new web3.eth.Contract(FUND, this.fundAddress);
    const oracleContract = new web3.eth.Contract(ORACLE, this.oracleAddress);

    const assetCount = parseInt(
      await fundContract.methods.assetCount().call(),
      10,
    );
    const assets: Asset[] = [];
    for (let i = 0; i < assetCount; i++) {
      const address = await fundContract.methods.assetAddresses(i).call();
      const assetPriceOrigin = parseInt(await oracleContract.methods.assetPriceOrigin(address).call(), 10);
      if (assetPriceOrigin > 0) {
        continue;
      }

      const assetRawData = await fundContract.methods.assets(address).call();
      const asset: Asset = {
        address: address,
        assetType: parseInt(assetRawData[5], 10),
        weight: parseInt(assetRawData[6], 10),
      }

      if (asset.assetType !== AssetTypes.Native) {
        assets.push(asset);
      }
    }

    return assets;
  }
}
