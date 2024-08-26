import {
  AdminUser,
  ClientUser,
  ClientUserType,
  GuardUser,
} from '@prisma/client';

declare global {
  interface CurrentUser extends AdminUser {}

  interface CurrentGuardUser extends GuardUser {}

  type CurrentClientUser = Pick<
    ClientUser,
    'id' | 'name' | 'email' | 'contact' | 'residing' | 'offline'
  >;

  interface FlatClientUserAuth {
    apartmentId: string;
    flatId: string;
    id: string;
    name: string;
    contact: string;
    currentState: CurrentState;
  }

  interface CurrentState {
    type: ClientUserType;
    residing: boolean;
    offline: boolean;
    apartmentId: string;
    flatId: string;
    hasOwner: boolean;
  }

  type EmailTemplateProps = {
    name: string;
    code?: string;
    main_url?: string;
    url: string;
  };

  type MainFile = Express.Multer.File;

  type FlatOrUserId = {
    id: string;
    flatId?: string;
    apartmentId?: string;
  };
}
