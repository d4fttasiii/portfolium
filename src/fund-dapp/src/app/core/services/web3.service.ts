import { Injectable } from '@angular/core';
import { RESERVE } from '@core/abis/reserve';
import { SYNTHETIC } from '@core/abis/synthetic';
import { ORACLEADDRESS, OWNERADDRESS, TREASURYADDRESS } from '@core/constants';
import { AssetAllocation, AssetTypes } from '@core/models/asset-allocation';
import { CachingStorageType } from '@core/models/caching-storage';
import { FundProperties } from '@core/models/fund-properties';
import { MirroredAssetBasics } from '@core/models/mirrored-asset';
import { BlockchainNetwork } from '@core/models/network';
import { OracleAssetSettings } from '@core/models/oracle-asset-settings';
import { PriceOrigin } from '@core/models/price-origin';
import { ShareHolderAccount } from '@core/models/share-holder-account';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { Subject } from 'rxjs';
import Web3 from 'web3';
import { provider } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import Web3Modal from 'web3modal';

import { environment } from '../../../environments/environment';
import { FUND } from '../abis/fund';
import { MIRRORED } from '../abis/mirrored';
import { ORACLE } from '../abis/oracle';
import { TREASURY } from '../abis/treasury';
import { ManagerAccount } from './../models/manager-account';
import { OrderStates, SyntheticAssetBasic, SyntheticAssetOrder } from './../models/synthetic-asset';
import { CachingService } from './caching.service';

@Injectable({
  providedIn: 'root',
})
export class Web3Service {
  public accountsObservable = new Subject<string[]>();
  web3Modal: Web3Modal;
  web3js: Web3;
  provider: provider | undefined;
  accounts: string[] | undefined;
  balance: string | undefined;
  fundContract: Contract;
  oracleContract: Contract;
  treasuryContract: Contract;
  reserveContract: Contract;

