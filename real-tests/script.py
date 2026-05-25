import sys
import subprocess
import os

LOX_BINARY = ["node", "out/cli.js"]

for lox_file in filter(lambda f: f.endswith(".lox"), sorted(os.listdir("real-tests"))):
    path = f"real-tests/{lox_file}"
    print(f"$ {' '.join(LOX_BINARY)} {path}")
    result = subprocess.run(
        LOX_BINARY + [path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.DEVNULL,
    )
    out = result.stdout.decode().strip()
    err = result.stderr.decode().strip()
    print(out)
    if err:
        print(err, file=sys.stderr)
    print()
    if result.returncode != 0:
        sys.exit(1)

print("Todo OK")
