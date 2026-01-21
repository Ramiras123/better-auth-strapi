import { BetterAuthPlugin, Session, User } from "better-auth";
import signIn from "./endpoints/sign-in";
import signUp from "./endpoints/sign-up";
import forgotPassword from "./endpoints/forgot-password";
import updatePassword from "./endpoints/update-password";
import changePassword from './endpoints/change-password';
import refreshJwtUpload from './hooks/refreshJwtUpload';
import logout from './endpoints/logout';

export interface StrapiAuthOptions {
  strapiUrl: string;
  strapiToken?: string;
  userFieldsMap?: {
    [key: string]: any;
  };
  signInAfterReset?: boolean;
  refreshStrategy?: boolean;
  accessTokenLifespan?: number; // millisecond  default(30 min) work if refreshStrategy: true
  sessionHook?: (session: {
    session: Session & Record<string, any>;
    user: User;
  }) => Promise<any> | any;
}


export const strapiAuth = (options: StrapiAuthOptions) => {
  return {
    id: "strapi-auth",
    hooks: {
      after: [{
        matcher: (context: any) => {
          return context.path === '/get-session'
        },
        handler: refreshJwtUpload(options)
      }]
    },
    endpoints: {
      signIn: signIn(options),
      signUp: signUp(options),
      changeThePassword: changePassword(options),
      forgotPassword: forgotPassword(options),
      updatePassword: updatePassword(options),
      logoutRefresh: logout(options)
    },
  } satisfies BetterAuthPlugin;
};

export type StrapiAuth = ReturnType<typeof strapiAuth>;
