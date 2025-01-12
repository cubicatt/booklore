import {Component} from '@angular/core';
import {Select, SelectChangeEvent} from 'primeng/select';
import {FormsModule} from '@angular/forms';
import {NgForOf, TitleCasePipe} from '@angular/common';
import {Checkbox} from 'primeng/checkbox';
import {Button} from 'primeng/button';
import {MessageService} from 'primeng/api';

interface FieldProvider {
  defaultProvider: string | null;
  higherPriorityProvider: string | null;
  highestPriorityProvider: string | null;
}

@Component({
  selector: 'app-metadata-advanced-fetch-options',
  templateUrl: './metadata-advanced-fetch-options.component.html',
  imports: [Select, FormsModule, NgForOf, Checkbox, Button, TitleCasePipe],
  styleUrl: './metadata-advanced-fetch-options.component.scss',
  standalone: true
})
export class MetadataAdvancedFetchOptionsComponent {

  providers: string[] = ['Amazon', 'Google', 'GoodReads'];
  refreshCovers: boolean = false;

  defaultProvider = {
    placeholder: 'Select All',
    value: ''
  };
  higherPriorityProvider = {
    placeholder: 'Select All',
    value: ''
  };
  highestPriorityProvider = {
    placeholder: 'Select All',
    value: ''
  };

  fields: string[] = ['title', 'description', 'authors', 'categories', 'cover'];

  tableState: Record<string, FieldProvider> = this.fields.reduce<Record<string, FieldProvider>>((acc, field) => {
    acc[field] = {
      defaultProvider: null,
      higherPriorityProvider: null,
      highestPriorityProvider: null
    };
    return acc;
  }, {});

  constructor(private messageService: MessageService) {
  }


  syncProvider(event: SelectChangeEvent, providerType: keyof FieldProvider) {
    for (const field of Object.keys(this.tableState)) {
      this.tableState[field][providerType] = event.value;
    }
  }

  individualProviderChanged(providerType: keyof FieldProvider) {
    const providerMap: Record<keyof FieldProvider, { value: string; placeholder: string }> = {
      defaultProvider: this.defaultProvider,
      higherPriorityProvider: this.higherPriorityProvider,
      highestPriorityProvider: this.highestPriorityProvider
    };
    const provider = providerMap[providerType];
    provider.value = '';
    provider.placeholder = 'Overridden';
  }

  submit() {
    const allProvidersSelected = Object.keys(this.tableState).every(field => {
      return this.tableState[field].defaultProvider !== null;
    });
    console.log(this.tableState)
    if (allProvidersSelected) {

    } else {
      this.messageService.add({severity: 'error', summary: 'Error', life: 5000, detail: 'Base provider must be selected for all the book fields.'});
    }
  }
}
