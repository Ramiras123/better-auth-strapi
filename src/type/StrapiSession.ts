export interface StrapiSession {
	jwt: string;
	refreshToken?: string;
	user: User;
}

type User = {
	id: number;
	documentId: string;
	username: string;
	email: string;
	provider: string;
	confirmed: boolean;
	blocked: boolean;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
} & Record<string, any>;