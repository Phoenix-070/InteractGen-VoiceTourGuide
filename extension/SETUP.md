# Quick Setup Guide

## Installation Steps

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)

2. **Load the Extension**
   - Click "Load unpacked"
   - Select the `extension` folder

3. **Grant Permissions**
   - When prompted, allow microphone access
   - The extension needs access to all websites

4. **Start Using**
   - Navigate to any website
   - Look for the floating microphone button (bottom-right)
   - Click it and say "Give me a tour"

## Icon Setup (Optional)

If you want custom icons:
1. Open `create-icons.html` in a browser
2. Generate and download the icons
3. Place them in the `icons/` folder

**Note**: The extension works without custom icons (Chrome will use a default icon).

## File Structure

```
extension/
├── manifest.json          ✅ Extension configuration
├── contentScript.js       ✅ Injects button on pages
├── voiceAssistant.js     ✅ Core voice & navigation logic
├── styles.css            ✅ UI styles
├── popup.html            ✅ Extension popup
├── popup.js              ✅ Popup logic
├── icons/               ⚠️  Create icon files here (optional)
├── README.md             ✅ Full documentation
└── SETUP.md             ✅ This file
```

## Testing

1. Go to any website (e.g., github.com, amazon.com)
2. Click the floating button
3. Say: "Give me a tour"
4. The extension should start a guided tour

## Troubleshooting

- **Button not appearing?** Refresh the page
- **Microphone not working?** Check browser permissions
- **Commands not recognized?** Ensure you're using Chrome/Edge
- **Errors?** Check browser console (F12)

## Next Steps

- Read `README.md` for full documentation
- Customize commands in `voiceAssistant.js`
- Modify styles in `styles.css`

Enjoy your voice navigation assistant! 🎤

