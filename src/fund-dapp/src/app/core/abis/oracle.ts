import { AbiItem } from 'web3-utils';

export const ORACLE: AbiItem[] = [
  {
    inputs: [
      { internalType: 'address', name: '_applicationAddress', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'applicationAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'assetPriceOrigin',
    outputs: [
      { internalType: 'enum Oracle.PriceOrigin', name: '', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'chainlinkPriceFeeds',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ownerAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newApplicationAddress',
        type: 'address',
      },
    ],
    name: 'setApplicationAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'assetAddress', type: 'address' },
      { internalType: 'uint8', name: 'priceOriginNr', type: 'uint8' },
    ],
    name: 'setPriceOrigin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'assetAddress', type: 'address' },
      {
        internalType: 'address',
        name: 'chainlinkPriceFeedAddress',
        type: 'address',
      },
    ],
    name: 'setChainlinkPriceFeedAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'assetAddress', type: 'address' },
      { internalType: 'uint256', name: 'newPrice', type: 'uint256' },
    ],
    name: 'setPrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'assetAddress', type: 'address' },
          { internalType: 'uint256', name: 'newPrice', type: 'uint256' },
        ],
        internalType: 'struct Oracle.PriceUpdate[]',
        name: 'priceUpdates',
        type: 'tuple[]',
      },
    ],
    name: 'setPrices',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'assetAddress', type: 'address' },
    ],
    name: 'getPrice',
    outputs: [
      { internalType: 'uint256', name: 'price', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
