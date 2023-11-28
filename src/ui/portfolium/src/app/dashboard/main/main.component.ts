import { Component } from '@angular/core';
import { TableDataSource, TableRecordTypes } from 'src/app/shared/table/table.component';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'port-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent {
  Highcharts: typeof Highcharts = Highcharts;
  allocation: TableDataSource;
  isLoading = true;
  chartOptions: Highcharts.Options = {
    title: {
      text: 'Allocation',
    },
    series: [
      {
        data: [
          { name: 'Wrapped BTC', y: 30 },
          { name: 'Wrapped ETH', y: 20 },
          { name: 'Wrapped SOL', y: 20 },
          { name: 'Wrapped MATIC', y: 10 },
          { name: 'Chainlink', y: 5 },
          { name: 'Avalanche', y: 5 },
          { name: 'Uniswap', y: 5 },
          { name: 'Tether USDT', y: 5 },
        ],
        type: 'pie',
      },
    ],
  };

  constructor() {
    this.allocation = allocation;
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }
}

const allocation: TableDataSource = {
  header: [
    {
      align: 'left',
      label: '',
    },
    {
      align: 'left',
      label: 'Nr.',
    },
    {
      align: 'left',
      label: 'Name',
    },
    {
      align: 'left',
      label: 'Address',
    },
    {
      align: 'left',
      label: 'Weight',
    },
    {
      align: 'left',
      label: 'Price',
    },
  ],
  rows: [
    {
      records: [
        {
          type: TableRecordTypes.Image,
          data: {
            url: '../../../assets/icons/btc.svg',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '1',
          },
        },
        {
          type: TableRecordTypes.Multiline,
          data: { lines: ['Wrapped Bitcoin', 'WBTC'] },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
            isBold: true,
          },
        },
        {
          type: TableRecordTypes.Badge,
          data: {
            color: 'primary',
            text: '30.00%',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '$34.611,00',
          },
        },
      ],
    },
    {
      records: [
        {
          type: TableRecordTypes.Image,
          data: {
            url: '../../../assets/icons/eth.svg',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '2',
          },
        },
        {
          type: TableRecordTypes.Multiline,
          data: { lines: ['Wrapped Ether', 'WETH'] },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
            isBold: true,
          },
        },
        {
          type: TableRecordTypes.Badge,
          data: {
            color: 'primary',
            text: '20.00%',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '$1.874,81',
          },
        },
      ],
    },
    {
      records: [
        {
          type: TableRecordTypes.Image,
          data: {
            url: '../../../assets/icons/sol.svg',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '3',
          },
        },
        {
          type: TableRecordTypes.Multiline,
          data: { lines: ['Wrapped SOL', 'SOL'] },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '0xd93f7E271cB87c23AaA73edC008A79646d1F9912',
            isBold: true,
          },
        },
        {
          type: TableRecordTypes.Badge,
          data: {
            color: 'primary',
            text: '20.00%',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '$35.76',
          },
        },
      ],
    },
    {
      records: [
        {
          type: TableRecordTypes.Image,
          data: {
            url: '../../../assets/icons/matic.svg',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '4',
          },
        },
        {
          type: TableRecordTypes.Multiline,
          data: { lines: ['Wrapped MATIC', 'WMATIC'] },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
            isBold: true,
          },
        },
        {
          type: TableRecordTypes.Badge,
          data: {
            color: 'primary',
            text: '10.00%',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '$0.71',
          },
        },
      ],
    },
    {
      records: [
        {
          type: TableRecordTypes.Image,
          data: {
            url: '../../../assets/icons/link.svg',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '5',
          },
        },
        {
          type: TableRecordTypes.Multiline,
          data: { lines: ['Chainlink', 'LINK'] },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '0xb0897686c545045aFc77CF20eC7A532E3120E0F1',
            isBold: true,
          },
        },
        {
          type: TableRecordTypes.Badge,
          data: {
            color: 'primary',
            text: '5.00%',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '$12.87',
          },
        },
      ],
    },
    {
      records: [
        {
          type: TableRecordTypes.Image,
          data: {
            url: '../../../assets/icons/avax.svg',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '6',
          },
        },
        {
          type: TableRecordTypes.Multiline,
          data: { lines: ['Avalanche', 'AVAX'] },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '0x2C89bbc92BD86F8075d1DEcc58C7F4E0107f286b',
            isBold: true,
          },
        },
        {
          type: TableRecordTypes.Badge,
          data: {
            color: 'primary',
            text: '5.00%',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '$12.71',
          },
        },
      ],
    },
    {
      records: [
        {
          type: TableRecordTypes.Image,
          data: {
            url: '../../../assets/icons/uni.svg',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '7',
          },
        },
        {
          type: TableRecordTypes.Multiline,
          data: { lines: ['Uniswap', 'UNI'] },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '0xb33eaad8d922b1083446dc23f610c2567fb5180f',
            isBold: true,
          },
        },
        {
          type: TableRecordTypes.Badge,
          data: {
            color: 'primary',
            text: '5.00%',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '$4.90',
          },
        },
      ],
    },
    {
      records: [
        {
          type: TableRecordTypes.Image,
          data: {
            url: '../../../assets/icons/usdt.svg',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '8',
          },
        },
        {
          type: TableRecordTypes.Multiline,
          data: { lines: ['Tether', 'USDT'] },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            isBold: true,
          },
        },
        {
          type: TableRecordTypes.Badge,
          data: {
            color: 'primary',
            text: '5.00%',
          },
        },
        {
          type: TableRecordTypes.Text,
          data: {
            text: '$1.00',
          },
        },
      ],
    },
  ],
};
