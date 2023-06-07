const { flatRoutes } = require('remix-flat-routes')

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  cacheDirectory: "./node_modules/.cache/remix",
  future: {
    v2_errorBoundary: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
    v2_headers: true
  },
  ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
  postcss: true,
  serverModuleFormat: "cjs",
  tailwind: true,
  serverDependenciesToBundle: ["@remix-pwa/sw", "nanoid"],

  // Flat Routes.
  routes: async (defineRoutes) => {
    return flatRoutes('routes', defineRoutes)
  },
};
