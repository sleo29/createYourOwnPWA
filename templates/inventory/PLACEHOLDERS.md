# Handlebars placeholders

Every configuration placeholder below is a scalar string; Handlebars's standard HTML escaping is used in page templates. The generated static application also has matching local editing controls on its Settings page, with browser-local overrides taking precedence over the values used at generation time.

| Placeholder           | Schema field             | Expected value                                                                                                                        | Used in                                                                    |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `{{appName}}`         | `appName`                | Short application display name, such as `Inventory`                                                                                   | Page title, sidebar branding, install app name                             |
| `{{businessName}}`    | `businessName`           | Business/workspace display name                                                                                                       | Page title, dashboard shell, and manifest description                      |
| `{{primaryColor}}`    | `primaryColor`           | CSS hex color (prefer `#RRGGBB`)                                                                                                      | Theme-color metadata, accent CSS variable, SVG icons, manifest theme color |
| `{{currency}}`        | `currency`               | Three-letter ISO 4217 currency code supported by `Intl.NumberFormat` (for example `USD`, `EUR`, `GBP`, `CAD`, `AUD`, `JPY`, or `INR`) | Initial currency used by UI formatting and the Settings page               |
| `{{businessLogo}}`    | `businessLogo`           | Optional URL or static relative URL for the business logo; empty string uses the generated initials badge                             | Header logo image                                                          |
| `{{businessEmail}}`   | `businessEmail`          | Optional email address                                                                                                                | Schema and Settings page                                                   |
| `{{businessPhone}}`   | `businessPhone`          | Optional telephone string                                                                                                             | Schema and Settings page                                                   |
| `{{businessAddress}}` | `businessAddress`        | Optional postal address                                                                                                               | Schema and Settings page                                                   |
| `{{pageScript}}`      | Per-page compile context | One of the page module names listed above, without `.js`                                                                              | `partials/footer.hbs` selects the page behavior module                     |

## File-specific notes

- Compile each page with its own `pageScript` value and the same business configuration; standard Handlebars `{{#if pageScript}}` controls only the page-module script include.
- Compile `manifest.template.json` with JSON-string-escaped **contents** for `appName`, `businessName`, and `primaryColor` because those values use Handlebars triple braces in a JSON context. For example, prepare each value with `JSON.stringify(value).slice(1, -1)` before rendering this file; this preserves JSON syntax without a custom helper. Do not pass untrusted raw values to triple-brace placeholders. Parse the rendered manifest as JSON to validate it. Compile the SVG files with the regular (unescaped-in-meaning but Handlebars-escaped-in-output) color value from the schema.
- The CSS theme is assigned in a small inline `<style>` block in `partials/head.hbs`, not interpolated into the stylesheet, so generated CSS can remain a static asset.
- The `sw.template.js` and app-shell URLs assume the generated app is deployed at the origin root. If deploying beneath a URL prefix, update `start_url`, `scope`, service-worker registration scope, and shell paths consistently.

`schema.json` is the source of truth for user-editable fields: it specifies the field name, label, input type, default, required status, and currency options where applicable.
