/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm",
  browserNodeBuiltinsPolyfill: { modules: { crypto: true } }
}; 