export type JwtPayload = {
  id: string;
  [key: string]: any;
};

export type ResetPayload = {
  id: string;
};

export enum Panel {
  ADMIN = 'admin',
  USER = 'user',
  SUPERADMIN = 'superadmin',
  GUARD = 'guard',
}

export enum TokenType {
  REFRESH = 'refresh',
  ACCESS = 'access',
}
