declare type Create<T, X = never> = {
  body: T;
  user: CurrentClientUser;
  extend?: X;
};

declare type Update<T, X = never> = {
  id: string;
  body: T;
  user: CurrentClientUser;
  extend?: X;
};

declare type Delete<X = never> = {
  id: string;
  user: CurrentClientUser;
  extend?: X;
};

declare type Get<X = never> = {
  id: string;
  user: CurrentClientUser;
  extend?: X;
};

declare type GetAll<T = undefined> = {
  page?: number;
  limit?: number;
  filter?: string;
  archive?: boolean;
  withId?: string;
  q?: string;
  user: CurrentClientUser;
  extend?: T;
};

export declare namespace UnAssignedUserParam {
  export { Create, Update, Delete, Get, GetAll };
}
