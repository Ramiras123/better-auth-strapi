import { createAuthEndpoint, sessionMiddleware } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { GenericEndpointContext } from 'better-auth';
import { getStrapiSession } from '../lib/getSession';
import { StrapiAuthOptions } from '../type/StrapiAuthOptions';


export default function updateSessionData(options: StrapiAuthOptions) {
	return createAuthEndpoint(
		'/strapi-auth/update-session-data',
		{
			method: "GET",
			use: [sessionMiddleware]
		},
		async (ctx: GenericEndpointContext) => {
			const sessionUser = await getStrapiSession(ctx);
			if (!sessionUser) return
			let populateFields: Record<string, any>[] = [];
			const populateParams = new URLSearchParams();

			if (options.userFieldsMap) {
				populateFields = Object.values(options.userFieldsMap).filter(field => !(field in sessionUser.user));
				Object.values(populateFields).forEach((field, index) => {
					populateParams.append(`populate[${index}]`, field.split('.')[0])
				});
			}

			const userResponse = await fetch(
				`${options.strapiUrl}/api/users/me?${populateFields.length > 0 ? populateParams.toString() : ''}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${sessionUser.session.strapiJwt}`,
					},
				}
			);


			if (!userResponse.ok) {
				const errorData = await userResponse.json();
				return ctx.error("BAD_REQUEST", errorData.error);
			}

			const userData = await userResponse.json();

			const user = {
				id: userData.id.toString(),
				documentId: userData.documentId,
				email: userData.email,
				name: userData.username,
				emailVerified: userData.confirmed,
				image: null,
				createdAt: new Date(userData.createdAt),
				updatedAt: new Date(userData.updatedAt),
			};
			const session = {
				...sessionUser.session,
				updatedAt: new Date(Date.now())
			}

			Object.entries(options.userFieldsMap || {}).forEach(([betterAuthField, strapiField]) => {
				let newField = userData;
				const arr = strapiField.split(".");
				while (arr.length && (newField = newField[arr.shift() || '']));

				if (newField !== undefined) {
					(user as any)[betterAuthField] = newField;
				}
			});

			const dontRememberMe = sessionUser.session.remember === false;


			if (typeof options.sessionHook === "function") {
				await setSessionCookie(ctx, await options.sessionHook({ session, user }), dontRememberMe);
			} else {
				await setSessionCookie(ctx, { session, user }, dontRememberMe);
			}

			return ctx.json({
				success: true
			})
		}
	)
}