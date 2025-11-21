<?php

/**
 * Cookie Manager Utility
 *
 * Handles WordPress authentication cookie configuration with SameSite attributes.
 * Required for WordPress Playground which runs in an iframe.
 *
 * @package Aether\Utilities
 */

namespace Aether\SiteExporter\Utilities;

\defined('ABSPATH') || exit;

/**
 * Cookie manager utility class.
 */
class CookieManager
{
	/**
	 * Set SameSite=None on WordPress authentication cookies.
	 *
	 * Required for WordPress Playground which runs in an iframe.
	 * Modern browsers block third-party cookies by default unless SameSite=None is set.
	 *
	 * @param string $authCookie    Authentication cookie value.
	 * @param int    $expire        Cookie expiration time.
	 * @param int    $expiration    Session expiration timestamp.
	 * @param int    $userId        User ID.
	 * @param string $scheme        Authentication scheme.
	 * @param string $token         Session token.
	 * @return void
	 */
	public function setSameSiteCookies(string $authCookie, int $expire, int $expiration, int $userId, string $scheme, string $token): void // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	{
		// Determine which cookies to set based on the action hook.
		$action = \current_action();

		// Check if site is using HTTPS or if this is a secure auth scheme
		// SameSite=None requires Secure flag, but Secure flag requires HTTPS
		$isSecure = \is_ssl() || ('secure_auth' === $scheme);

		// Use SameSite=None for HTTPS (allows cross-site/iframe usage)
		// Fall back to SameSite=Lax for HTTP sites (still reasonably secure)
		$sameSite = $isSecure ? 'None' : 'Lax';

		if ('set_auth_cookie' === $action) {
			$this->setAuthCookie($authCookie, $expire, $isSecure, $sameSite);
		} elseif ('set_logged_in_cookie' === $action) {
			$this->setLoggedInCookie($authCookie, $expire, $isSecure, $sameSite);
		}
	}

	/**
	 * Set authentication cookie with SameSite attribute.
	 *
	 * @param string $authCookie Cookie value.
	 * @param int    $expire     Cookie expiration time.
	 * @param bool   $isSecure   Whether cookie should be secure (HTTPS only).
	 * @param string $sameSite   SameSite attribute value.
	 * @return void
	 */
	private function setAuthCookie(string $authCookie, int $expire, bool $isSecure, string $sameSite): void
	{
		// Set the auth cookie (can be AUTH_COOKIE or SECURE_AUTH_COOKIE based on scheme).
		$authCookieName = $isSecure ? SECURE_AUTH_COOKIE : AUTH_COOKIE;

		\setcookie(
			$authCookieName,
			$authCookie,
			[
				'expires'  => $expire,
				'path'     => PLUGINS_COOKIE_PATH,
				'domain'   => COOKIE_DOMAIN,
				'secure'   => $isSecure,
				'httponly' => true,
				'samesite' => $sameSite,
			]
		);

		\setcookie(
			$authCookieName,
			$authCookie,
			[
				'expires'  => $expire,
				'path'     => ADMIN_COOKIE_PATH,
				'domain'   => COOKIE_DOMAIN,
				'secure'   => $isSecure,
				'httponly' => true,
				'samesite' => $sameSite,
			]
		);
	}

	/**
	 * Set logged-in cookie with SameSite attribute.
	 *
	 * @param string $authCookie Cookie value.
	 * @param int    $expire     Cookie expiration time.
	 * @param bool   $isSecure   Whether cookie should be secure (HTTPS only).
	 * @param string $sameSite   SameSite attribute value.
	 * @return void
	 */
	private function setLoggedInCookie(string $authCookie, int $expire, bool $isSecure, string $sameSite): void
	{
		// Set the logged-in cookie.
		\setcookie(
			LOGGED_IN_COOKIE,
			$authCookie,
			[
				'expires'  => $expire,
				'path'     => COOKIEPATH,
				'domain'   => COOKIE_DOMAIN,
				'secure'   => $isSecure,
				'httponly' => true,
				'samesite' => $sameSite,
			]
		);

		\setcookie(
			LOGGED_IN_COOKIE,
			$authCookie,
			[
				'expires'  => $expire,
				'path'     => SITECOOKIEPATH,
				'domain'   => COOKIE_DOMAIN,
				'secure'   => $isSecure,
				'httponly' => true,
				'samesite' => $sameSite,
			]
		);
	}
}
