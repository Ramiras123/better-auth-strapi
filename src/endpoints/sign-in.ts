import { createAuthEndpoint } from "better-auth/api";
import { z } from "zod";

import type { StrapiAuthOptions } from "..";
import { setStrapiSession } from "../lib/session";

export default function signIn(options: StrapiAuthOptions) {
    return createAuthEndpoint(
        "/strapi-auth/sign-in",
        {
            method: "POST",
            body: z.object({
                identifier: z.string(),
                password: z.string(),
                callbackUrl: z.string().optional(),
            }),
        },
        async (ctx) => {
            const { identifier, password, callbackUrl } = ctx.body;
            const headers = new Headers();
            headers.append("Content-Type", "application/json");
            if(options.strapiToken) headers.append("Authorization", `Bearer ${options.strapiToken}`);

            // Authenticate with Strapi
            const strapiResponse = await fetch(
                `${options.strapiUrl}/api/auth/local`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ identifier, password }),
                }
            );

            if (!strapiResponse.ok) {
                const errorData = await strapiResponse.json();                
                return ctx.error("UNAUTHORIZED", errorData.error);
            }

            const strapiSession = await strapiResponse.json();

            // Set session cookie
            const { user, session, strapiJwt } = await setStrapiSession(strapiSession, options, ctx);

            return ctx.json({
                redirect: !!callbackUrl,
                url: callbackUrl,
                user,
                session,
                strapiJwt // Return Strapi JWT for making Strapi API calls
            });
        }
    )
}