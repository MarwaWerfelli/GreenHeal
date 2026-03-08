@echo off
echo Starting Android Debug Bridge logs...
echo Look for [VISUALIZATION] and [ROOM_VIZ] messages
echo Press Ctrl+C to stop
echo.
adb logcat | findstr /C:"[VISUALIZATION]" /C:"[ROOM_VIZ]" /C:"ReactNativeJS"
