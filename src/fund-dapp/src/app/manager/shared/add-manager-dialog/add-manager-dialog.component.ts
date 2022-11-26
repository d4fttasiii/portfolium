import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: 'add-manager-dialog',
    templateUrl: 'add-manager-dialog.component.html',
})
export class AddManagerDialog {
    data: string;

    constructor(public dialogRef: MatDialogRef<AddManagerDialog>) {
        this.data = '';
    }

    cancel(): void {
        this.dialogRef.close();
    }
}