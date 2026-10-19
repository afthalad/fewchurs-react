// `server-only` throws unless the bundler resolves the react-server condition, which vitest
// does not set. The modules under test are server modules by construction, so stub it out.
export {};
