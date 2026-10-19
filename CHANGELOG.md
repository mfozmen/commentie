# Changelog

## 0.1.3 (2026-10-19)

First tagged release.

### Features

* Comments rule skill, cleanup skill, warning-only comment critic, `check_comments.py` diff checker, opt-in after-edit hook and install skill.
* Install skill explains `check_comments.py` as a free, fast, deterministic gate before offering pre-commit or CI wiring.

### Bug Fixes

* Treat keyword-led prose as narration and catch `old:` prefixes.
* Keep comment offsets aligned when blanking string literals.
