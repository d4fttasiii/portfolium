import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-asset-swap',
  templateUrl: './asset-swap.component.html',
  styleUrls: ['./asset-swap.component.scss']
})
export class AssetSwapComponent implements OnInit {

  @Input() commission: number;
  @Input() fromBalance: number;
  @Input() price: number;
  @Input() priceLoading: boolean;

  @Output() toggleClicked = new EventEmitter();
  @Output() amountChanged = new EventEmitter<number>();
  @Output() submitClicked = new EventEmitter();

  @Input() fromLabel: string;
  @Input() toLabel: string;
  
  fromAmount: number;
  toAmount: number;
  cost: number;

  constructor() { }

  ngOnInit(): void {
    this.reset();
  }

  toggleBuySell() {
    this.toggleClicked.emit();
    this.reset();
  }

  reset() {
    this.fromAmount = undefined;
    this.toAmount = 0;
    this.cost = 0;
    this.price = 0;
  }

  submit() {
    this.submitClicked.emit();
  }

}
