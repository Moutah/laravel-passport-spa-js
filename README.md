# laravel-passport-spa-js

This package handles the token management from a [Laravel](https://github.com/laravel/laravel) back-end using [Passport](https://github.com/laravel/passport) authentification in a Single-Page Application using the OAuth [authorization flow (PKCE)](https://www.oauth.com/oauth2-servers/pkce/). It allows you to safely get tokens without storing them in the local storage or cookies.

![GitHub package.json version](https://img.shields.io/github/package-json/v/Moutah/laravel-passport-spa-js)
![Build](https://github.com/Moutah/laravel-passport-spa-js/workflows/CI/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Moutah_laravel-passport-spa-js&metric=alert_status)](https://sonarcloud.io/dashboard?id=Moutah_laravel-passport-spa-js)
![Sonar Coverage](https://img.shields.io/sonar/coverage/Moutah_laravel-passport-spa-js?server=https%3A%2F%2Fsonarcloud.io)
[![License](https://img.shields.io/:license-mit-blue.svg?style=flat)](https://opensource.org/licenses/MIT)

### How does it work

The package retrieves tokens by making an authorization request to the server through an iframe. The authorization code is then exchanged for a token which is cached in memory. When this token expires, a new one is retrieved using the same approach.

This will work as long as the user has an active session at the authentication server. When this session expires, the user is redirected to the authentication server's sign in page.

The chart below illustrates the detailed flow of the package:

<img src="https://www.moutah.ch/Laravel Passport SPA JS - Flow.jpg">

> This package has been inspired by [@auth0/auth0-spa-js](https://github.com/auth0/auth0-spa-js).

## Installation

Using [npm](https://npmjs.org/):

```sh
npm install laravel-passport-spa-js
```

> Package registration ongoing

## Getting started

Before starting here, make sure your authentification server is up and running and that you have the id of your _public_ Passport client (see [Laravel's doc](https://laravel.com/docs/master/passport#code-grant-pkce)).

### 1. Creating the client

The first step is to create a `LaravelPassportClient` instance as everything is done through this object.

```js
import createLaravelPassportClient from 'laravel-passport-spa-js';

const lpClient = createLaravelPassportClient({
  // the domain of your authentication server
  domain: 'auth.server.com',

  // the id of your Passport client
  client_id: 22,

  // the uri the authentication server will send the authorization codes to
  redirect_uri: 'http://your.app.com/signed-in',
});
```

Note that the `redirect_uri` must match exactly the one stored for your Passport client.

> ⚠️ Make this object available in your app but **do not** expose it to the global scope.

### 2. Sign in _(optional)_

```js
// async / await
const isSuccessfullySignedIn = await lpClient.signIn();
```

_or_

```js
// Promise
lpClient.signIn().then(signInResult => {});
```

This will acquire a token through an iframe and cache it. If the iframe method fails, the user will be redirected to the sign in page of your authentication server.

This step is optional as getting a token will perform a `signIn()` if no valid token is present.

### 3 Handling redirect callback

```js
// async / await
const isSuccessfullySignedIn = await lpClient.handleRedirectCallback();
```

_or_

```js
// Promise
lpClient.handleRedirectCallback().then(signInResult => {});
```

This should be present on the page reached by the specified `redirect_uri` to extract and consume the given authorization code.

By using the Promise syntax you can immediately redirect your user to another page of your app and have the promise resolve in the background. If the redirect is done by changing the `location`, the Promise will most likely not be fullfiled but now that your user has a session at the authentication server, you can simply get a token (see below) an the sign in will be performed silently through an iframe.

### 4. Getting a token

```js
// async / await
const token = await lpClient.getToken();
```

_or_

```js
// Promise
lpClient.getToken().then(token => {});
```

This will give the token in cache or perform a `signIn()` as described in point 2.

### 5. Sign out _(optional)_

```js
lpClient.signOut();
```

This will clear the token cache.

## Documentation

### Client options

When creating the `LaravelPassportClient` instance, you can pass several options. Some are required, others are optional and come with default value if not specified.

```js
const laravelClientOptions = {
  /**
   * REQUIRED
   * Your Laravel Passport authentification domain url such as `'auth.server.com'`.
   */
  domain: string;

  /**
   * REQUIRED
   * The Client ID.
   */
  client_id: string;

  /**
   * REQUIRED
   * The default URL where Laravel Passport will redirect your browser to with the
   * authentication result.
   */
  redirect_uri: string;

  /**
   * The prefix fow Passport's routes on the authentication server.
   * Defaults to `'oauth'`.
   */
  oauthPrefix?: string;

  /**
   * The default scope to be used on authentication requests.
   * Defaults to `'*'`.
   */
  scope?: string;

  /**
   * A maximum number of seconds to wait before declaring background calls to /
   * authorize as failed for timeout.
   * Defaults to `60`.
   */
  authorizeTimeoutInSeconds?: number;

  /**
   * Whether a new sign in should be attempted if no valid token is present when
   * `getToken()` is called.
   * Defaults to `true`.
   */
  isAutoRefresh?: boolean;
};

const lpClient = createLaravelPassportClient(laravelClientOptions);
```

The optional elements can be accessed and modified on the client after creation:

```js
// get / set oauthPrefix
lpClient.oauthPrefix;

// get / set scope
lpClient.scope;

// get / set authorizeTimeoutInSeconds
lpClient.authorizeTimeoutInSeconds;

// get / set isAutoRefresh
lpClient.isAutoRefresh;
```

### Available methods

#### `lpClient.getToken()`

> Returns `Promise<string | null>`

Get the token this client has in cache. Resolves on the token (`string`) or `null` if no valid token present and `lpClient.isAutoRefresh` is `false`.

#### `lpClient.getTokenScopes()`

> Returns `string[] | null`

Get this client token's scope(s) as an array. Returns `null` if no token present. Note that the scopes are returned even if the token is expired.

#### `lpClient.getTokenExpiration()`

> Returns `Date | null`

Get this client token's expiration date. Returns `null` if no token present. Note that the Date is returned even if the token is expired.

#### `lpClient.isTokenValid()`

> Returns `boolean`

Returns `true` if the client has a token which is not expired, `false` otherwise.

#### `lpClient.getSignedInUserId()`

> Returns `number | null`

Get this client token's user id. Returns `null` if no valid token present.

#### `lpClient.signIn(scope?: string)`

> Returns `Promise<boolean>`

Sign the client in. Starts with the iframe flow and fallsback to redirect flow if needed. If provided, the given `scope` value will override the client's scope. Resolves on `true` if the sign in has been successful, `false` otherwise.

#### `lpClient.signInWithRedirect(scope?: string)`

> Returns `Promise<void>`

Redirect to the authorize URL (`'/oauth/authorize'` by default) with appropriate parameters. If provided, the given scope value will override the client's scope.

#### `lpClient.handleRedirectCallback()`

> Returns `Promise<boolean>`

Extract the authorization code returned in the query string and exchange it for a new token. Resolves on `true` if the sign in has been successful, `false` otherwise.

#### `lpClient.signOut()`

> Returns `void`

Remove the cached token.

## Support and Feedback

For support or to provide feedback, please [raise an issue](https://github.com/Moutah/laravel-passport-spa-js/issues) on the GitHub page.

## License

This project is licensed under the MIT license. See the [LICENSE](https://github.com/Moutah/laravel-passport-spa-js/blob/master/LICENSE) file for more info.
