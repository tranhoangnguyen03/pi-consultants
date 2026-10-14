# Public presentation: platform details

Checked 2026-10-14; recheck after 2027-04-14. Platforms change: confirm a field, limit or behaviour on the live site before citing it, and say when you could not.

## GitHub
- **About box:** description (keep it the same sentence as the package description and the README tagline; aim for about 160 characters or fewer), website link, topics.
- **Topics:** add the ecosystem's discovery topics plus a few domain topics.
- **Social preview:** Settings → General → Social preview. 1280×640 (2:1) recommended, under 1 MB. Web upload only. Without one, shared links show a generic card.
- **README rendering:** relative links resolve inside the repository. Images with absolute `raw.githubusercontent.com/<owner>/<repo>/main/...` URLs work on GitHub and package sites alike.
- **Settings worth checking (route to engineering):** merge methods, auto-delete head branches, empty Wiki/Projects tabs, private vulnerability reporting, required checks.
- **Community profile:** `gh api repos/<owner>/<repo>/community/profile` reports which health files exist.

## npm
- The package page renders the README shipped in the published tarball, so README changes appear only after a release. Images loaded by absolute URL update without a release.
- `description`, `keywords`, `homepage`, `repository`, `bugs` and `license` show on the page or feed search; `engines` is not displayed, so state runtime requirements in the README. Check fields with `npm view <pkg>`.
- Relative README links and images resolve on npmjs.com only when `repository` points to a supported host such as GitHub; without it they break. Absolute URLs are safest. Check by clicking on the live page; the site may block automated browsers.
- `npm pack --dry-run` shows exactly what ships.

## Pi packages (packages with the `pi-package` keyword only)
- Topics and keywords include `pi-package`, `pi-extension`, `pi-coding-agent`.
- Install is `pi install npm:<name>`; offer `pi -e npm:<name>` to try without installing.
- Explain in one sentence that Pi is a terminal coding agent, linked.
- The pi.dev package gallery lists packages with the `pi-package` keyword and shows `pi.image` (PNG, JPEG, GIF or WebP) or `pi.video` (MP4; takes precedence) from package.json. It updates on the next npm release. A 2:1 card reads better as a thumbnail than a raw screenshot.
- Only for an author's own family of Pi packages: sister repositories share the README skeleton, base topics, a license and a cross-linking footer (for example "More pi-* tools").
