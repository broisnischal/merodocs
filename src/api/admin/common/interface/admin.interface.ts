import {
  AdminUser,
  ClientUserRequestTypeEnum,
  FolderAccessEnum,
  FolderTypeEnum,
} from '@prisma/client';

export interface CreateParams<T> {
  apartmentId: string;
  postData: T;
  loggedUserData: AdminUser;
}

export interface UpdateParams<T> {
  id: string;
  apartmentId: string;
  postData: T;
  loggedUserData: AdminUser;
}

export interface DeleteParams {
  id: string;
  apartmentId: string;
  loggedUserData: AdminUser;
}

export interface GetAllParams<T = null> {
  page?: number;
  limit?: number;
  filter?: string;
  archive?: boolean;
  apartmentId: string;
  withId?: string;
  q?: string;
  atSignUp?: boolean;
  sort?: string;
  date?: string;
  extended?: T;
  residentType?: 'owner' | 'tenant' | 'family';
  ids?: string;
}

export interface GetParam {
  id: string;
  apartmentId: string;
  month?: number;
  blockId?: string;
}

export interface CreateParamsForFolder<T> {
  apartmentId: string;
  postData: T;
  type: FolderTypeEnum;
  loggedUserData: AdminUser;
  withId?: string;
}

export interface UpdateParamsForFolder<T> {
  apartmentId: string;
  postData: T;
  type: FolderTypeEnum;
  id: string;
  loggedUserData: AdminUser;
  withId?: string;
}

export interface GetAllParamsForFolder {
  page?: number;
  limit?: number;
  filter?: string;
  archive?: boolean;
  apartmentId: string;
  withId?: string;
  access?: FolderAccessEnum;
  type: FolderTypeEnum;
}

export interface GetParamForFolder {
  id: string;
  type: FolderTypeEnum;
  apartmentId: string;
}

export interface DeleteParamsForFolder {
  id: string;
  apartmentId: string;
  loggedUserData: AdminUser;
  type: FolderTypeEnum;
}

export interface MultipleDeleteParams {
  ids: string[];
  apartmentId: string;
  loggedUserData: AdminUser;
  type: FolderTypeEnum;
  id: string;
}

// For Activitylogs
export type ActivityLogType =
  | 'apartment'
  | 'floorandflat'
  | 'notice'
  | 'poll'
  | 'role'
  | 'adminuser'
  | 'guarduser'
  | 'document'
  | 'gallery'
  | 'serviceuser'
  | 'amenity'
  | 'documentType'
  | ClientUserRequestTypeEnum
  | 'staffAccount'
  | 'admin-attendance'
  | 'guard-attendance'
  | 'service-attendance'
  | 'popup';
