import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req
  const isAuthPage = nextUrl.pathname === "/login" || nextUrl.pathname === "/register"
  
  if (isAuthPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/", nextUrl))
    }
    return
  }

  if (!isLoggedIn) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl))
  }
})

export const config = {
  // Protect all routes except static assets, API auth, PWA manifests, and sw.js
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html|icon-192.png|icon-512.png).*)"],
}
