# Windows App - Social Media Forensic Tool

This is the Windows application for the Social Media Forensic Tool. It provides a graphical user interface for examiners to manage cases and capture screenshots from various social media platforms.

## Tech Stack

- **Electron**: Wrapper for creating the desktop application with Node.js
- **React**: Frontend UI library for the renderer process
- **Playwright (Node.js)**: Browser automation API
- **JavaScript**: Primary language

## Project Structure

```
windows-app/
├── electron/                  # Main process (Node.js)
│   ├── main.js                # Application entry point
│   ├── preload.js             # Preload script for IPC
│   └── ipc-handlers/          # IPC handlers (stubs)
├── src/                       # Renderer process (React)
│   ├── pages/                 # Page components
│   ├── components/            # Reusable UI components
│   ├── routes/                # Routing configuration
│   ├── services/              # Service layer (mocked for now)
│   ├── assets/                # Static assets (icons, styles)
│   ├── App.jsx                # Root React component
│   └── index.jsx              # Entry point for React renderer
├── automation/                # Backend automation (to be plugged in)
│   ├── core/                  # Core automation utilities
│   └── platforms/configs/     # Platform-specific selectors
├── data/                      # Local data storage (for demo)
├── report-pipeline-bridge/    # Bridge to report generation
├── public/                    # Public HTML file
├── package.json               # Dependencies and scripts
└── electron-builder.yml       # Packaging configuration
```

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository
2. Navigate to the `windows-app` directory:
   ```bash
   cd windows-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the application in development mode:
```bash
npm start
```

This will launch the Electron app with the React frontend.

### Building for Production

To package the application as a Windows executable:
```bash
npm run build
```

The packaged application will be available in the `build` directory.

## Features (Planned)

- Examiner login and authentication
- Case management (create, view, list cases)
- Platform selection for capture (Instagram, Facebook, Twitter, etc.)
- Progress tracking during capture
- Integration with report generation pipeline

## Notes

- The service layer (`src/services/`) is currently mocked for UI development. In production, these services will make IPC calls to the Electron main process which will then trigger the actual automation.
- The automation layer (`automation/`) contains the Playwright-based implementation for browser automation and screenshot capturing.
- Platform-specific selectors are stored in `automation/platforms/configs/` as JSON files.

## License

MIT