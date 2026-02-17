import { BetterAuthPlugin } from "better-auth";
import signIn from "./endpoints/sign-in";
import signUp from "./endpoints/sign-up";
import forgotPassword from "./endpoints/forgot-password";
import updatePassword from "./endpoints/update-password";
import changePassword from './endpoints/change-password';
import refreshJwtUpload from './hooks/refreshJwtUpload';
import logout from './endpoints/logout';
import updateSessionData from './endpoints/updateSessionData';
import { StrapiAuthOptions } from './type/StrapiAuthOptions';


export const strapiAuth = (options: StrapiAuthOptions) => {
  return {
    id: "strapi-auth",
    schema: {
      user: {
        fields: {
          documentId: {
            type: "string"
          },
        }
      },
      session: {
        fields: {
          strapiJwt: {
            type: "string"
          },
          strapiRefreshToken: {
            type: "string",
            required: false
          },
          remember: {
            type: "boolean"
          },
          accessTokenLifespan: {
            type: "date",
            required: false
          },
        }
      }
    },
    hooks: {
      after: [{
        matcher: (context: any) => {
          return context.path === '/get-session'
        },
        handler: refreshJwtUpload(options),
      }]
    },
    endpoints: {
      signIn: signIn(options),
      signUp: signUp(options),
      changePassword: changePassword(options),
      forgotPassword: forgotPassword(options),
      updatePassword: updatePassword(options),
      logoutRefresh: logout(options),
      updateSessionData: updateSessionData(options)
    },
  } satisfies BetterAuthPlugin;
};

export type StrapiAuth = ReturnType<typeof strapiAuth>;

