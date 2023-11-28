import { Component } from '@angular/core';

import { TableDataSource, TableRecordTypes } from '../../shared/table/table.component';

@Component({
  selector: 'port-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
})
export class TestComponent {
  title = 'portfolium';
  dataSource: TableDataSource = {
    header: [
      {
        label: '',
        align: 'left',
      },
      {
        label: 'Brand',
        align: 'left',
      },
      {
        label: 'Category',
        align: 'left',
      },
      {
        label: 'Price',
        align: 'left',
      },
      {
        label: 'Status',
        align: 'left',
      },
      {
        label: 'Action',
        align: 'left',
      },
    ],
  };

  tableLoading = true;

  asd() {
    alert('asd');
  }

  constructor() {
    this.dataSource.rows = [
      {
        records: [
          {
            type: TableRecordTypes.Image,
            data: {
              url: 'https://images.unsplash.com/photo-1613588718956-c2e80305bf61?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=634&q=80',
              size: 48,
            },
          },
          { type: TableRecordTypes.Multiline, data: { lines: ['Apple', 'mail@rgmail.com'] } },
          { type: TableRecordTypes.Text, data: { text: 'Technology', isBold: true } },
          { type: TableRecordTypes.Text, data: { text: '200.00$', isBold: true } },
          { type: TableRecordTypes.Badge, data: { text: 'available', color: 'primary' } },
          {
            type: TableRecordTypes.ActionGroup,
            data: {
              actions: [
                {
                  label: 'visibility',
                  icon: 'fa-eye',
                  fn: () => {
                    alert('x');
                  },
                },
                {
                  label: 'edit',
                  icon: 'fa-edit',
                  fn: () => {
                    alert('x');
                  },
                },
                {
                  label: 'delete',
                  icon: 'fa-times',
                  fn: () => {
                    alert('x');
                  },
                },
              ],
            },
          },
        ],
      },
    ];
    setTimeout(() => {
      this.tableLoading = false;
    }, 1500);
  }
}
