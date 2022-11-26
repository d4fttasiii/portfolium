import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BlockchainNetwork } from '@core/models/network';
import { Web3Service } from '@core/services/web3.service';

@Component({
  selector: 'app-wallet-connector',
  templateUrl: './wallet-connector.component.html',
  styleUrls: ['./wallet-connector.component.scss'],
})
export class WalletConnectorComponent implements OnInit {
  authenticated: boolean = false;
  walletAddress: string;
  text: string = 'Connect Wallet';
  networks: BlockchainNetwork[] = [];
  selectedNetwork: string;

  constructor(
    private web3: Web3Service,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard,
  ) {}

  async ngOnInit() {
    this.networks = this.web3.getSupportedNetworks();
    await this.connect();
  }

  async connect() {
    try {
      const response = await this.web3.connectAccount();
      this.walletAddress = response[0];
      this.authenticated = true;
      const length = this.walletAddress.length;
      this.text = `${this.walletAddress.substring(
        0,
        6,
      )}...${this.walletAddress.substring(length - 4)}`;
      const chainId = await this.web3.getNetwork();
      this.setSelectedNetwork(chainId);
    } catch (error) {
      this.restoreDefaults();
    }
  }

  async selectNetwork(network: BlockchainNetwork) {
    try {
      await this.web3.selectNetwork(network);
    } catch (error) {
      await this.web3.addNetwork(network);
    }
    this.selectedNetwork = network.name;
  }

  async setSelectedNetwork(chainId: number) {
    const network = this.networks.find((n) => n.chainId === chainId);
    if (!network) {
      await this.selectNetwork(this.networks[0]);
    } else {
      this.selectedNetwork = network.name;
    }
  }

  copyAddress() {
    this.clipboard.copy(this.walletAddress);
    this.snackBar.open('Address copied!', 'OK', { duration: 2500 });
  }

  disconnect() {
    this.web3.disconnectAccount();
    this.restoreDefaults();
  }

  private restoreDefaults() {
    this.walletAddress = undefined;
    this.authenticated = false;
    this.text = 'Connect Wallet';
  }
}
