# Voice Navigation Assistant

A lightweight, production-quality Chrome extension that provides voice-guided navigation for any website. Works entirely client-side with no backend dependencies.

## Features

- 🎤 **Voice Commands** - Navigate websites using natural language
- 🗺️ **Guided Tours** - Automatic tour generation based on page structure
- 📍 **Smart Navigation** - Finds and navigates to sections like "pricing", "contact", "features"
- 🎯 **DOM-Driven** - All logic runs client-side, no server required
- 🎨 **Non-Intrusive** - Minimal UI that doesn't interfere with page content
- ⚡ **Lightweight** - Vanilla JavaScript, no heavy frameworks

## Voice Commands

- **"Give me a tour"** - Start a guided tour of the page
- **"Go to [section]"** - Navigate to a specific section (e.g., "Go to pricing")
- **"Scroll down/up"** - Scroll the page smoothly
- **"Scroll to top/bottom"** - Jump to top or bottom of page
- **"Next/Previous"** - Navigate tour steps
- **"Stop tour"** - End the current tour
- **"Explain this page"** - Get a summary of the page content
- **"Help"** - Show available commands

## Installation

### Step 1: Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension` folder from this project

### Step 2: Grant Permissions

When you first use the extension:
- Allow microphone access when prompted (required for voice commands)
- The extension needs access to all websites to work

### Step 3: Start Using

1. Navigate to any website
2. Look for the floating microphone button (bottom-right)
3. Click it to activate voice navigation
4. Say a command like "Give me a tour"

## Project Structure

```
extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── contentScript.js        # Injects floating button on all pages
├── voiceAssistant.js      # Core logic: DOM scanning, voice, tours
├── styles.css             # Minimal, scoped styles
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── icons/                 # Extension icons (16x16, 48x48, 128x128)
└── README.md              # This file
```

## How It Works

### Architecture

1. **Content Script** (`contentScript.js`)
   - Injects a floating button on all pages
   - Handles button interactions and drag functionality
   - Loads the voice assistant when activated

2. **Voice Assistant** (`voiceAssistant.js`)
   - **DOM Scanning**: Scans page for headings, links, buttons, and sections
   - **Section Mapping**: Creates a keyword → element map for navigation
   - **Speech Recognition**: Uses Web Speech API for voice input
   - **Speech Synthesis**: Uses Web Speech API for voice output
   - **Tour System**: Creates guided tours from detected sections
   - **Command Parsing**: Interprets natural language commands

3. **Styling** (`styles.css`)
   - Scoped styles with unique class prefixes
   - Won't interfere with page styles
   - Modern, minimal design

### DOM Scanning Logic

The extension scans for:
- **Headings** (h1-h6) with keywords in text, id, or class
- **Links & Buttons** with common keywords (pricing, contact, features, etc.)
- **Sections** with IDs or data attributes

Common keywords detected:
- home, about, features, pricing, contact
- sign up, login, products, services
- blog, news, support, help, faq
- buy, shop, cart, checkout, menu

### Command Processing

Commands are processed using simple pattern matching:
- Exact keyword matches
- Partial text matching
- Natural language patterns ("go to", "navigate to", "show me")

## Browser Compatibility

- **Chrome** ✅ (Recommended - full support)
- **Edge** ✅ (Chromium-based, should work)
- **Firefox** ⚠️ (Limited - Web Speech API support varies)
- **Safari** ⚠️ (Limited - Web Speech API support varies)

**Note**: Web Speech API is required. Chrome/Edge have the best support.

## Troubleshooting

### Microphone Not Working
- Ensure microphone permissions are granted
- Check browser settings: `chrome://settings/content/microphone`
- Try refreshing the page

### Speech Recognition Not Available
- Use Chrome or Edge browser
- Check if Web Speech API is enabled
- Some corporate networks may block microphone access

### Extension Not Loading
- Ensure Developer mode is enabled
- Check for errors in `chrome://extensions/`
- Verify all files are present in the extension folder

### Button Not Appearing
- Refresh the page
- Check browser console for errors
- Ensure content script is running (check Extensions page)

## Development

### Testing Locally

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload the test page

### Debugging

- Open browser DevTools (F12)
- Check Console for errors
- Use `window.voiceAssistant` in console to inspect state
- Check Network tab for any failed resource loads

### Code Structure

The code is organized into clear modules:
- **State Management**: Simple object-based state
- **DOM Utilities**: Element visibility, scrolling, highlighting
- **Speech Handling**: Recognition and synthesis wrappers
- **Command Routing**: Pattern matching and command execution
- **UI Management**: Overlay, tooltips, instructions

## Customization

### Adding New Commands

Edit `voiceAssistant.js` and add to `handleCommand()`:

```javascript
if (lowerTranscript.includes('your command')) {
    // Your logic here
    return;
}
```

### Changing Button Position

Edit `styles.css`:

```css
.voice-nav-button {
    bottom: 20px;  /* Change position */
    right: 20px;
}
```

### Modifying Tour Behavior

Edit the `startTour()` method in `voiceAssistant.js` to change how tours are generated.

## Performance

- **Lightweight**: ~50KB total (no dependencies)
- **Fast**: DOM scanning runs once per page load
- **Efficient**: Only activates when button is clicked
- **Non-blocking**: All operations are async

## Security & Privacy

- **No Data Collection**: All processing happens locally
- **No Network Requests**: No backend, no tracking
- **No Storage**: Doesn't store any user data
- **Permissions**: Only requires activeTab and scripting (standard for content scripts)

## License

This project is open source. Feel free to modify and distribute.

## Contributing

Improvements welcome! Focus areas:
- Better command recognition
- More natural language processing
- Additional tour customization options
- Performance optimizations
- Accessibility improvements

---

**Enjoy navigating the web with your voice!** 🎤
