# Quick Testing Guide

## Step 1: Load the Extension

1. Open Chrome
2. Go to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top-right)
4. Click **"Load unpacked"**
5. Navigate to and select the `extension` folder:
   ```
   C:\Users\shriy\InteractGen-VoiceTourGuide\extension
   ```

## Step 2: Grant Permissions

When you first use it:
- Chrome will ask for microphone permission - **Click "Allow"**
- The extension needs access to all websites (already configured)

## Step 3: Test on a Website

1. Go to any website (try: `github.com`, `amazon.com`, or `wikipedia.org`)
2. Look for the **floating microphone button** in the bottom-right corner
3. **Click the button**
4. You should see instructions appear

## Step 4: Try Voice Commands

Say these commands clearly:

1. **"Give me a tour"** - Should start a guided tour
2. **"Go to pricing"** - Navigates to pricing section (if available)
3. **"Scroll down"** - Scrolls the page
4. **"Explain this page"** - Gives page summary
5. **"Help"** - Shows available commands

## Troubleshooting

### Button Not Appearing?
- **Refresh the page** (F5)
- Check browser console (F12) for errors
- Verify extension is enabled in `chrome://extensions/`

### Microphone Not Working?
- Check if microphone permission was granted
- Go to `chrome://settings/content/microphone`
- Ensure the site has permission
- Try refreshing the page

### Commands Not Recognized?
- Speak clearly and wait for the listening indicator
- Make sure you're using Chrome (best support)
- Check console for errors (F12)

### Extension Not Loading?
- Check `chrome://extensions/` for error messages
- Ensure all files are in the extension folder:
  - manifest.json
  - contentScript.js
  - voiceAssistant.js
  - styles.css
  - popup.html
  - popup.js

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Floating button appears on websites
- [ ] Button is draggable
- [ ] Clicking button shows instructions
- [ ] Microphone permission prompt appears
- [ ] Voice commands are recognized
- [ ] "Give me a tour" starts a tour
- [ ] Tour navigation works (next/previous)
- [ ] "Go to [section]" navigates correctly
- [ ] Scroll commands work
- [ ] Popup (extension icon) shows status

## Expected Behavior

1. **First Click**: Shows instructions, starts listening
2. **During Tour**: Highlights elements, shows overlay
3. **Voice Commands**: Should respond within 1-2 seconds
4. **Visual Feedback**: Button changes color when listening (red)

## Debug Mode

Open browser console (F12) and type:
```javascript
window.voiceAssistant  // Should show the assistant object
window.voiceAssistant.state  // Check current state
```

## Next Steps After Testing

If everything works:
- Generate proper icons using `create-icons.html`
- Customize commands in `voiceAssistant.js`
- Adjust styles in `styles.css`

Happy testing! 🎤

