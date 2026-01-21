import signIn from "./sign-in";
import signUp from "./sign-up";
import forgotPassword from "./forgot-password";
import updatePassword from "./update-password";
import changePassword from './change-password';
import logout from './logout';

import type { StrapiAuthOptions } from "..";

export default function endpoints(options: StrapiAuthOptions) {
  return {
    signIn: signIn(options),
    signUp: signUp(options),
    forgotPassword: forgotPassword(options),
    updatePassword: updatePassword(options),
    changePassword: changePassword(options),
    logout: logout(options)
  } as const;
}