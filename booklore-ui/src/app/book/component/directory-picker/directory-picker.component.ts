import {Component, OnInit} from '@angular/core';
import {DynamicDialogRef} from 'primeng/dynamicdialog';
import {UtilityService} from '../../service/utility.service';

@Component({
  selector: 'app-directory-picker-v2',
  standalone: false,
  templateUrl: './directory-picker.component.html',
  styleUrls: ['./directory-picker.component.scss']
})
export class DirectoryPickerComponent implements OnInit {
  value: any;
  paths: string[] = ['...'];
  selectedProductName: string = '';

  constructor(private utilityService: UtilityService, private dynamicDialogRef: DynamicDialogRef) {
  }

  ngOnInit() {
    const initialPath = '/';
    this.getFolders(initialPath);
  }

  getFolders(path: string): void {
    this.utilityService.getFolders(path).subscribe(
      (folders: string[]) => {
        this.paths = ['...', ...folders];
      },
      (error) => {
        console.error('Error fetching folders:', error);
      }
    );
  }

  onRowClick(path: string): void {
    if (path === '...') {
      if (this.selectedProductName === '' || this.selectedProductName === '/') {
        this.getFolders('/');
      } else {
        const result = this.selectedProductName.substring(0, this.selectedProductName.lastIndexOf('/')) || '/';
        this.selectedProductName = result;
        this.getFolders(result);
      }
    } else {
      this.selectedProductName = path;
      this.getFolders(path);
    }
  }

  onSelect(): void {
    this.dynamicDialogRef.close(this.selectedProductName);
  }
}
