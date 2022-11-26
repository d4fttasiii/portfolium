import { SYNTHETIC } from './../../core/abis/synthetic';
import { FUND } from './../../core/abis/fund';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { ContractConfig, Web3Config } from '@core/models/config';
import Web3 from 'web3';

@Injectable()
export class OrderTaskService {
  private applicationAddress: string;
  private applicationPrivateKey: string;
  private url: string;
  private fundAddress: string;

  constructor(private configService: ConfigService) {
    const contractConfig = this.configService.get<ContractConfig>('contract');
    const web3Config = this.configService.get<Web3Config>('web3');
    this.fundAddress = contractConfig.fund;
    this.applicationAddress = contractConfig.applicationAddress;
    this.applicationPrivateKey = contractConfig.applicationPrivateKey;
    this.url = web3Config.url;
  }

  async startOrderEventMonitoring() {
    const web3 = new Web3(
      new Web3.providers.WebsocketProvider(this.url, {
        reconnect: {
          auto: true,
        },
      }),
    );
    const contract = new web3.eth.Contract(FUND, this.fundAddress);
    const assetCount = parseInt(await contract.methods.assetCount().call(), 10);
    for (let i = 1; i < assetCount; i++) {
      const address = await contract.methods.assetAddresses(i).call();
      const syntheticContract = new web3.eth.Contract(SYNTHETIC, address);
      syntheticContract.events.NewBuyOrder({}, async (_, event) => {
        const orderIndex = parseInt(event.returnValues[0], 10);
        console.log('BuyOrder received', address, orderIndex);
        await this.sleep(5000);
        await this.setBuyOrderCompleted(address, orderIndex);
        console.log('BuyOrder executed', address, orderIndex);
      });

      syntheticContract.events.NewSellOrder({}, async (_, event) => {
        const orderIndex = parseInt(event.returnValues[0], 10);
        console.log('SellOrder received', address, orderIndex);
        await this.sleep(5000);
        await this.setSellOrderCompleted(address, orderIndex);
        console.log('SellOrder executed', address, orderIndex);
      });
    }
  }

  private async setBuyOrderCompleted(address: string, orderIndex: number) {
    try {
      const web3 = new Web3(this.url);
      const syntheticContract = new web3.eth.Contract(SYNTHETIC, address);
      const encodedABI = syntheticContract.methods
        .buyOrderCompleted(orderIndex)
        .encodeABI();
      const tx = {
        from: this.applicationAddress,
        to: address,
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
    } catch (error) {
      console.error(error);
    }
  }

  private async setSellOrderCompleted(address: string, orderIndex: number) {
    try {
      const web3 = new Web3(this.url);
      const syntheticContract = new web3.eth.Contract(SYNTHETIC, address);
      const encodedABI = syntheticContract.methods
        .sellOrderCompleted(orderIndex)
        .encodeABI();
      const tx = {
        from: this.applicationAddress,
        to: address,
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
    } catch (error) {
      console.error(error);
    }
  }

  private sleep(delay: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
