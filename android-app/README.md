# RGUKT Spark Android app

A thin Android wrapper (Capacitor) around the website. It loads
https://vijay462462.github.io/rgukt-spark/ so website updates reach the app immediately, and it turns on
Android's `FLAG_SECURE`, so **screenshots, screen recording and the recent-apps preview are blocked inside the app**.

## Get the APK
1. GitHub > Actions > **Build Android app** > Run workflow (it also runs when this folder changes).
2. When it is green, open the run and download the **RGUKT-Spark-apk** artifact (a zip containing `RGUKT-Spark.apk`).
3. Send `RGUKT-Spark.apk` to students. They must allow "Install unknown apps" for the app they open it from.

The APK is signed with Android's debug key, which is fine for sharing inside the class. Publishing on the Play Store
needs your own release key and a developer account.

Android only. The website itself (in Chrome) can still be screenshotted; only this app blocks it.
