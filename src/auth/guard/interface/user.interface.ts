export enum UserType {
  Customer = 'customer',
  Merchant = 'merchant',
  Admin = 'admin',
}

export enum Role {
  Customer = 'customer',
  Merchant = 'merchant',
}

export interface User {
  id: string;
  user_type: UserType;
  role: Role;
}
