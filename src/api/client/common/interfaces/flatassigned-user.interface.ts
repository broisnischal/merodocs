declare type Create<T, X = never> = {
  body: T;
  user: FlatClientUserAuth;
  extend?: X;
};

declare type Update<T, X = never> = {
  id: string;
  body: T;
  user: FlatClientUserAuth;
  extend?: X;
};

declare type Delete<X = never> = {
  id: string;
  user: FlatClientUserAuth;
  extend?: X;
};

declare type Get<X = never> = {
  id: string;
  user: FlatClientUserAuth;
  extend?: X;
};

declare type GetAll<T = undefined> = {
  page?: number;
  limit?: number;
  filter?: string;
  archive?: boolean;
  withId?: string;
  q?: string;
  user: FlatClientUserAuth;
  extend?: T;
};

export declare namespace AssignedUserParam {
  export { Create, Update, Delete, Get, GetAll };
}
