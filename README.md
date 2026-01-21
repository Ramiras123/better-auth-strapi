# Better Auth + Strapi

A [Better Auth](https://better-auth.com) plugin that enables authentication using [Strapi](https://strapi.io) as the backend.

> [!WARNING]
> This plugin is still in development and a work in progress, **do not** use it in production. It's not yet tested for vulnerabilities, and most likely not yet secure.

## Features

- 🔐 Sign in with Strapi credentials
- 📝 User registration through Strapi
- 🔑 Password reset and update functionality
- 🎣 Custom session hooks for extended user data
- 🔒 Support for the refresh jwt strategy
- 🔄 Seamless integration with Better Auth
- 📦 TypeScript support with full type safety
- ⌛ Session memorization and various customizations of the session storage format

## Installation

```bash
npm install @ramiras123/better-auth-strapi
```

## Usage

### Server Setup

Configure the plugin in your Better Auth server configuration:

```typescript
import { betterAuth } from "better-auth";
import { strapiAuth } from "better-auth-strapi";

export const auth = betterAuth({
  // ... your other Better Auth config
  plugins: [
    strapiAuth({
      strapiUrl: "http://localhost:1337", // Your Strapi instance URL
      strapiToken: process.env.STRAPI_API_TOKEN, // Optional: API token for authenticated requests
      signInAfterReset: true, // Optional: Auto sign-in after password reset
      refreshStrategy: false, // Optional: Choosing the token receipt method
      accessTokenLifespan: 30*1000, // Optional: In milliseconds. Defines the lifetime of the jwt token
      userFieldsMap: {
        // Optional: Map additional Strapi user fields
        firstName: "firstName",
        lastName: "lastName",
        image: "avatar.url"
      },
      sessionHook: async ({ session, user }) => {
        // Optional: Extend session with custom data
        return {
          ...session,
          customData: "value",
        };
      },
    }),
  ],
	session: {
		expiresIn: 60 * 60 * 24 * 30, // 30 days
		updateAge: 60 * 2,
		disableSessionRefresh: true,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60 * 24 * 30, // 30 day
			strategy: "jwt", // Jwt strategy
		}
	},
});
```

### Client Setup

Add the client plugin to your Better Auth client:

```typescript
import { createAuthClient } from "better-auth/client";
import { strapiAuthClient } from "better-auth-strapi/client";

export const authClient = createAuthClient({
	sessionOptions: {
		refetchInterval: 5*60 // Checking the session on the client once every 5 min
	},
  plugins: [strapiAuthClient()],
});
```

### Authentication Methods

#### Sign Up

```typescript
const { data, error } = await authClient.strapiAuth.signUp({
  email: "user@example.com",
  password: "securePassword123",
  username: "user",
  remember: false // Optional: Save the session in the browser or not. If false is selected, the session lasts for 1 day regardless of the strategy and ends when the browser is closed. If true is selected, the session lives for 30 days.
});
```

#### Sign In

```typescript
const { data, error } = await authClient.strapiAuth.signIn({
  identifier: "user@example.com", // Email or username
  password: "securePassword123",
  remember: false // Optional: Save the session in the browser or not. If false is selected, the session lasts for 1 day regardless of the strategy and ends when the browser is closed. If true is selected, the session lives for 30 days.
});

// The response includes the Strapi JWT for making authenticated Strapi API calls
if (data) {
  console.log(data.strapiJwt); // Use this for Strapi API requests
}
```

#### Sign Out (only default jwt token)

```typescript
await authClient.signOut() // This method only works for a regular strategy. There will be a separate endpoint for the refresh token.
```

#### Logout
```typescript
await authClient.strapiAuth.logout({ // Only refresh token sign out
	callbackUrl: "/" // required
})
```

#### Forgot Password

```typescript
const { data, error } = await authClient.strapiAuth.forgotPassword({
  email: "user@example.com",
});
```

#### Update Password

```typescript
const { data, error } = await authClient.strapiAuth.updatePassword({
  code: "reset-code-from-email",
  password: "newSecurePassword123",
  passwordConfirmation: "newSecurePassword123",
});
```
#### Change Password 

```typescript
const { data, error } = await authClient.strapiAuth.changePassword({
  currentPassword: "oldSecurePassword123",
  password: "newSecurePassword123",
  passwordConfirmation: "newSecurePassword123",
})
```

## Configuration Options

### `StrapiAuthOptions`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `strapiUrl` | `string` | Yes | Base URL of your Strapi instance |
| `strapiToken` | `string` | No | API token for authenticated Strapi requests |
| `userFieldsMap` | `object` | No | Map additional Strapi user fields to Better Auth user object |
| `signInAfterReset` | `boolean` | No | Automatically sign in users after password reset (default: `false`) |
| `sessionHook` | `function` | No | Custom function to extend session data with additional information |
| `refreshStrategy` | `boolean` | No | Choosing a refresh token strategyn. [jwtManagement](https://docs.strapi.io/cms/features/users-permissions#jwt-management-modes) |
| `accessTokenLifespan` | `number` | No | Choosing the token lifetime for the refreshToken strategy at which the token will be updated. |

## Endpoints

The plugin provides the following authentication endpoints:

- `POST /strapi-auth/sign-in` - Authenticate with Strapi credentials
- `POST /strapi-auth/sign-up` - Register a new user via Strapi
- `POST /strapi-auth/forgot-password` - Request password reset
- `POST /strapi-auth/update-password` - Reset password with code
- `POST /strapi-auth/change-password` - Change password

## Strapi Setup

Ensure your Strapi instance has the following enabled:

1. **Users & Permissions plugin** (enabled by default)
2. **Email plugin** configured for password reset emails
3. Access to authentication endpoints:
   - `/api/auth/local` (sign in)
   - `/api/auth/local/register` (sign up)
   - `/api/auth/forgot-password` (forgot password)
   - `/api/auth/reset-password` (reset password)
   - `/api/auth/change-password`(change password)
   - `/api/auth/refresh` (refresh jwt Token)
   - `/api/auth/logout` (refresh jwt sign out)

## TypeScript Support

This plugin is written in TypeScript and provides full type definitions. All configuration options and API responses are fully typed.

## Author

[@douwepausma](https://github.com/douwepausma)
[@ramiras123](https://github.com/ramiras123)

## Links

- [Better Auth Documentation](https://better-auth.com)
- [Strapi Documentation](https://docs.strapi.io)
