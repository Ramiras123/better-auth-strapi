import { BetterAuthClientPlugin } from "better-auth/client";
import type { StrapiAuth } from ".";

export const strapiAuthClient = () => {
  return {
    id: "strapi-auth",
    $InferServerPlugin: {} as StrapiAuth,
  } satisfies BetterAuthClientPlugin;
};