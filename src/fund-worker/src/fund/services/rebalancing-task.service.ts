import { FUND } from '@core/abis/fund';
import { ORACLE } from '@core/abis';
import { Asset, AssetTypes } from '@core/models/asset';
import { ContractConfig, Web3Config } from '@core/models/config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import BN from 'bn.js';
import Web3 from 'web3';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RebalancingTaskService {
  private readonly maxWeight: number = 10000;
  private readonly applicationAddress: string;
  private readonly applicationPrivateKey: string;
  private readonly oracleAddress: string;
  private readonly fundAddress: string;
  private readonly url: string;

  constructor(private configService: ConfigService) {
    const contractConfig = this.configService.get<ContractConfig>('contract');
    const web3Config = this.configService.get<Web3Config>('web3');
    this.applicationAddress = contractConfig.applicationAddress;
    this.applicationPrivateKey = contractConfig.applicationPrivateKey;
    this.oracleAddress = contractConfig.oracle;
    this.fundAddress = contractConfig.fund;
    this.url = web3Config.url;
  }

  @Cron('*/30 * * * * *')
  async handleCron() {
    const assets = await this.getAssets();
    const updatedAssets: Asset[] = [];
    const fundValue = (await this.getFundValue()) || 1;
    const shareCount = (await this.getShareCount()) || 1;
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const treasuryHolding = this.calculateRequiredTreasuryHolding(
        fundValue,
        asset.price,
        asset.weight,
      );
      const perShareAmount = treasuryHolding / shareCount;
      const adjustedPerShareAmount = new BN(
        Math.floor(perShareAmount * Math.pow(10, asset.decimals)).toString(),
      );
      const comparison = adjustedPerShareAmount.cmp(asset.amountPerShare);

      console.log(`${asset.name}:`, {
        weight: asset.weight,
        old: asset.amountPerShare.toString(),
        new: adjustedPerShareAmount.toString(),
        comp: comparison,
      });

      if (comparison === 0) {
        console.log(`${asset.name} skipped.`);
        continue;
      }
      if (comparison === -1) {
        updatedAssets.unshift({
          address: asset.address,
          amountPerShare: adjustedPerShareAmount,
          assetType: asset.assetType,
        });
      } else if (comparison === 1) {
        updatedAssets.push({
          address: asset.address,
          amountPerShare: adjustedPerShareAmount,
          assetType: asset.assetType,
        });
      }
    }

    await this.updatePerShareAmounts(updatedAssets);
  }

  private calculateRequiredTreasuryHolding(
    fundValue: number,
    price: number,
    weight: number,
  ) {
    return ((weight / this.maxWeight) * fundValue) / price;
  }

  private async updatePerShareAmounts(assets: Asset[]) {
    const web3 = new Web3(this.url);
    const contract = new web3.eth.Contract(FUND, this.fundAddress);

    const encodedABI = contract.methods
      .updateMultipleAllocations(
        assets.map((a) => {
          return {
            assetAddress: a.address,
            perShareAmount: a.amountPerShare.toString(),
          };
        }),
      )
      .encodeABI();

    const tx = {
      from: this.applicationAddress,
      to: this.fundAddress,
      gas: 2000000,
      data: encodedABI,
    };

    try {
      const gas = await web3.eth.estimateGas(tx);
      tx.gas = Math.floor(gas * 1.05);
    } catch (error) {
      console.log('Error gas estimation', error);
    }

    const signedTx = await web3.eth.accounts.signTransaction(
      tx,
      this.applicationPrivateKey,
    );

    await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  }

  private async getAssets(): Promise<Asset[]> {
    const web3 = new Web3(this.url);
    const fundContract = new web3.eth.Contract(FUND, this.fundAddress);
    const assetCount = parseInt(
      await fundContract.methods.assetCount().call(),
      10,
    );
    const assets: Asset[] = [];
    for (let i = 0; i < assetCount; i++) {
      const address = await fundContract.methods.assetAddresses(i).call();
      const asset = await fundContract.methods.assets(address).call();
      const price = await this.getAssetPrice(address);
      const amountPerShare = new BN(asset[4]);
      assets.push({
        address: asset[0],
        name: asset[1],
        symbol: asset[2],
        price: price,
        decimals: parseInt(asset[3], 10),
        amountPerShare: amountPerShare,
        assetType: parseInt(asset[5], 10) as AssetTypes,
        weight: parseInt(asset[6], 10),
      });
    }

    return assets;
  }

  private async getFundValue(): Promise<number> {
    const web3 = new Web3(this.url);
    const contract = new web3.eth.Contract(FUND, this.fundAddress);
    const value = await contract.methods.getFundValue().call();

    return parseFloat(web3.utils.fromWei(value, 'ether'));
  }

  private async getAssetPrice(assetAddress: string): Promise<number> {
    const web3 = new Web3(this.url);
    const contract = new web3.eth.Contract(ORACLE, this.oracleAddress);
    const price = await contract.methods.getPrice(assetAddress).call();

    return parseFloat(web3.utils.fromWei(price[0], 'ether'));
  }

  private async getShareCount(): Promise<number> {
    const web3 = new Web3(this.url);
    const contract = new web3.eth.Contract(FUND, this.fundAddress);
    const totalSupply = await contract.methods.totalSupply().call();

    return parseInt(totalSupply, 10);
  }
}
