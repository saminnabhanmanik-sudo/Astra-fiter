# ASTRA FIGHTERS — কীভাবে চালাবেন ও APK বানাবেন

## ১) সঙ্গে সঙ্গে খেলে দেখুন (কম্পিউটারে)
`index.html` ফাইলটা Chrome-এ খুলুন। কিবোর্ডে খেলা যায়:
- P1: W A S D + F (□) G (△) V (×) B (○)
- P2: তীর চিহ্ন + J (□) K (△) N (×) M (○)

## ২) APK বানানোর সহজ উপায় (ইন্টারনেট থাকলে, কোনো ইনস্টল ছাড়া)
1. https://app.netlify.com/drop এ গিয়ে পুরো ফোল্ডারটা ড্র্যাগ করুন — একটা https লিংক পাবেন।
2. https://www.pwabuilder.com এ সেই লিংক দিন → Package for stores → Android → Download।
3. ZIP-এর ভেতরের APK ফোনে ইনস্টল করুন।

## ৩) নিজের পিসিতে APK বানানো (Capacitor)
দরকার: Node 18+, JDK 17, Android Studio (SDK)।
```
./build-apk.sh
```
শেষে APK পাবেন: `android/app/build/outputs/apk/debug/app-debug.apk`
(স্ক্রিপ্ট নিজেই Landscape লক বসিয়ে দেয়।)

## ফাইল তালিকা
index.html · style.css · game.js · game.json · manifest.json · capacitor.config.json · sw.js · icon-*.png
