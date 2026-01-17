import { BetterAuthClientPlugin } from "better-auth/client";
import type { StrapiAuth } from "./index.ts";



export const strapiAuthClient = () => {
  return {
    id: "strapi-auth",
    $InferServerPlugin: {} as StrapiAuth,
    pathMethods: {
      "/strapi-auth/change-password": "POST"
    }
  } satisfies BetterAuthClientPlugin;
};