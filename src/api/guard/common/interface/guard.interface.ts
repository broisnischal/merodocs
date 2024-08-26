import { GuardUser } from '@prisma/client';

export interface CreateParams<T> {
  apartmentId: string;
  postData: T;
  loggedUserData: GuardUser;
}

export interface UpdateParams<T> {
  id: string;
  apartmentId: string;
  postData: T;
  loggedUserData: GuardUser;
}

export interface DeleteParams {
  id: string;
  apartmentId: string;
  loggedUserData: GuardUser;
}

export interface GetAllParams<T = any> {
  apartmentId: string;
  page?: string;
  limit?: string;
  q?: string;
  id?: string;
  extended?: T;
}

export interface GetParam {
  id: string;
  apartmentId: string;
  q?: string;
}
