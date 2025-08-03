export enum ConfirmedStatus {
  Confirmed = 'confirmed',
  Unconfirmed = 'unconfirmed',
}

export interface EmailConfirmation {
    confirmationCode?: string;
    expirationDate?: Date;
    isConfirmed: ConfirmedStatus.Confirmed | ConfirmedStatus.Unconfirmed;
}
