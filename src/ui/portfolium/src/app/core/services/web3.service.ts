// src/app/services/wallet.service.ts
import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { BehaviorSubject } from 'rxjs';

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private web3: Web3;
  account = new BehaviorSubject<string | null>(null);
  network = new BehaviorSubject<string>('');

  constructor() {
    if (window.ethereum) {
      this.web3 = new Web3(window.ethereum);
      this.listenForAccountChange();
      this.listenForNetworkChange();
    } else {
      console.error('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  async connectAccount(): Promise<void> {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.account.next(await this.getCurrentAccount());
      this.network.next(await this.getCurrentNetwork());
    } catch (error) {
      console.error('User denied account access', error);
    }
  }

  private async getCurrentAccount(): Promise<string> {
    const accounts = await this.web3.eth.getAccounts();
    return accounts[0];
  }

  private async getCurrentNetwork(): Promise<string> {
    const networkId = await this.web3.eth.net.getId();
    switch (networkId.toString()) {
      case '1':
        return 'Ethereum Mainnet';
      case '137':
        return 'Polygon Mainnet';
      case '1337':
        return 'Local';
      default:
        return 'Unknown';
    }
  }

  private listenForAccountChange() {
    window.ethereum.on('accountsChanged', async (accounts: string[]) => {
      this.account.next(accounts.length === 0 ? null : accounts[0]);
    });
  }

  private listenForNetworkChange() {
    window.ethereum.on('chainChanged', async (chainId: number) => {
      window.location.reload();
    });
  }
}
