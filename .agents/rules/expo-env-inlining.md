# Expo / Metro Environment Variable Inlining

When reading `EXPO_PUBLIC_*` environment variables intended for React Native Web / client bundles:

1. **Never use optional chaining on `process.env`**: Do NOT write `process.env?.EXPO_PUBLIC_FOO`. Metro's static AST replacement does NOT inline the variable when optional chaining is used, leaving it as an unresolved property access that evaluates to `undefined` in browser bundles.
2. **Use direct member access or standard guards**: Write `process.env.EXPO_PUBLIC_FOO` or `(typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_FOO)`.
3. **Verification**: Always verify web bundle output or include a key-gated live wiring test when adding external API integrations or environment variables.
