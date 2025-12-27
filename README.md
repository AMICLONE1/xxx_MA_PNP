# PowerNetPro Mobile Application

A React Native mobile application for PowerNetPro, enabling P2P energy trading with KYC verification, smart meter integration, Beckn protocol-based marketplace, wallet system, and automated trading capabilities.

## Technology Stack

- **Framework**: React Native (Expo SDK 54+)
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand
- **Local Database**: WatermelonDB (primary), MMKV (key-value cache)
- **Backend Sync**: Firebase/Supabase (Real-time)
- **Charts**: Victory Native
- **KYC/OCR**: Google ML Kit
- **Maps**: Mapbox SDK
- **Navigation**: React Navigation v6
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Payments**: Razorpay/PhonePe SDK
- **Notifications**: Firebase Cloud Messaging (FCM)

## Project Structure

```
/src
  /components      # Reusable UI components
  /screens         # Screen components
    /auth          # Authentication screens
    /kyc           # KYC verification screens
    /meter         # Meter registration screens
    /trading       # Trading and marketplace screens
    /wallet        # Wallet screens
    /home          # Home dashboard
    /profile       # Profile screens
  /navigation      # Navigation configuration
  /store           # Zustand stores
  /services        # API services, external integrations
    /api           # API client and services
    /beckn         # Beckn protocol integration
    /mlkit         # ML Kit OCR service
  /utils           # Helper functions, constants
  /types           # TypeScript type definitions
  /hooks           # Custom React hooks
  /database        # WatermelonDB schema and models
  /assets          # Images, fonts, etc.
```

## 📚 Documentation

**All documentation is now organized in the [`docs/`](docs/) directory.**

- **[📖 Documentation Index](docs/README.md)** - Complete documentation guide
- **[🚀 Setup Guide](docs/setup/SETUP_GUIDE.md)** - Complete setup instructions
- **[⚙️ Supabase Setup](docs/setup/SUPABASE_SETUP.md)** - Supabase configuration
- **[🔧 Troubleshooting](docs/troubleshooting/COMMON_ISSUES.md)** - Common issues and solutions
- **[📊 Implementation Status](docs/development/IMPLEMENTATION_STATUS.md)** - Feature completion status

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI
- iOS Simulator (for iOS development) or Android Emulator (for Android development)
- Expo Go app on your physical device (optional)

### Quick Start

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on your preferred platform:**
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   npm run web      # For Web
   ```

**For detailed setup instructions, see [Setup Guide](docs/setup/SETUP_GUIDE.md)**

## Development

### Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on Web
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

### Code Style

This project uses:
- ESLint for linting
- Prettier for code formatting
- TypeScript strict mode

## Features

### Phase 1: Foundation & Core Infrastructure ✅
- [x] Project setup and configuration
- [x] Authentication module (Phone OTP)
- [x] Navigation setup
- [x] State management (Zustand)
- [x] Local database setup (WatermelonDB)

### Phase 2: KYC & Trust Layer ✅
- [x] Document scanning (Aadhaar, PAN, Electricity Bill)
  - [x] OCR-based Aadhaar card scanning with ML Kit
  - [x] Automatic data extraction (Name, Aadhaar Number, DOB, Address)
  - [x] Aadhaar number masking and security
  - [x] User confirmation flow
- [x] Liveness check
- [x] Business verification
- [x] KYC status tracking

### Phase 3: Meter-First Onboarding (Planned)
- [ ] Meter registration flow
- [ ] Remote meter verification
- [ ] Data ingestion
- [ ] Smart meter provisioning

### Phase 4: Solar Site Intelligence (Planned)
- [ ] Live dashboard
- [ ] Energy data visualization
- [ ] Fault detection

### Phase 5: P2P Energy Trading (Planned)
- [ ] Beckn protocol integration
- [ ] Marketplace discovery
- [ ] Order placement
- [ ] Transaction settlement

### Phase 6: Wallet & Payments (Planned)
- [ ] Dual-balance wallet
- [ ] UPI integration
- [ ] Auto-withdrawal

### Phase 7: Trading Bot (Planned)
- [ ] Auto-sell configuration
- [ ] Trading bot logic engine
- [ ] Dashboard integration

## Environment Variables

See `.env.example` for required environment variables.

## Building for Production

### Using EAS Build

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure the project:
   ```bash
   eas build:configure
   ```

4. Build for production:
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and type checking
4. Submit a pull request

## License

Proprietary - PowerNetPro

