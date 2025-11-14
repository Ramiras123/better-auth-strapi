import { createAuthEndpoint } from "better-auth/api";
import { z } from "zod";

import type { StrapiAuthOptions } from "..";

export default function forgotPassword(options: StrapiAuthOptions) {
    return createAuthEndpoint(
        "/strapi-auth/forgot-password",
        {
            method: "POST",
            body: z.object({
                email: z.email(),
            }),
        },
        async (ctx) => {
            const { email } = ctx.body;
            const headers = new Headers();
            headers.append("Content-Type", "application/json");
            if(options.strapiToken) headers.append("Authorization", `Bearer ${options.strapiToken}`);

            // Authenticate with Strapi
            const strapiResponse = await fetch(
                `${options.strapiUrl}/api/auth/forgot-password`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ email }),
                }
            );

            if (!strapiResponse.ok) {
                const errorData = await strapiResponse.json();
                return ctx.json(
                    { error: errorData.message || "Invalid request" },
                    { status: 401 }
                );
            }

            const data = await strapiResponse.json();

            return ctx.json(data);
        }
    )
}