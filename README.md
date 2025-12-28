# Focusly Dashboard ⚡

A modern, all-in-one productivity dashboard to help you plan your day, stay focused, and track your progress. Built with vanilla JavaScript and a beautiful, responsive UI.

## Features

### 📝 Daily Task Management
- Add, edit, and delete tasks with ease
- Categorize tasks (Work, Study, Personal)
- Set priority levels (Low, Medium, High)
- Track task status (Todo, In Progress, Done)
- Set due times for tasks
- Visual progress indicators
- Clear completed tasks with one click

### 🎯 Weekly Goals
- Set and track weekly objectives
- Monitor goal completion rates
- Stay aligned with long-term targets

### ⏱️ Pomodoro Focus Timer
- Built-in focus sessions (25-minute default)
- Customizable break intervals (5-minute default)
- Session history tracking
- Focus time analytics (7-day overview)
- Audio notifications for session completion

### 📊 Analytics & Insights
- Task completion metrics
- Focus session statistics
- Visual charts and graphs
- Weekly productivity trends
- Hero metrics dashboard showing:
  - Tasks completed
  - Focus minutes (7-day total)
  - Active weekly goals

### 🎨 Themes
- Dark mode (default)
- Light mode
- Smooth theme transitions
- Persistent theme preference

### 📱 Responsive Design
- Mobile-friendly interface
- Collapsible sidebar for small screens
- Touch-optimized interactions
- Adapts to any screen size

## Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, flexbox, grid, animations
- **JavaScript (ES6+)** - Vanilla JS with no dependencies
- **LocalStorage API** - Data persistence
- **Google Fonts** - Space Grotesk & DM Sans

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or build tools required!

### Installation

1. Clone or download this repository:
   ```bash
   git clone <repository-url>
   cd working-dashboard
   ```

2. Open `index.html` in your web browser:
   - Double-click the file, or
   - Right-click and select "Open with" your browser, or
   - Use a local development server (optional):
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve
     ```

3. Start using the dashboard! All data is stored locally in your browser.

## Usage

### Managing Tasks
1. Fill in the task form with title, category, priority, status, and optional due time
2. Click "Add" to create a new task
3. Click the edit (✏️) icon to modify an existing task
4. Click the delete (🗑️) icon to remove a task
5. Use "Clear Done" to remove all completed tasks

### Focus Timer
1. Navigate to the "Focus" section
2. Customize focus and break durations if needed
3. Click "Start" to begin a focus session
4. The timer will track your session and log it automatically
5. View your focus history and total minutes

### Weekly Goals
1. Navigate to the "Goals" section
2. Enter your goal description
3. Add the goal to track it throughout the week
4. Check off goals as you complete them

### Analytics
1. Navigate to the "Analytics" section
2. View task completion charts
3. Monitor focus time trends
4. Review productivity insights

### Theme Toggle
- Use the theme toggle switch in the sidebar footer
- Your preference is saved automatically

## Project Structure

```
working-dashboard/
├── index.html          # Main HTML structure
├── styles.css          # All styling and themes
├── script.js           # Application logic
└── README.md           # This file
```

## Features in Detail

### Data Persistence
All your data (tasks, goals, focus logs, theme preference) is automatically saved to your browser's LocalStorage. Your data persists between sessions without requiring a backend server.

### Keyboard Shortcuts
- Enter in any input field will submit the respective form
- Escape closes mobile sidebar (on small screens)

### Visual Design
- Modern glassmorphism effects
- Smooth animations and transitions
- Color-coded priority indicators
- Progress bars and visual feedback
- Responsive grid layout

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Local Development

Since this is a static web application with no build process:

1. Make changes to HTML, CSS, or JS files
2. Refresh your browser to see updates
3. Use browser DevTools for debugging

## Data Storage

The app uses browser LocalStorage with the following keys:
- `mwd_tasks` - Task list
- `mwd_goals` - Weekly goals
- `mwd_focus_logs` - Focus session history
- `mwd_theme` - Theme preference

### Clearing Data
To reset all data, open browser DevTools console and run:
```javascript
localStorage.clear()
```

## Customization

### Changing Colors
Edit CSS custom properties in [styles.css](styles.css):
```css
:root {
  --accent: #38d1c4;      /* Primary accent color */
  --accent-2: #7ad8ff;    /* Secondary accent */
  /* ... more variables */
}
```

### Timer Defaults
Modify timer settings in [script.js](script.js):
```javascript
let currentSession = {
  focusMinutes: 25,    // Focus duration
  breakMinutes: 5,     // Break duration
  // ...
};
```

## Credits

**Made by Kartik Sadhu**

## License

This project is available for personal and educational use.

## Contributing

Feel free to fork this project and make it your own! Some ideas for enhancements:
- Add categories customization
- Export/import data functionality
- More chart types
- Keyboard shortcuts
- Recurring tasks
- Task tags or labels
- Calendar view
- Notifications API integration

---

Enjoy staying productive with Focusly! ⚡
