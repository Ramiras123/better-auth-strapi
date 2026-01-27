import { GenericEndpointContext, Session, User } from 'better-auth';
import { getSessionFromCtx } from 'better-auth/api';

export const getStrapiSession = async (ctx: GenericEndpointContext) => {
	return await getSessionFromCtx<{
		documentId: string;
	} & User, {
		strapiJwt: string;
		strapiRefreshToken?: string;
		remember: boolean;
		accessTokenLifespan?: Date;
	} & Session>(ctx);
};