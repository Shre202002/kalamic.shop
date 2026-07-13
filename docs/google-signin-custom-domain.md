# Google Sign-In custom-domain activation

The application keeps `studio-6917027295-9c66e.firebaseapp.com` as its default
authentication domain until the custom callback has been deployed and approved.
Follow this order so production sign-in is never left with an unavailable callback.

1. Deploy the auth proxy in `next.config.ts` and confirm that
   `https://www.kalamic.shop/__/auth/handler` returns HTTP 200.
2. In Firebase Console, open **Authentication > Settings > Authorized domains**
   and add `kalamic.shop` and `www.kalamic.shop` if they are not already listed.
3. In Google Cloud Console, select project `studio-6917027295-9c66e`, open
   **Google Auth Platform > Clients**, select the web client used by Firebase,
   and add this exact authorized redirect URI:

   `https://www.kalamic.shop/__/auth/handler`

4. In **Google Auth Platform > Branding**, use:
   - App name: `Kalamic.shop`
   - Homepage: `https://www.kalamic.shop`
   - Privacy policy: `https://www.kalamic.shop/privacy`
   - Terms of service: `https://www.kalamic.shop/terms`
   - Authorized domain: `kalamic.shop`
5. In Firebase App Hosting, set the build-time environment variable
   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` to `www.kalamic.shop`, then redeploy.
6. Test Google Sign-In in an incognito window. The chooser should say
   `to continue to www.kalamic.shop` while displaying the Kalamic.shop app name.

If the custom callback does not return HTTP 200, do not set the environment
variable. Leaving it unset preserves the existing Firebase-domain login.
