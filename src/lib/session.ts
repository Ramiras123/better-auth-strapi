import { generateId, GenericEndpointContext } from "better-auth";
import { setSessionCookie } from "better-auth/cookies";
import { StrapiSession } from '../type/StrapiSession';
import { StrapiAuthOptions } from '../type/StrapiAuthOptions';


export const setStrapiSession = async (strapiSession: StrapiSession, options: StrapiAuthOptions, ctx: GenericEndpointContext) => {
    const { user: strapiUser, jwt: strapiJwt, refreshToken: strapiRefreshToken } = strapiSession;

    // Populate and fetch additional user fields if specified and not already included
    if (options.userFieldsMap) {
        const populateFields = Object.values(options.userFieldsMap).filter(field => !(field in strapiUser));

        if (populateFields.length > 0) {
            const populateParams = new URLSearchParams();
            Object.values(populateFields).forEach((field, index) => {
                populateParams.append(`populate[${index}]`, field.split('.')[0])
            });

            const userResponse = await fetch(
                `${options.strapiUrl}/api/users/me?${populateParams.toString()}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${strapiJwt}`,
                    },
                }
            );

            if (userResponse.ok) {
                const userData = await userResponse.json();
                Object.assign(strapiUser, userData);
            }
        }
    }

    // Map user object from Strapi data
    const user = {
        id: strapiUser.id.toString(),
        documentId: strapiUser.documentId,
        email: strapiUser.email,
        name: strapiUser.username,
        emailVerified: strapiUser.confirmed,
        image: null,
        createdAt: new Date(strapiUser.createdAt),
        updatedAt: new Date(strapiUser.updatedAt),
    };

    Object.entries(options.userFieldsMap || {}).forEach(([betterAuthField, strapiField]) => {
        let newField = strapiUser;
        const arr = strapiField.split(".");
        while (arr.length && (newField = newField[arr.shift() || '']));

        if (newField !== undefined) {
            (user as any)[betterAuthField] = newField;
        }
    });
    const dontRememberMe = ctx.body.remember === false;

    // Create session object - stateless, stored only in cookie
    const sessionToken = generateId();
    const expiresAt = dontRememberMe ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const accessTokenLifespan = options.accessTokenLifespan ? new Date(Date.now() + options.accessTokenLifespan)
        : new Date(Date.now() + 30 * 60 * 1000) // 30 min
    const session = {
        id: sessionToken,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
        token: sessionToken,
        strapiJwt,
        remember: ctx.body.remember,
        ...(options.refreshStrategy && { strapiRefreshToken, accessTokenLifespan }),
        userId: user.id,
        expiresAt,
        ipAddress: ctx.headers?.get("x-forwarded-for") || "",
        userAgent: ctx.headers?.get("user-agent") || ""
    };

    // If specified, set the session cookie with custom session hook
    if (typeof options.sessionHook === "function") {
        await setSessionCookie(ctx, await options.sessionHook({ session, user }), dontRememberMe);
    } else {
        await setSessionCookie(ctx, { session, user }, dontRememberMe);
    }

    return { user, session, strapiJwt };
}