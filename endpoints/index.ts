import signIn from "./sign-in";
import signUp from "./sign-up";
import forgotPassword from "./forgot-password";
import changePassword from "./update-password";

import type { StrapiAuthOptions } from "..";

export default function endpoints(options: StrapiAuthOptions) {
  return {
    signIn: signIn(options),
    signUp: signUp(options),
    forgotPassword: forgotPassword(options),
    changePassword: changePassword(options),
  } as const;
}