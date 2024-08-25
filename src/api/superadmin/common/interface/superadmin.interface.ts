import { SuperAdmin } from '@prisma/client';

export interface CreateParams<T> {
  postData: T;
  loggedUserData: SuperAdmin;
  id?: string;
}

export interface UpdateParams<T> {
  id: string;
  postData: T;
  loggedUserData: SuperAdmin;
  withId?: string;
}

export interface DeleteParams {
  id: string;
  loggedUserData: SuperAdmin;
}

export interface GetAllParams {
  page?: number;
  limit?: number;
  filter?: string;
  subscription?: string;
  archive?: boolean;
  withId?: string;
  q?: string;
}

export interface GetParam {
  id: string;
  month?: number;
  year?: number;
}

export type ActivityLogType =
  | 'setting'
  | 'auth'
  | 'popupbanner'
  | 'contactus'
  | 'legalcompliance';
