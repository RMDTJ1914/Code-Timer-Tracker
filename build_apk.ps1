# =====================================================================
# Code Timer Tracker — Android APK Build Script
# Compiles a 100% Offline Standalone Android Application
# =====================================================================

$ErrorActionPreference = "Stop"

$sdkDir = "C:\Users\MOHAMMAD\AppData\Local\Android\Sdk"
$buildToolsDir = "$sdkDir\build-tools\34.0.0"
$platformDir = "$sdkDir\platforms\android-34"
$jdkDir = "C:\Program Files\Android\Android Studio\jbr"

$env:JAVA_HOME = $jdkDir
$env:PATH = "$jdkDir\bin;$buildToolsDir;$env:PATH"

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

$aapt2 = "$buildToolsDir\aapt2.exe"
$d8 = "$buildToolsDir\d8.bat"
$zipalign = "$buildToolsDir\zipalign.exe"
$apksigner = "$buildToolsDir\apksigner.bat"
$javac = "$jdkDir\bin\javac.exe"
$jar = "$jdkDir\bin\jar.exe"
$keytool = "$jdkDir\bin\keytool.exe"
$androidJar = "$platformDir\android.jar"

$buildDir = "d:\Projects\Countdown Timer\android-build"
$releaseDir = "d:\Projects\Countdown Timer\release"

Write-Host ">>> Cleaning build directories..." -ForegroundColor Cyan
if (Test-Path $buildDir) { Remove-Item -Path $buildDir -Recurse -Force }
New-Item -ItemType Directory -Path "$buildDir\src\com\codetimer\app" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\res\values" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\res\mipmap-mdpi" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\res\mipmap-hdpi" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\res\mipmap-xhdpi" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\res\mipmap-xxhdpi" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\res\mipmap-xxxhdpi" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\res\mipmap-anydpi-v26" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\assets\vendor\fontawesome\js" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\assets\vendor\fontawesome\css" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\assets\vendor\fontawesome\webfonts" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\assets\icons" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\gen" -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\bin" -Force | Out-Null
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

Write-Host ">>> Creating Android Manifest & Resources..." -ForegroundColor Cyan

# 1. AndroidManifest.xml
$manifestContent = @"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.codetimer.app"
    android:versionCode="20402"
    android:versionName="2.4.2">

    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true"
        android:allowBackup="true"
        android:supportsRtl="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"@
[System.IO.File]::WriteAllText("$buildDir\AndroidManifest.xml", $manifestContent, $utf8NoBom)

# 2. strings.xml
$stringsContent = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Code Timer</string>
</resources>
"@
[System.IO.File]::WriteAllText("$buildDir\res\values\strings.xml", $stringsContent, $utf8NoBom)

# 3. colors.xml
$colorsContent = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#090D16</color>
</resources>
"@
[System.IO.File]::WriteAllText("$buildDir\res\values\colors.xml", $colorsContent, $utf8NoBom)

# 4. styles.xml
$stylesContent = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.DeviceDefault.NoActionBar">
        <item name="android:windowBackground">#090D16</item>
        <item name="android:statusBarColor">#090D16</item>
        <item name="android:navigationBarColor">#0F172A</item>
    </style>
</resources>
"@
[System.IO.File]::WriteAllText("$buildDir\res\values\styles.xml", $stylesContent, $utf8NoBom)

# 5. Adaptive Icons for Android 8.0+ (API 26+)
$adaptiveIconXml = @"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"@
[System.IO.File]::WriteAllText("$buildDir\res\mipmap-anydpi-v26\ic_launcher.xml", $adaptiveIconXml, $utf8NoBom)
[System.IO.File]::WriteAllText("$buildDir\res\mipmap-anydpi-v26\ic_launcher_round.xml", $adaptiveIconXml, $utf8NoBom)

# 6. Copy Launcher Icons across all densities
$densities = @{
    "mdpi"    = @{ "size" = 48;  "fg" = "mdpi" }
    "hdpi"    = @{ "size" = 72;  "fg" = "hdpi" }
    "xhdpi"   = @{ "size" = 96;  "fg" = "xhdpi" }
    "xxhdpi"  = @{ "size" = 144; "fg" = "xxhdpi" }
    "xxxhdpi" = @{ "size" = 192; "fg" = "xxxhdpi" }
}

foreach ($d in $densities.Keys) {
    $info = $densities[$d]
    $sz = $info.size
    $fg = $info.fg
    Copy-Item "icons\icon-$sz.png" "$buildDir\res\mipmap-$d\ic_launcher.png" -Force
    Copy-Item "icons\icon-round-$sz.png" "$buildDir\res\mipmap-$d\ic_launcher_round.png" -Force
    Copy-Item "icons\icon-fg-$fg.png" "$buildDir\res\mipmap-$d\ic_launcher_foreground.png" -Force
}

