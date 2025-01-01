import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {LoadingService} from '../loading.service';
import {ProgressSpinner} from 'primeng/progressspinner';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  imports: [
    ProgressSpinner,
    NgIf
  ],
  styleUrls: ['./loading-overlay.component.scss']
})
export class LoadingOverlayComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  private loadingSubscription: Subscription | undefined;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      (loading) => {
        this.loading = loading;
      }
    );
  }

  ngOnDestroy(): void {
    this.loadingSubscription?.unsubscribe();
  }
}
