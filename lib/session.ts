import { generateId, GenericEndpointContext } from "better-auth";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";

import type { StrapiAuthOptions } from "..";

interface StrapiSession {
    user: any;
    jwt: string;
}

export const setStrapiSession = async (strapiSession: StrapiSession, options:StrapiAuthOptions, ctx: GenericEndpointContext) => {
    const { user: strapiUser, jwt: strapiJwt } = strapiSession;

    // Populate and fetch additional user fields if specified and not already included
    if (options.userFieldsMap) {
        const populateFields = Object.values(options.userFieldsMap).filter(field => !(field in strapiUser));

        if (populateFields.length > 0) {
            const populateParams = new URLSearchParams();
            Object.values(populateFields).forEach((field, index) => populateParams.append(`populate[${index}]`, field));

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
        email: strapiUser.email,
        name: strapiUser.username,
        emailVerified: strapiUser.confirmed,
        image: null,
        createdAt: new Date(strapiUser.createdAt),
        updatedAt: new Date(strapiUser.updatedAt),
    };

    Object.entries(options.userFieldsMap || {}).forEach(([betterAuthField, strapiField]) => {
        if (strapiUser[strapiField] !== undefined) {
            (user as any)[betterAuthField] = strapiUser[strapiField];
        }
    });

    // Create session object - stateless, stored only in cookie
    const sessionToken = generateId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = {
        id: sessionToken,
        createdAt: new Date(),
        updatedAt: new Date(),
        token: sessionToken,
        userId: user.id,
        expiresAt,
        ipAddress: ctx.headers?.get("x-forwarded-for") || "",
        userAgent: ctx.headers?.get("user-agent") || ""
    };

    // If specified, set the session cookie with custom session hook
    if (options.sessionHook) {
        await setSessionCookie(ctx, await options.sessionHook({ session, user }));
    } else {
        await setSessionCookie(ctx, { session, user });
    }

    return { user, session, strapiJwt };
}