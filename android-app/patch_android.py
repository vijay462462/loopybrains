"""Run after `npx cap add android`. Turns on Android's FLAG_SECURE so screenshots and
screen recordings come out black and the recent-apps preview is blank for the whole app."""
import glob, re, sys

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

# Do not let Android back up the app's data to the cloud.
mf = "android/app/src/main/AndroidManifest.xml"
x = open(mf).read()
x = x.replace('android:allowBackup="true"', 'android:allowBackup="false"')
open(mf, "w").write(x)
