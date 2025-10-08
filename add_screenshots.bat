@echo off
echo Adding PixelPainter Screenshots to Documentation...
echo.

REM Create screenshots directory if it doesn't exist
if not exist "docs\screenshots" mkdir "docs\screenshots"

REM Check if screenshot files exist in current directory
if exist "Screenshot 2025-10-08 021948.png" (
    echo Copying Color Picker Interface screenshot...
    copy "Screenshot 2025-10-08 021948.png" "docs\screenshots\color-picker-interface.png"
    echo ✓ Color Picker Interface screenshot added
) else (
    echo ✗ Screenshot 2025-10-08 021948.png not found
)

if exist "Screenshot 2025-10-08 021957.png" (
    echo Copying Channel Color Table screenshot...
    copy "Screenshot 2025-10-08 021957.png" "docs\screenshots\channel-color-table.png"
    echo ✓ Channel Color Table screenshot added
) else (
    echo ✗ Screenshot 2025-10-08 021957.png not found
)

if exist "Screenshot 2025-10-08 022002.png" (
    echo Copying Main Toolbar screenshot...
    copy "Screenshot 2025-10-08 022002.png" "docs\screenshots\main-toolbar.png"
    echo ✓ Main Toolbar screenshot added
) else (
    echo ✗ Screenshot 2025-10-08 022002.png not found
)

echo.
echo Screenshot setup complete!
echo.
echo To add screenshots manually:
echo 1. Copy your screenshot files to the project root
echo 2. Run this script again
echo 3. Or manually copy files to docs\screenshots\ with these names:
echo    - color-picker-interface.png
echo    - channel-color-table.png  
echo    - main-toolbar.png
echo.
pause
