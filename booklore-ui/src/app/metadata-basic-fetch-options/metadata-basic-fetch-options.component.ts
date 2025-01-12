import { Component } from '@angular/core';
import {Button} from 'primeng/button';
import {Checkbox} from 'primeng/checkbox';
import {Select} from 'primeng/select';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-metadata-basic-fetch-options',
  standalone: true,
  templateUrl: './metadata-basic-fetch-options.component.html',
  imports: [
    Button,
    Checkbox,
    Select,
    FormsModule
  ],
  styleUrl: './metadata-basic-fetch-options.component.scss'
})
export class MetadataBasicFetchOptionsComponent {
  providers: string[] = ['Amazon', 'Google', 'GoodReads'];
  selectedProvider!: string;
  refreshCovers: boolean = false;
}
