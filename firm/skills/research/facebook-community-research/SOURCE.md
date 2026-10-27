# Facebook CLI evaluation and terms

Inspected [hieu-lee/facebook-cli](https://github.com/hieu-lee/facebook-cli) (MIT), README, CI and failure contracts as of release v0.1.5 (2026-10-25). This adapter is new code and is read-only by design; it does not install, authenticate or enable Facebook CLI.

[Meta's explanation of scraping restrictions](https://about.fb.com/news/2021/04/how-we-combat-scraping/) and [Facebook help center](https://www.facebook.com/help/463983701520800) document permission concerns. **An account, an API key, this script's environment flag or user request alone does not grant platform authorization.** No live-account testing or bulk collection was performed for this PR.
