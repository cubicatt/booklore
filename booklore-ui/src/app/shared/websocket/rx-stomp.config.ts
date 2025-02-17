import {RxStompConfig} from '@stomp/rx-stomp';
import {API_CONFIG} from '../../config/api-config';
import {AuthService} from '../../core/service/auth.service';

export function createRxStompConfig(authService: AuthService): RxStompConfig {
  return {
    brokerURL: API_CONFIG.BROKER_URL,
    heartbeatIncoming: 0,
    heartbeatOutgoing: 20000,
    reconnectDelay: 200,
    beforeConnect: (stomp) => {
      stomp.stompClient.connectHeaders = {'Authorization': `Bearer ${authService.getToken()}`};
    },
    debug: (msg: string): void => {
      //console.log(new Date(), msg);
    },
  };
}
