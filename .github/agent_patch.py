import os, re, sys, subprocess
from pathlib import Path
from openai import OpenAI

REPO = Path(".").resolve()
TASK = os.environ.get("TASK") or "Improve docs"
MODEL = os.environ.get("MODEL") or "gpt-4.1-mini"
EFFORT = os.environ.get("REASONING_EFFORT") or "low"
ALLOWED_DIRS = [p.strip() for p in os.environ.get("ALLOWED_DIRS", "backend/,frontend/,/sql_setup/").split(",") if p.strip()]
BLOCKED_DIRS = [".github/", ".git/"]
MAX_EDIT_LINES = int(os.environ.get("MAX_EDIT_LINES", "1200"))

def repo_glance(limit=300):
    files = subprocess.check_output(["git", "ls-files"], text=True).splitlines()
    # Only show files under allowed dirs to reduce context size
    allowed = [f for f in files if any(f.startswith(d) for d in ALLOWED_DIRS)]
    return "\n".join(allowed[:limit])

SYSTEM = "You output ONLY a unified diff (git-style) patch that applies with `git apply --index`."

INSTRUCTIONS = f"""
You are a careful software engineer.

Task: {TASK}

Constraints:
- You may only modify files under: {", ".join(ALLOWED_DIRS)}.
- NEVER modify files under: {", ".join(BLOCKED_DIRS)}.
- Keep changes minimal and focused; avoid sweeping refactors.
- Use relative repo paths.
- If no change is needed, output exactly: NO_CHANGE

Project files sample (subset from allowed dirs):
{repo_glance()}

Output format:
-----BEGIN PATCH
<unified diff as if produced by `git diff`>
-----END PATCH
"""

client = OpenAI()

kwargs = {}
# o-series support reasoning effort; safe to ignore for non-o models
if MODEL.startswith(("o1", "o3", "o4")) and EFFORT:
    kwargs["reasoning"] = {"effort": EFFORT}

res = client.responses.create(
    model=MODEL,
    instructions=SYSTEM,
    input=INSTRUCTIONS,
    max_output_tokens=8192,
    **kwargs,
)

text = res.output_text.strip()

if text == "NO_CHANGE":
    print("Model returned NO_CHANGE")
    raise SystemExit(0)

m = re.search(r"-----BEGIN PATCH\s*(.*?)\s*-----END PATCH", text, re.S)
if not m:
    print("No patch block found.")
    raise SystemExit(1)

patch = m.group(1).strip()
(p := REPO / "ai.patch").write_text(patch, encoding="utf-8")

def changed_paths_from_patch(patch_text: str):
    paths = []
    for line in patch_text.splitlines():
        if line.startswith("diff --git "):
            parts = line.split()
            if len(parts) >= 4:
                a = parts[2][2:] if parts[2].startswith("a/") else parts[2]
                b = parts[3][2:] if parts[3].startswith("b/") else parts[3]
                paths.extend([a, b])
    return sorted(set(paths))

def is_allowed(path: str) -> bool:
    if any(path.startswith(b) for b in BLOCKED_DIRS):
        return False
    return any(path.startswith(d) for d in ALLOWED_DIRS)

# Guardrails: only allowed dirs, and cap total +/- lines
changed = changed_paths_from_patch(patch)
if not changed:
    print("No changed paths detected in patch header.")
    raise SystemExit(1)

disallowed = [p for p in changed if not is_allowed(p)]
if disallowed:
    print("Patch touches disallowed paths:", disallowed)
    raise SystemExit(1)

edit_lines = 0
for line in patch.splitlines():
    if (line.startswith("+") or line.startswith("-")) and not (line.startswith("+++") or line.startswith("---")):
        edit_lines += 1

if edit_lines > MAX_EDIT_LINES:
    print(f"Patch too large ({edit_lines} changed lines). Limit: {MAX_EDIT_LINES}")
    raise SystemExit(1)

# Apply the patch and stage changes; the Action will commit+PR
try:
    subprocess.run(
        ["git", "apply", "--index", "--whitespace=fix", str(p)],
        check=True,
        text=True,
    )
    print("Patch applied and staged.")
except subprocess.CalledProcessError:
    print("Patch failed to apply.")
    print(patch)
    raise SystemExit(1)
