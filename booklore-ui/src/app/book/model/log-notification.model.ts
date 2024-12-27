export interface LogNotification {
  timestamp?: string;
  message: string;
}

export function parseLogNotification(messageBody: string): LogNotification {
  const raw = JSON.parse(messageBody);
  const localTime = new Date(raw.timestamp).toLocaleTimeString();

  return {
    timestamp: localTime,
    message: raw.message,
  };
}
