export interface CreateParams<T> {
  postData: T;
}

export interface GetAllParams {
  page?: number;
  limit?: number;
  q?: string;
  filter?: string;
}

export interface GetParam {
  slug?: string;
}
