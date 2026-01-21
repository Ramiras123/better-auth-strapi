import { createAuthEndpoint, getSessionFromCtx } from "better-auth/api";

import type { StrapiAuthOptions } from "..";
import { deleteSessionCookie } from 'better-auth/cookies';
import z from 'zod';

export default function logout(options: StrapiAuthOptions) {
	return createAuthEndpoint(
		"/strapi-auth/logout",
		{
			method: "POST",
			body: z.object({
				callbackUrl: z.string(),
			}),
		},
		async (ctx) => {
			const { callbackUrl } = ctx.body;
			const sessionUser = await getSessionFromCtx(ctx);
			const headers = new Headers();
			headers.append("Content-Type", "application/json");
			if (sessionUser?.session.strapiJwt) headers.append("Authorization", `Bearer ${sessionUser?.session.strapiJwt}`);

			// Authenticate with Strapi
			const strapiResponse = await fetch(
				`${options.strapiUrl}/api/auth/logout`,
				{
					method: "POST",
					headers,
				}
			);

			if (!strapiResponse.ok) {
				const errorData = await strapiResponse.json();
				return ctx.error("BAD_REQUEST", errorData.error);
			}
			deleteSessionCookie(ctx);
			return ctx.json({
				redirect: !!callbackUrl,
				success: true
			})

		}
	)
}