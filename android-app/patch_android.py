"""Run after `npx cap add android`. Does three things:
1. Copies google-services.json into the Android project (needed by Firebase App Check).
2. Turns on FLAG_SECURE so screenshots / screen recordings are black.
3. Disables cloud backup of app data."""
import glob, os, re, shutil, sys

# ── 1. google-services.json ──────────────────────────────────────────────────
# The CI workflow writes the real file from a secret before this script runs.
# Fall back to the template committed in the repo so the build still compiles.
gsj_src = "google-services.json"
gsj_dst = "android/app/google-services.json"
if not os.path.exists(gsj_dst):
    if os.path.exists(gsj_src):
        shutil.copy(gsj_src, gsj_dst)
        print("google-services.json copied to", gsj_dst)
    else:
        print("WARNING: google-services.json not found; Firebase App Check will not work")

# ── 2. FLAG_SECURE ────────────────────────────────────────────────────────────
files = glob.glob("android/app/src/main/java/**/MainActivity.java", recursive=True)
if not files:
    sys.exit("MainActivity.java not found. Did `npx cap add android` run?")
path = files[0]
package = re.search(r"^package\s+([\w.]+);", open(path).read(), re.M).group(1)
open(path, "w").write(f"""package {package};

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {{
    @Override
    public void onCreate(Bundle savedInstanceState) {{
        // Blocks screenshots, screen recording and the recent-apps thumbnail.
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        super.onCreate(savedInstanceState);
    }}
}}
""")
print("FLAG_SECURE added to", path)

# ── 3. No cloud backup ────────────────────────────────────────────────────────
mf = "android/app/src/main/AndroidManifest.xml"
x = open(mf).read()
x = x.replace('android:allowBackup="true"', 'android:allowBackup="false"')
open(mf, "w").write(x)
