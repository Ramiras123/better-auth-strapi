import { createAuthEndpoint, getSessionFromCtx } from "better-auth/api";
import { z } from "zod";

import type { StrapiAuthOptions } from "..";
import { setStrapiSession } from "../lib/session";

export default function changePassword(options: StrapiAuthOptions) {
	return createAuthEndpoint(
		"/strapi-auth/change-password",
		{
			method: "POST",
			body: z.object({
				currentPassword: z.string(),
				password: z.string(),
				passwordConfirmation: z.string(),
				callbackUrl: z.string().optional(),
			}),
		},
		async (ctx) => {
			const { currentPassword, password, passwordConfirmation, callbackUrl } = ctx.body;
			const headers = new Headers();
			headers.append("Content-Type", "application/json");
			const sessionUser = await getSessionFromCtx(ctx);
			
			if (sessionUser?.session.strapiJwt) headers.append("Authorization", `Bearer ${sessionUser?.session.strapiJwt}`);

			// Authenticate with Strapi
			const strapiResponse = await fetch(
				`${options.strapiUrl}/api/auth/change-password`,
				{
					method: "POST",
					headers,
					body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
				}
			);

			if (!strapiResponse.ok) {
				const errorData = await strapiResponse.json();
				return ctx.error("BAD_REQUEST", errorData.error);
			}

			const strapiSession = await strapiResponse.json();

			// console.log(strapiSession)
			const { user, session, strapiJwt, strapiRefreshToken } = await setStrapiSession(strapiSession, options, ctx);

			return ctx.json({
				redirect: !!callbackUrl,
				url: callbackUrl,
				user,
				session,
				strapiJwt,
				strapiRefreshToken
			});
		}

	)
}