export interface CreateParams<T> {
  apartmentId?: string;
  flat?: string;
  postData: T;
  loggedUserData: CurrentClientUser;
}

export interface GetAllParams {
  //! This is a common interface for all get all requests
  page?: number;
  limit?: number;
  filter?: string;
  archive?: boolean;
  apartmentId: string;
  withId?: string;
  q?: string;
  clientId?: string;
  flatId?: string;
  loggedUserData?: CurrentClientUser;
}

export interface UpdateParamsReset {
  id: string;
  code: string;
}

export interface UpdateParamsVerify<T> {
  postData: T;
  id: string;
}
