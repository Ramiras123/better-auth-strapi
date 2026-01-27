import { APIError } from "better-auth/api";
import { createAuthMiddleware } from "better-auth/plugins"
import { deleteSessionCookie, setSessionCookie } from 'better-auth/cookies';
import { GenericEndpointContext } from 'better-auth';
import { getStrapiSession } from '../lib/getSession';
import { StrapiAuthOptions } from '../type/StrapiAuthOptions';

export default function refreshJwtUpload(options: StrapiAuthOptions) {
	return createAuthMiddleware(async (ctx: GenericEndpointContext) => {
		if (options.refreshStrategy) {
			const sessionUser = await getStrapiSession(ctx);

			const accessTokenLifespan = sessionUser?.session.accessTokenLifespan
			const tokenLife = options.accessTokenLifespan ? options.accessTokenLifespan
				: 30 * 60 * 1000
			if ((accessTokenLifespan && (new Date(accessTokenLifespan).getTime() - Date.now() <= tokenLife/2))) {
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
					// throw new APIError("BAD_REQUEST", errorData.error)
					return ctx.error("BAD_REQUEST", errorData.error);
				}

				const strapiSession = await strapiResponse.json();

				const session = {
					...sessionUser.session,
					strapiJwt: strapiSession.jwt,
					strapiRefreshToken: strapiSession.refreshToken,
					accessTokenLifespan: new Date(Date.now() + tokenLife)

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