  constructor(private cache: CachingService) {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required | here whe import the package necessary to support wallets|| aqui importamos el paquete que nos ayudara a usar soportar distintas wallets
        options: {
          infuraId: 'env', // required change this with your own infura id | cambia esto con tu apikey de infura
          description: 'Scan the qr code and sign in', // You can change the desciption | Puedes camnbiar los textos descriptivos en la seccion description
          qrcodeModalOptions: {
            mobileLinks: [
              'rainbow',
              'metamask',
              'argent',
              'trust',
              'imtoken',
              'pillar',
            ],
          },
        },
      },
      injected: {
        display: {
          logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
          name: 'metamask',
          description: 'Connect with the provider in your Browser',
        },
        package: null,
      },
    };

    this.web3Modal = new Web3Modal({
      network: 'mainnet', // optional change this with the net you want to use like rinkeby etc | puedes cambiar a una red de pruebas o etc
      cacheProvider: true, // optional
      providerOptions, // required
      theme: {
        background: 'rgb(39, 49, 56)',
        main: 'rgb(199, 199, 199)',
        secondary: 'rgb(136, 136, 136)',
        border: 'rgba(195, 195, 195, 0.14)',
        hover: 'rgb(16, 26, 32)',
      },
    });
  }

  getSupportedNetworks(): BlockchainNetwork[] {
    return [
      {
        chainId: 137,
        name: 'Polygon Mainnet',
        blockExplorerUrl: 'https://polygonscan.com/',
        rpcUrl: 'https://polygon-rpc.com',
        native: {
          decimals: 18,
          name: 'Polygon',
          symbol: 'MATIC',
        },
      },
      {
        chainId: 1337,
        name: 'Local',
        blockExplorerUrl: '',
        rpcUrl: 'http://127.0.0.1:8545',
        native: {
          decimals: 18,
          name: 'Polygon',
          symbol: 'MATIC',
        },
      },
    ];
  }

  async getNetwork() {
    await this.ensureWeb3Connected();
    return await this.web3js.eth.getChainId();
  }

  async addNetwork(network: BlockchainNetwork) {
    await this.ensureWeb3Connected();
    await (this.web3js.currentProvider as any).request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${network.chainId.toString(16)}`,
          chainName: network.name,
          nativeCurrency: network.native,
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.blockExplorerUrl],
        },
      ],
    });
  }

  async selectNetwork(network: BlockchainNetwork) {
    await this.ensureWeb3Connected();
    await (this.web3js.currentProvider as any).request({
      method: 'wallet_switchEthereumChain',
      params: [
        {
          chainId: `0x${network.chainId.toString(16)}`,
        },
      ],
    });
  }

  async connectAccount() {
    await this.ensureWeb3Connected();
    return this.accounts;
  }

  async accountInfo(account: string): Promise<string> {
    const initialvalue = await this.web3js.eth.getBalance(account);
    this.balance = this.web3js.utils.fromWei(initialvalue, 'ether');
    return this.balance;
  }

  async getNativeBalance(address: string): Promise<string> {
    await this.ensureWeb3Connected();
    return await this.web3js.eth.getBalance(address);
  }

  async getOwnerAddress(): Promise<string> {
    await this.ensureWeb3Connected();
    let ownerAddress = this.cache.get<string>(OWNERADDRESS);
    if (!ownerAddress) {
      ownerAddress = await this.fundContract.methods.ownerAddress().call();
      this.cache.cacheData(
        OWNERADDRESS,
        ownerAddress,
        CachingStorageType.LocalStorage,
      );
    }

    return ownerAddress;
  }

  async getTreasuryAddress(): Promise<string> {
    await this.ensureWeb3Connected();
    let treasuryAddress = this.cache.get<string>(TREASURYADDRESS);
    if (!treasuryAddress) {
      treasuryAddress = await this.fundContract.methods.treasury().call();
      this.cache.cacheData(
        TREASURYADDRESS,
        treasuryAddress,
        CachingStorageType.LocalStorage,
      );
    }

    return treasuryAddress;
  }

  async getOracleAddress(): Promise<string> {
    await this.ensureWeb3Connected();
    let oracleAddress = this.cache.get<string>(ORACLEADDRESS);
    if (!oracleAddress) {
      oracleAddress = await this.fundContract.methods.oracle().call();
      this.cache.cacheData(
        ORACLEADDRESS,
        oracleAddress,
        CachingStorageType.LocalStorage,
      );
    }

    return oracleAddress;
  }

  async getFundProperties(): Promise<FundProperties> {
    await this.ensureWeb3Connected();
    let properties = this.cache.get<FundProperties>(ORACLEADDRESS);
    if (!properties) {
      const props = await this.fundContract.methods.ownerAddress().call();
      properties = {
        isLocked: props[0] == 'true',
        rebalancingTolerance: parseInt(props[1], 10),
        commission: props[2]
          ? this.web3js.utils.toWei(props[2] as string, 'gwei')
          : '0',
      };
      this.cache.cacheData(
        ORACLEADDRESS,
        properties,
        CachingStorageType.LocalStorage,
      );
    }

    return properties;
  }

  async getTotalSupply(): Promise<number> {
    await this.ensureWeb3Connected();

    return parseInt(await this.fundContract.methods.totalSupply().call(), 10);
  }

  async getSharePrice(): Promise<string> {
    await this.ensureWeb3Connected();
    const sharePrice = await this.fundContract.methods.getSharePrice().call();

    return this.web3js.utils.fromWei(sharePrice, 'ether');
  }

  async getAssetCount(): Promise<number> {
    await this.ensureWeb3Connected();
    return parseInt(await this.fundContract.methods.assetCount().call(), 10);
  }

  async getAssetAddress(index: number): Promise<string> {
    await this.ensureWeb3Connected();
    const key = `fundAssetAddress${index}`;
    let assetAddress = this.cache.get<string>(key);
    if (!assetAddress) {
      assetAddress = await this.fundContract.methods
        .assetAddresses(index)
        .call();
      this.cache.cacheData(key, assetAddress, CachingStorageType.LocalStorage);
    }

    return assetAddress;
  }

  async getAsset(address: string): Promise<AssetAllocation> {
    await this.ensureWeb3Connected();
    const key = `fundAsset${address}`;
    let assetData = this.cache.get<AssetAllocation>(key);
    if (!assetData) {
      const asset = await this.fundContract.methods.assets(address).call();
      assetData = {
        address: asset[0],
        name: asset[1],
        symbol: asset[2],
        decimals: parseInt(asset[3], 10),
        perShareAmount: parseInt(asset[4], 10),
        assetType: parseInt(asset[5], 10) as AssetTypes,
        weight: parseInt(asset[6], 10),
      };
      this.cache.cacheData(key, assetData, CachingStorageType.LocalStorage);
    }

    return assetData;
  }

  async getTreasuryBalance(address: string): Promise<string> {
    await this.ensureWeb3Connected();
    const balance = await this.treasuryContract.methods
      .getBalanceOf(address)
      .call();

    return balance;
  }

  async getSyntheticAssetBasics(address: string): Promise<SyntheticAssetBasic> {
    await this.ensureWeb3Connected();
    const syntheticContract = new this.web3js.eth.Contract(SYNTHETIC, address);
    const totalSupply = parseInt(
      await syntheticContract.methods.totalSupply().call(),
      10,
    );
    const details = await this.getSyntheticAssetDetails(address);
    details.totalSupply = totalSupply;

    return details;
  }

  async getSyntheticAssetDetails(
    address: string,
  ): Promise<SyntheticAssetBasic> {
    await this.ensureWeb3Connected();
    const syntheticContract = new this.web3js.eth.Contract(SYNTHETIC, address);
    const key = `syntheticAssetDetails${address}`;
    let details = this.cache.get<SyntheticAssetBasic>(key);
    if (!details) {
      const syntheticAssetDetails = await syntheticContract.methods
        .assetDetails()
        .call();
      details = {
        companyName: syntheticAssetDetails[0],
        companyId: syntheticAssetDetails[1],
        depotId: syntheticAssetDetails[2],
        name: syntheticAssetDetails[3],
        symbol: syntheticAssetDetails[4],
        decimals: parseInt(syntheticAssetDetails[5], 10),
      };
      this.cache.cacheData(key, details, CachingStorageType.LocalStorage);
    }

    return details;
  }

  async getMirroredAssetBasic(address: string): Promise<MirroredAssetBasics> {
    await this.ensureWeb3Connected();
    const mirroredContract = new this.web3js.eth.Contract(MIRRORED, address);
    const key = `mirroredAssetDetails${address}`;
    let details = this.cache.get<MirroredAssetBasics>(key);
    if (!details) {
      const mirroredAssetDetails = await mirroredContract.methods
        .assetDetails()
        .call();
      const commissionStr = await mirroredContract.methods.commission().call();
      const commission = parseFloat(
        this.web3js.utils.fromWei(commissionStr, 'ether'),
      );
      details = {
        address: address,
        name: mirroredAssetDetails[0],
        symbol: mirroredAssetDetails[1],
        decimals: parseInt(mirroredAssetDetails[2], 10),
        commission: commission,
      };
    }

    return details;
  }

  async getMirroredAssetBalance(address: string): Promise<string> {
    await this.ensureWeb3Connected();
    const mirroredContract = new this.web3js.eth.Contract(MIRRORED, address);
    const balance = await mirroredContract.methods
      .balanceOf(this.accounts[0])
      .call();

    return balance;
  }

  async buyMirroredAsset(address: string, amount: number) {
    await this.ensureWeb3Connected();
    const mirroredContract = new this.web3js.eth.Contract(MIRRORED, address);
    const assetPrice = await this.getAssetPrice(address);
    const commissionStr = await mirroredContract.methods.commission().call();
    const commission = parseFloat(
      this.web3js.utils.fromWei(commissionStr, 'ether'),
    );
    const cost = assetPrice * amount + commission;
    await mirroredContract.methods.mint(amount).send({
      from: this.accounts[0],
      value: this.web3js.utils.toWei(cost.toFixed(18), 'ether'),
    });
  }

  async sellMirroredAsset(address: string, amount: number) {
    await this.ensureWeb3Connected();
    const mirroredContract = new this.web3js.eth.Contract(MIRRORED, address);
    await mirroredContract.methods.burn(amount).send({
      from: this.accounts[0],
    });
  }

  async getBuyOrderCount(address: string): Promise<number> {
    await this.ensureWeb3Connected();
    const syntheticContract = new this.web3js.eth.Contract(SYNTHETIC, address);
    return parseInt(await syntheticContract.methods.buyOrderCount().call(), 10);
  }

  async getBuyOrder(
    address: string,
    index: number,
  ): Promise<SyntheticAssetOrder> {
    await this.ensureWeb3Connected();
    const syntheticContract = new this.web3js.eth.Contract(SYNTHETIC, address);
    const order = await syntheticContract.methods.buyOrders(index).call();
    const created = parseInt(order[2], 10);
    const completed = parseInt(order[3], 10);

    return {
      amount: parseInt(order[0], 10),
      state:
        parseInt(order[1], 10) === 0 ? OrderStates.Open : OrderStates.Completed,
      createdAt: created ? new Date(created * 1000) : undefined,
      completedAt: completed ? new Date(completed * 1000) : undefined,
    };
  }

  async getSellOrderCount(address: string): Promise<number> {
    await this.ensureWeb3Connected();
    const syntheticContract = new this.web3js.eth.Contract(SYNTHETIC, address);
    return parseInt(
      await syntheticContract.methods.sellOrderCount().call(),
      10,
    );
  }

  async getSellOrder(
    address: string,
    index: number,
  ): Promise<SyntheticAssetOrder> {
    await this.ensureWeb3Connected();
    const syntheticContract = new this.web3js.eth.Contract(SYNTHETIC, address);
    const order = await syntheticContract.methods.sellOrders(index).call();
    const created = parseInt(order[2], 10);
    const completed = parseInt(order[3], 10);

    return {
      amount: parseInt(order[0], 10),
      state:
        parseInt(order[1], 10) === 0 ? OrderStates.Open : OrderStates.Completed,
      createdAt: created ? new Date(created * 1000) : undefined,
      completedAt: completed ? new Date(completed * 1000) : undefined,
    };
  }

  // ** ORACLE
  async getAssetPrice(address: string): Promise<number> {
    await this.ensureWeb3Connected();
    const price = await this.oracleContract.methods.getPrice(address).call();

    return parseFloat(this.web3js.utils.fromWei(price[0], 'ether'));
  }

  async getOracleAssetSettings(address: string): Promise<OracleAssetSettings> {
    await this.ensureWeb3Connected();
    const priceOrigin = await this.oracleContract.methods
      .assetPriceOrigin(address)
      .call();
    const oracleAssetSettings: OracleAssetSettings = {
      address: address,
      priceOrigin: parseInt(priceOrigin, 10),
    };
    if (oracleAssetSettings.priceOrigin === PriceOrigin.Chainlink) {
      oracleAssetSettings.chainlinkAddress = await this.oracleContract.methods
        .chainlinkPriceFeeds(address)
        .call();
    }

    return oracleAssetSettings;
  }

  async setPriceOrigin(address: string, newPriceOrigin: PriceOrigin) {
    await this.ensureWeb3Connected();
    await this.oracleContract.methods
      .setPriceOrigin(address, newPriceOrigin)
      .send({
        from: this.accounts[0],
      });
  }

  async setChainlinkPriceFeedAddress(
    address: string,
    newChainlinkAddress: string,
  ) {
    await this.ensureWeb3Connected();
    await this.oracleContract.methods
      .setChainlinkPriceFeedAddress(address, newChainlinkAddress)
      .send({
        from: this.accounts[0],
      });
  }

  async getManagerCount(): Promise<number> {
    await this.ensureWeb3Connected();
    return parseInt(await this.fundContract.methods.managerCount().call(), 10);
  }

  async getManager(index: number): Promise<ManagerAccount> {
    await this.ensureWeb3Connected();
    const address = await this.fundContract.methods
      .managerAddresses(index)
      .call();
    const isActive = await this.fundContract.methods.managers(address).call();

    return {
      address: address,
      isActive: isActive,
    };
  }

  async getShareholderCount(): Promise<number> {
    await this.ensureWeb3Connected();

    return parseInt(
      await this.fundContract.methods.shareholderCount().call(),
      10,
    );
  }

  async getShareholder(index: number): Promise<ShareHolderAccount> {
    await this.ensureWeb3Connected();
    const address = await this.fundContract.methods
      .shareholderAddresses(index)
      .call();
    const shareholder = await this.fundContract.methods
      .shareholders(address)
      .call();

    return {
      address: address,
      shares: parseInt(
        await this.fundContract.methods.balanceOf(address).call(),
        10,
      ),
      isLocked: shareholder[2],
    };
  }

  async addAsset(asset: AssetAllocation) {
    await this.ensureWeb3Connected();
    await this.fundContract.methods
      .addAsset(
        asset.address,
        asset.name,
        asset.symbol,
        asset.decimals,
        asset.assetType,
      )
      .send({
        from: this.accounts[0],
      });
  }

  async updateWeights(assets: AssetAllocation[]) {
    await this.ensureWeb3Connected();
    await this.fundContract.methods
      .updateWeights(
        assets.map((a) => {
          return {
            assetAddress: a.address,
            weight: a.weight,
          };
        }),
      )
      .send({
        from: this.accounts[0],
      });
  }

  async updateMultipleAllocations(assets: AssetAllocation[]) {
    await this.ensureWeb3Connected();
    await this.fundContract.methods
      .updateMultipleAllocations(
        assets.map((a) => {
          return {
            assetAddress: a.address,
            perShareAmount: a.perShareAmount,
          };
        }),
      )
      .send({
        from: this.accounts[0],
      });
  }

  async addManager(manager: ManagerAccount) {
    await this.ensureWeb3Connected();
    await this.fundContract.methods.addManager(manager.address).send({
      from: this.accounts[0],
    });
  }

  async addShareholder(shareholderAddress: string) {
    await this.ensureWeb3Connected();
    await this.fundContract.methods.addShareholder(shareholderAddress).send({
      from: this.accounts[0],
    });
  }

  async buyShares(amount: number) {
    await this.ensureWeb3Connected();
    const sharePrice = parseFloat(await this.getSharePrice());
    await this.fundContract.methods.buyShares(amount).send({
      from: this.accounts[0],
      value: this.web3js.utils.toWei((sharePrice * amount).toString(), 'ether'),
    });
  }

  async sellShares(amount: number) {
    await this.ensureWeb3Connected();
    await this.fundContract.methods.sellShares(amount).send({
      from: this.accounts[0],
    });
  }

  // RESERVE

  async getAccessingAccountCount(): Promise<number> {
    await this.ensureWeb3Connected();
    const reserveCount = parseInt(await this.reserveContract.methods.accessingAccountCount().call(), 10);

    return reserveCount;
  }

  async getAccessingAccount(index: number): Promise<ManagerAccount> {
    await this.ensureWeb3Connected();
    const address = await this.reserveContract.methods.accessingAccountAddresses(index).call();
    const isActive = await this.reserveContract.methods.accessingAccounts(address).call();

    return {
      address: address,
      isActive: isActive,
    };
  }

  async addAccessingAccount(accessingAccount: ManagerAccount) {
    await this.ensureWeb3Connected();
    await this.reserveContract.methods.addAcount(accessingAccount.address).send({
      from: this.accounts[0],
    });
  }

  disconnectAccount() {
    this.provider = undefined;
    this.web3js = undefined;
    this.accounts = [];
  }

  private async ensureWeb3Connected(): Promise<Web3> {
    if (!this.provider && !this.web3js) {
      this.provider = await this.web3Modal.connect();
      this.web3js = new Web3(this.provider);
      this.accounts = await this.web3js.eth.getAccounts();
      this.fundContract = new this.web3js.eth.Contract(
        FUND,
        environment.contracts.fund,
      );
      this.treasuryContract = new this.web3js.eth.Contract(
        TREASURY,
        environment.contracts.treasury,
      );
      this.oracleContract = new this.web3js.eth.Contract(
        ORACLE,
        environment.contracts.oracle,
      );
      this.reserveContract = new this.web3js.eth.Contract(
        RESERVE,
        environment.contracts.reserve,
      );
    }

    return this.web3js;
  }
}
