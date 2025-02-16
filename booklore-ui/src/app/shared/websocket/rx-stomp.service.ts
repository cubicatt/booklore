import { Injectable } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { AuthService } from '../../core/service/auth.service';
import { createRxStompConfig } from './rx-stomp.config';

@Injectable({
  providedIn: 'root',
})
export class RxStompService extends RxStomp {
  constructor(private authService: AuthService) {
    super();
    const stompConfig = createRxStompConfig(this.authService);
    this.configure(stompConfig);
  }
}
