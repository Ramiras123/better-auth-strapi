import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";

import type { StrapiAuthOptions } from "..";
import { deleteSessionCookie, setSessionCookie } from 'better-auth/cookies';

export default function refreshJwtUpload(options: StrapiAuthOptions) {
	return createAuthMiddleware(async (ctx) => {
		if (options.refreshStrategy) {
			const sessionUser = await getSessionFromCtx(ctx);
			const accessTokenLifespan = sessionUser?.session.accessTokenLifespan
			const lifespanDate = accessTokenLifespan instanceof Date
				? accessTokenLifespan
				: new Date(accessTokenLifespan);
			const tokenLife = options.accessTokenLifespan ? options.accessTokenLifespan
				: 30 * 60 * 1000

			if (((lifespanDate.getTime() - Date.now() <= (tokenLife) / 2))) {
				const refreshToken = sessionUser?.session.strapiRefreshToken
				if (!refreshToken) {
					deleteSessionCookie(ctx);
					throw new APIError("BAD_REQUEST", {
						message: "Missing refresh_token"
					});
				}
				const headers = new Headers();
				headers.append("Content-Type", "application/json");
				if (sessionUser.session.strapiJwt) headers.append("Authorization", `Bearer ${sessionUser.session.strapiJwt}`);
				const strapiResponse = await fetch(
					`${options.strapiUrl}/api/auth/refresh`,
					{
						method: "POST",
						headers,
						body: JSON.stringify({ refreshToken }),
					}
				);
				if (!strapiResponse.ok) {
					const errorData = await strapiResponse.json();
					deleteSessionCookie(ctx);
					throw new APIError("BAD_REQUEST", errorData.error)
					// return ctx.error("BAD_REQUEST", errorData.error);
				}

				const strapiSession = await strapiResponse.json();

				const session = {
					...sessionUser.session,
					strapiJwt: strapiSession.jwt,
					strapiRefreshToken: strapiSession.refreshToken,
					accessTokenLifespan: options.accessTokenLifespan ? new Date(Date.now() + options.accessTokenLifespan)
						: new Date(Date.now() + 30 * 60 * 1000) // 30 min
				}

				if (typeof options.sessionHook === "function") {
					await setSessionCookie(ctx, await options.sessionHook({ session, user: sessionUser.user }));
				} else {
					await setSessionCookie(ctx, { session, user: sessionUser.user });
				}
				return ctx.json({
					user: sessionUser.user,
					session: session
				});

			}

		}
	})
}