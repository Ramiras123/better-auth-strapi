import signIn from "./sign-in";
import signUp from "./sign-up";
import forgotPassword from "./forgot-password";
import updatePassword from "./update-password";

import type { StrapiAuthOptions } from "..";

export default function endpoints(options: StrapiAuthOptions) {
  return {
    signIn: signIn(options),
    signUp: signUp(options),
    forgotPassword: forgotPassword(options),
    updatePassword: updatePassword(options),
  } as const;
}