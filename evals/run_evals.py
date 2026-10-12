#!/usr/bin/env python3
"""Run check_comments.py over evals/fixtures and report precision and recall.

Exit 1 when any fixture's findings differ from evals/expected.json.
"""
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    "check_comments", os.path.join(HERE, "..", "scripts", "check_comments.py"))
cc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cc)


def main():
    with open(os.path.join(HERE, "expected.json"), encoding="utf-8") as f:
        expected = {k: v for k, v in json.load(f).items() if not k.startswith("_")}
    tp = fp = fn = 0
    ok = True
    for name, want in sorted(expected.items()):
        with open(os.path.join(HERE, "fixtures", name), encoding="utf-8") as f:
            got = {f"{p}:{n}" for p, n, _ in cc.find_issues(f.read())}
        exp = set(want["script"])
        tp += len(got & exp)
        fp += len(got - exp)
        fn += len(exp - got)
        status = "ok " if got == exp else "BAD"
        ok &= got == exp
        print(f"{status} {name:<26} script={len(got)}/{len(exp)}  critic={want['critic']}")
        for miss in sorted(exp - got):
            print(f"      missed   {miss}")
        for extra in sorted(got - exp):
            print(f"      spurious {extra}")
    prec = tp / (tp + fp) if tp + fp else 1.0
    rec = tp / (tp + fn) if tp + fn else 1.0
    print(f"\nscript precision {prec:.2f}  recall {rec:.2f}  (tp={tp} fp={fp} fn={fn})")
    print("critic verdicts are checked by running commentie:comment-critic on each fixture; see README.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
