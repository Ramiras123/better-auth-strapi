import { Session, User } from 'better-auth/types';

export interface StrapiAuthOptions {
	strapiUrl: string;
	strapiToken?: string;
	userFieldsMap?: {
		[key: string]: any;
	};
	signInAfterReset?: boolean;
	refreshStrategy?: boolean;
	accessTokenLifespan?: number; // millisecond  default(30 min) work if refreshStrategy: true
	sessionHook?: (session: {
		session: Session & Record<string, any>;
		user: User;
	}) => Promise<any> | any;
}