# 7. Copy Web Assets into assets/
Copy-Item "index.html" "$buildDir\assets\index.html"
Copy-Item "style.css" "$buildDir\assets\style.css"
Copy-Item "script.js" "$buildDir\assets\script.js"
Copy-Item "manifest.json" "$buildDir\assets\manifest.json"
Copy-Item "sw.js" "$buildDir\assets\sw.js"
Copy-Item "vendor\chart.umd.min.js" "$buildDir\assets\vendor\chart.umd.min.js"
Copy-Item "vendor\fontawesome\js\*" "$buildDir\assets\vendor\fontawesome\js\"
Copy-Item "vendor\fontawesome\css\all.min.css" "$buildDir\assets\vendor\fontawesome\css\all.min.css"
Copy-Item "vendor\fontawesome\webfonts\*" "$buildDir\assets\vendor\fontawesome\webfonts\"
Copy-Item "icons\*" "$buildDir\assets\icons\"

# 8. MainActivity.java with Universal File Access
$javaContent = @"
package com.codetimer.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Immersive dark status and navigation bars
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(0xFF090D16);
        window.setNavigationBarColor(0xFF0F172A);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setBackgroundColor(0xFF090D16);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // 100% Offline Loading from Internal APK Assets
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
"@
[System.IO.File]::WriteAllText("$buildDir\src\com\codetimer\app\MainActivity.java", $javaContent, $utf8NoBom)


Write-Host ">>> Compiling resources with AAPT2..." -ForegroundColor Cyan
& $aapt2 compile --dir "$buildDir\res" -o "$buildDir\compiled_res.zip"

Write-Host ">>> Linking resources with AAPT2..." -ForegroundColor Cyan
& $aapt2 link -I $androidJar --manifest "$buildDir\AndroidManifest.xml" -o "$buildDir\unaligned.apk" --java "$buildDir\gen" -A "$buildDir\assets" "$buildDir\compiled_res.zip"

Write-Host ">>> Compiling Java source with Javac..." -ForegroundColor Cyan
$javaFiles = @(
    "$buildDir\gen\com\codetimer\app\R.java",
    "$buildDir\src\com\codetimer\app\MainActivity.java"
)
& $javac -d "$buildDir\bin" -cp $androidJar -source 11 -target 11 $javaFiles

Write-Host ">>> Compiling Dalvik bytecode with D8..." -ForegroundColor Cyan
$classFiles = (Get-ChildItem -Path "$buildDir\bin" -Filter "*.class" -Recurse | Select-Object -ExpandProperty FullName)
& $d8 --output "$buildDir" --min-api 24 $classFiles

if (-not (Test-Path "$buildDir\classes.dex")) {
    throw "ERROR: classes.dex was NOT generated by D8!"
}

Write-Host ">>> Adding classes.dex to APK..." -ForegroundColor Cyan
Push-Location $buildDir
& $jar uf "unaligned.apk" "classes.dex"
Pop-Location

Write-Host ">>> Aligning APK with zipalign..." -ForegroundColor Cyan
& $zipalign -v -p -f 4 "$buildDir\unaligned.apk" "$buildDir\aligned.apk"

Write-Host ">>> Generating Keystore if needed..." -ForegroundColor Cyan
$keystore = "$releaseDir\release.keystore"
if (-not (Test-Path $keystore)) {
    & $keytool -genkey -v -keystore $keystore -alias codetimer -keyalg RSA -keysize 2048 -validity 10000 -storepass "codetimer123" -keypass "codetimer123" -dname "CN=Mohammad Abu Khashreef, OU=Code Elta6ur, O=Code Elta6ur, L=Damascus, ST=Damascus, C=SY"
}

Write-Host ">>> Signing APK with apksigner..." -ForegroundColor Cyan
$finalApk = "$releaseDir\code-timer-tracker-v2.4.2.apk"
Copy-Item "$buildDir\aligned.apk" $finalApk -Force
& $apksigner sign --ks $keystore --ks-pass "pass:codetimer123" --ks-key-alias "codetimer" --key-pass "pass:codetimer123" $finalApk

# Also copy as code-timer-tracker.apk for universal direct download link
Copy-Item $finalApk "$releaseDir\code-timer-tracker.apk" -Force

Write-Host ">>> Verifying APK signature..." -ForegroundColor Cyan
& $apksigner verify -v $finalApk

$apkSize = (Get-Item $finalApk).Length / 1MB
Write-Host "========================================================" -ForegroundColor Green
Write-Host "SUCCESS! Android Release APK Built Successfully!" -ForegroundColor Green
Write-Host "Path: $finalApk" -ForegroundColor Green
Write-Host "Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
