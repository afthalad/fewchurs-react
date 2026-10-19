// The package targets the server but ships no @types/node dependency of its own: these are the
// only Node globals it touches, and a host app's own types stay authoritative.
declare const process: {
  env: Record<string, string | undefined>;
};
