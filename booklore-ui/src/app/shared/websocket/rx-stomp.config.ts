import { RxStompConfig } from '@stomp/rx-stomp';
import { API_CONFIG } from '../../config/api-config';
import {AuthService} from '../../core/service/auth.service';

export function createRxStompConfig(authService: AuthService): RxStompConfig {
  return {
    brokerURL: API_CONFIG.BROKER_URL,
    connectHeaders: {
      Authorization: `Bearer ${authService.getToken()}`,
    },
    heartbeatIncoming: 0,
    heartbeatOutgoing: 20000,
    reconnectDelay: 200,
    debug: (msg: string): void => {
      //console.log(new Date(), msg);
    },
  };
}
