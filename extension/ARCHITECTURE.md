# Architecture Overview

## Design Principles

1. **Client-Side Only** - No backend, no network requests
2. **Lightweight** - Vanilla JavaScript, no heavy frameworks
3. **Non-Intrusive** - Minimal UI that doesn't break page styles
4. **Modular** - Clear separation of concerns
5. **Extensible** - Easy to add new commands

## File Responsibilities

### manifest.json
- Defines extension permissions and structure
- Configures content scripts to run on all URLs
- Sets up web accessible resources

### contentScript.js
- **Purpose**: Entry point that runs on every page
- **Responsibilities**:
  - Creates floating button
  - Makes button draggable
  - Loads voiceAssistant.js when activated
  - Handles button interactions

### voiceAssistant.js
- **Purpose**: Core logic for all functionality
- **Responsibilities**:
  - DOM scanning and section mapping
  - Speech recognition setup
  - Command parsing and routing
  - Tour generation and management
  - Navigation and scrolling
  - UI overlay management

### styles.css
- **Purpose**: Scoped styling
- **Features**:
  - Unique class prefixes (voice-nav-*)
  - Won't conflict with page styles
  - Modern, minimal design
  - Smooth animations

### popup.html/js
- **Purpose**: Extension popup UI
- **Features**:
  - Status display
  - Enable/disable toggle
  - Speech API availability check

## Data Flow

```
User clicks button
    ↓
contentScript.js loads voiceAssistant.js
    ↓
VoiceAssistant class initializes
    ↓
DOM scan creates section map
    ↓
User speaks command
    ↓
Speech Recognition captures audio
    ↓
Command parsed in handleCommand()
    ↓
Action executed (navigate, tour, scroll, etc.)
    ↓
Feedback via Speech Synthesis
```

## State Management

Simple object-based state:
```javascript
{
    mode: 'idle' | 'listening' | 'inTour',
    sections: Map<keyword, element>,
    tourSteps: Array<{element, keyword, description}>,
    currentTourStep: number,
    isActive: boolean
}
```

## DOM Scanning Strategy

1. **Scan Headings** - Look for h1-h6 with keywords
2. **Scan Links/Buttons** - Find CTAs and navigation
3. **Scan Sections** - Check IDs and data attributes
4. **Build Map** - Create keyword → element mapping
5. **Cache Results** - Re-scan only when needed

## Command Processing

1. **Normalize** - Convert to lowercase
2. **Pattern Match** - Check for command patterns
3. **Route** - Execute appropriate handler
4. **Feedback** - Speak confirmation

## Tour System

1. **Generate Steps** - From detected sections
2. **Show Overlay** - Dim background, highlight element
3. **Navigate** - Scroll to element, speak description
4. **Control** - Next/previous via voice or buttons

## Error Handling

- Graceful degradation if Speech API unavailable
- Clear error messages for users
- Fallback behaviors where possible
- Console logging for debugging

## Performance Considerations

- DOM scan runs once per page load
- Lazy loading of voice assistant
- Efficient element queries
- Minimal DOM manipulation
- Smooth animations with CSS

## Security & Privacy

- No data collection
- No network requests
- No storage of user data
- Minimal permissions required
- All processing local

## Extension Points

### Adding New Commands

Edit `voiceAssistant.js`, add to `handleCommand()`:
```javascript
if (lowerTranscript.includes('new command')) {
    // Your logic
    this.speak('Response');
    return;
}
```

### Customizing Tours

Modify `startTour()` to change:
- Which elements are included
- How steps are ordered
- What descriptions are shown

### Styling

Edit `styles.css`:
- Button appearance
- Tour overlay design
- Highlight colors
- Animations

## Testing Strategy

1. **Manual Testing**
   - Test on various websites
   - Try different commands
   - Check error handling

2. **Browser Compatibility**
   - Chrome (primary)
   - Edge (should work)
   - Others (may have limitations)

3. **Edge Cases**
   - Pages with no sections
   - Dynamic content
   - SPAs (Single Page Apps)
   - Iframe content

## Future Enhancements

Possible improvements:
- Better NLP for command understanding
- More sophisticated tour algorithms
- Custom tour creation
- Keyboard shortcuts
- Accessibility improvements
- Multi-language support

