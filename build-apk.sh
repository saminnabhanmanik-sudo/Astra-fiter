#!/usr/bin/env bash
# ASTRA FIGHTERS -> Android APK (Capacitor). Needs: Node 18+, JDK 17, Android SDK (ANDROID_HOME set).
set -e
rm -rf www && mkdir www
cp index.html style.css game.js game.json manifest.json sw.js icon-192.png icon-512.png www/
[ -f package.json ] || npm init -y >/dev/null
npm i @capacitor/core @capacitor/cli @capacitor/android
[ -d android ] || npx cap add android
MAN=android/app/src/main/AndroidManifest.xml
grep -q sensorLandscape "$MAN" || sed -i '0,/<activity/s//<activity android:screenOrientation="sensorLandscape"/' "$MAN"
npx cap sync android
(cd android && ./gradlew assembleDebug)
echo "APK ready: android/app/build/outputs/apk/debug/app-debug.apk"
