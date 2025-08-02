export type RefreshPayload = {
  userId: string;
  deviceId: string;
  deviceName?: string;
  ip?: string;
  iat?: number; // время выдачи токена (Unix timestamp в секундах)
};
