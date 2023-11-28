import { Component, Input } from '@angular/core';

export interface TableDataSource {
  header: TableHeader[];
  rows?: TableRow[];
}

export interface TableRow {
  records: TableRecord[];
}

export interface TableRecord {
  type: TableRecordTypes;
  data: TableRecordText | TableRecordImage | TableRecordActionGroup | TableRecordBadge | any;
}

export interface TableHeader {
  label: string;
  align: 'left' | 'right' | 'center';
}

export enum TableRecordTypes {
  Text,
  Image,
  ActionGroup,
  Badge,
  Multiline,
}

export interface TableRecordText {
  text: string;
  isBold: boolean;
}

export interface TableRecordMultiline {
  lines: string[];
}

export interface TableRecordImage {
  url: string;
}

export interface TableRecordBadge {
  color: string;
  text: string;
}

export interface TableRecordActionGroup {
  actions: TableRecordAction[];
}

export interface TableRecordAction {
  label: string;
  icon: string;
  color?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  fn: Function;
}

@Component({
  selector: 'port-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent {
  @Input() isLoading: boolean;
  @Input() dataSource: TableDataSource;
}
