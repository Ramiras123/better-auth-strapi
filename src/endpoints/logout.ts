import { createAuthEndpoint } from "better-auth/api";

import { deleteSessionCookie } from 'better-auth/cookies';
import z from 'zod';
import { getStrapiSession } from '../lib/getSession';
import { StrapiAuthOptions } from '../type/StrapiAuthOptions';

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
			const sessionUser = await getStrapiSession(ctx);
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