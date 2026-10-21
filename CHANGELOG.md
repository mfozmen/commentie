# Changelog

## [0.2.0](https://github.com/mfozmen/commentie/compare/v0.1.3...v0.2.0) (2026-10-21)


### Features

* add OpenCode plugin ([#2](https://github.com/mfozmen/commentie/issues/2)) ([8e9060a](https://github.com/mfozmen/commentie/commit/8e9060aa5403d44bfd80935a143159067a921c11))


### Documentation

* split Claude Code and OpenCode setup in the README ([b36dfa6](https://github.com/mfozmen/commentie/commit/b36dfa68d9cf96423019d26898e43ba301075b05))

## 0.1.3 (2026-10-19)

First tagged release.

### Features

* Comments rule skill, cleanup skill, warning-only comment critic, `check_comments.py` diff checker, opt-in after-edit hook and install skill.
* Install skill explains `check_comments.py` as a free, fast, deterministic gate before offering pre-commit or CI wiring.

### Bug Fixes

* Treat keyword-led prose as narration and catch `old:` prefixes.
* Keep comment offsets aligned when blanking string literals.
