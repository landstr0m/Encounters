"""Check the GitHub Actions workflow files before they are pushed.

Run from the repo root:  python tools/check_workflows.py
Also runs from the pre-push hook (.githooks/pre-push). An invalid workflow file
never starts on GitHub, so the Tests workflow cannot catch it: this check runs
on your machine first. Needs PyYAML (pip install pyyaml).
"""
import glob
import os
import sys

try:
    import yaml
except ImportError:
    sys.exit("check_workflows: PyYAML is missing. Install it with: pip install pyyaml")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def problems(path):
    """Return a list of 'file:line: message' strings for one workflow file."""
    rel = os.path.relpath(path, ROOT)
    try:
        with open(path, encoding="utf-8") as f:
            doc = yaml.safe_load(f)
    except yaml.YAMLError as e:
        mark = getattr(e, "problem_mark", None)
        line = f":{mark.line + 1}" if mark else ""
        why = getattr(e, "problem", None) or str(e)
        return [f"{rel}{line}: invalid YAML: {why} (a ': ' inside a value needs quotes)"]
    if not isinstance(doc, dict):
        return [f"{rel}: not a workflow (expected keys such as 'on' and 'jobs')"]
    out = []
    # PyYAML reads the bare key `on` as True
    if "on" not in doc and True not in doc:
        out.append(f"{rel}: missing 'on' (what starts the workflow)")
    jobs = doc.get("jobs")
    if not isinstance(jobs, dict) or not jobs:
        out.append(f"{rel}: missing 'jobs'")
        return out
    for name, job in jobs.items():
        if not isinstance(job, dict):
            out.append(f"{rel}: job '{name}' is not a mapping")
            continue
        if "uses" in job:  # a reusable workflow call has no runs-on or steps
            continue
        if "runs-on" not in job:
            out.append(f"{rel}: job '{name}' has no 'runs-on'")
        if not isinstance(job.get("steps"), list):
            out.append(f"{rel}: job '{name}' has no 'steps' list")
    return out


def main():
    files = sorted(glob.glob(os.path.join(ROOT, ".github", "workflows", "*.y*ml")))
    found = [p for f in files for p in problems(f)]
    for p in found:
        print(p)
    if found:
        sys.exit(1)
    print(f"check_workflows: {len(files)} workflow files OK")


if __name__ == "__main__":
    main()
