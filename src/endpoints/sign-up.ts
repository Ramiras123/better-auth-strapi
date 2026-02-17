import { createAuthEndpoint } from "better-auth/api";
import { string, z } from "zod";
import { setStrapiSession } from '../lib/session';
import { StrapiAuthOptions } from '../type/StrapiAuthOptions';

export default function signUp(options: StrapiAuthOptions) {
    return createAuthEndpoint(
        "/strapi-auth/sign-up",
        {
            method: "POST",
            body: z.intersection(
                z.object({
                    email: z.string(),
                    password: z.string(),
                    remember: z.boolean().optional().default(false),
                    username: z.string(),
                    callbackUrl: z.string().optional(),
                }),
                z.record(z.string(), z.any())
            ),
        },
        async (ctx) => {
            const headers = new Headers();
            const { callbackUrl, email, password, username, remember, ...props } = ctx.body;
            headers.append("Content-Type", "application/json");
            if (options.strapiToken) headers.append("Authorization", `Bearer ${options.strapiToken}`);

            // Register with Strapi
            const strapiResponse = await fetch(
                `${options.strapiUrl}/api/auth/local/register`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ email, password, username, ...props }),
                }
            );

            if (!strapiResponse.ok) {
                const errorData = await strapiResponse.json();
                console.error("Strapi sign-up error:", errorData);
                return ctx.error("UNAUTHORIZED", errorData.error);
            }

            const strapiSession = await strapiResponse.json();
            if (!options.requireEmailVerification) {
                const { user, session, strapiJwt } = await setStrapiSession(strapiSession, options, ctx);

                return ctx.json({
                    redirect: !!callbackUrl,
                    url: callbackUrl,
                    user,
                    session,
                    strapiJwt, // Return Strapi JWT for making Strapi API calls
                });
            } else {
                return ctx.json({
                    redirect: !!callbackUrl,
                    url: callbackUrl
                })
            }
        }
    );
}