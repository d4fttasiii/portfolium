import { FUND, ORACLE } from '@core/abis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';

@Injectable()
export class EventIndexerService {
  private url: string;
  private fundAddress: string;

  constructor(private configService: ConfigService) {
    this.url = this.configService.get<string>('web3.url');
    this.fundAddress = this.configService.get<string>('contract.fund');
  }

  async listenForBuyShareEvents() {
    const web3 = new Web3(this.url);
    const contract = new web3.eth.Contract(FUND, this.fundAddress);

    contract.events.ShareBought().on('data', (event: any) => {
      const returnValues = event.returnValues;
      const shareholder = returnValues[0];
      const shares = parseInt(returnValues[1], 10);
      console.log('Shares purchased!', shareholder, shares);
    });
  }
}
