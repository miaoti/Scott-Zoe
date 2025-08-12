# Scott & Zoe Love Story - iOS App

A beautiful iOS app built with SwiftUI to track your love story, memories, and special moments together.

## Features

### 📱 Core Features
- **Dashboard**: Overview of your relationship with quick stats and recent activity
- **Photo Gallery**: Upload, organize, and view photos with categories and favorites
- **Love Counter**: Interactive love tracking with animations and haptic feedback
- **Prize Wheel**: Fun spinning wheel game with rewards and opportunities
- **Memories**: Create, edit, and manage special memories with different types
- **Settings**: Relationship information, app settings, and account management

### 🎨 Design Features
- **Apple-style UI**: Clean, modern design following Apple's Human Interface Guidelines
- **Smooth Animations**: Delightful animations throughout the app
- **Haptic Feedback**: Tactile responses for better user experience
- **Dark Mode Support**: Automatic adaptation to system appearance
- **Responsive Design**: Works beautifully on iPhone and iPad

### 🔐 Security Features
- **Keychain Storage**: Secure token storage using iOS Keychain
- **Authentication**: JWT-based authentication with automatic token refresh
- **Network Security**: HTTPS communication with certificate pinning

## Architecture

### 📁 Project Structure
```
ScottZoeApp/
├── ScottZoeAppApp.swift          # App entry point
├── ContentView.swift             # Main content view with auth flow
├── MainTabView.swift             # Tab navigation structure
├── Views/
│   ├── LoginView.swift           # Authentication screen
│   ├── LoadingView.swift         # Loading screen with animations
│   ├── DashboardView.swift       # Main dashboard
│   ├── PhotoGalleryView.swift    # Photo gallery and upload
│   ├── PhotoDetailView.swift     # Individual photo viewer
│   ├── LoveCounterView.swift     # Love counter interface
│   ├── PrizeWheelView.swift      # Interactive prize wheel
│   ├── MemoriesView.swift        # Memories management
│   ├── MemoryDetailView.swift    # Individual memory editor
│   └── SettingsView.swift        # Settings and preferences
├── Managers/
│   ├── AuthManager.swift         # Authentication management
│   ├── DataManager.swift         # API data management
│   └── LoveCounterManager.swift  # Love counter logic
├── Models/
│   └── Models.swift              # Data models and structures
├── Utilities/
│   ├── APIClient.swift           # Network communication
│   └── KeychainHelper.swift      # Secure storage utilities
└── Assets.xcassets               # App icons and images
```

### 🏗️ Architecture Patterns
- **MVVM**: Model-View-ViewModel pattern with ObservableObject
- **Environment Objects**: Shared state management across views
- **Async/Await**: Modern Swift concurrency for network operations
- **Combine**: Reactive programming for data binding

## Setup Instructions

### Prerequisites
- Xcode 15.0 or later
- iOS 17.0 or later
- macOS Ventura or later
- Apple Developer Account (for device testing)

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd Scott-Zoe/ios-app
   ```

2. **Open in Xcode**
   ```bash
   open ScottZoeApp.xcodeproj
   ```

3. **Configure Backend URL**
   - Open `APIClient.swift`
   - Update the `baseURL` to point to your backend server:
   ```swift
   private let baseURL = "https://your-backend-url.com"
   ```

4. **Configure Bundle Identifier**
   - Select the project in Xcode
   - Go to "Signing & Capabilities"
   - Update the Bundle Identifier to your unique identifier
   - Select your development team

5. **Build and Run**
   - Select your target device or simulator
   - Press `Cmd + R` to build and run

## API Integration

### Backend Compatibility
This iOS app is designed to work with the Scott & Zoe backend API. The app expects the following endpoints:

- `POST /api/auth/login` - User authentication
- `GET /api/auth/validate` - Token validation
- `GET /api/relationship/info` - Relationship information
- `GET /api/photos` - Photo listing
- `POST /api/photos/upload` - Photo upload
- `GET /api/memories` - Memory listing
- `POST /api/memories` - Memory creation
- `GET /api/love/stats` - Love statistics
- `POST /api/love/increment` - Love increment
- `GET /api/wheel/stats` - Wheel statistics
- `POST /api/wheel/spin` - Wheel spin

### Configuration
Update the API configuration in `APIClient.swift`:

```swift
private let baseURL = "https://scott-zoe-production.up.railway.app"
```

## Development

### Code Style
- Follow Swift naming conventions
- Use SwiftUI best practices
- Implement proper error handling
- Add comprehensive comments
- Use meaningful variable and function names

### Testing
- Unit tests for managers and utilities
- UI tests for critical user flows
- Integration tests for API communication

### Performance
- Lazy loading for large datasets
- Image caching and optimization
- Efficient memory management
- Background processing for network calls

## Deployment

### App Store Preparation
1. **Update Version Numbers**
   - Increment `CFBundleShortVersionString` in Info.plist
   - Increment `CFBundleVersion` for each build

2. **App Store Assets**
   - App icons (all required sizes)
   - Screenshots for different device sizes
   - App Store description and keywords

3. **Code Signing**
   - Distribution certificate
   - App Store provisioning profile
   - Proper entitlements

4. **Archive and Upload**
   - Archive the app in Xcode
   - Upload to App Store Connect
   - Submit for review

### TestFlight Distribution
1. Archive the app with distribution certificate
2. Upload to App Store Connect
3. Add internal/external testers
4. Distribute beta builds

## Troubleshooting

### Common Issues

**Build Errors**
- Ensure Xcode version compatibility
- Check Swift version settings
- Verify all dependencies are resolved

**Network Issues**
- Verify backend URL configuration
- Check network permissions in Info.plist
- Test API endpoints independently

**Authentication Problems**
- Clear Keychain data during development
- Verify JWT token format
- Check token expiration handling

**UI Issues**
- Test on different device sizes
- Verify Dark Mode compatibility
- Check accessibility features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is private and proprietary to Scott & Zoe.

## Support

For issues and questions, please contact the development team.

---

**Made with ❤️ for Scott & Zoe's Love Story**