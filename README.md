# Monthly Budget Tracker — Standalone iPhone & Mobile App

Full-stack standalone mobile application built with **React Native (Expo)**, **3D Claymorphism UI**, **Node.js / Express**, and **Neon PostgreSQL**.

## Architecture
- `mobile/` — Standalone iOS / Android / PWA client with 3D Claymorphism design, dynamic balance calculation (`Income - SUM(Expenses)`), interactive accordions, 3D pink bar chart analytics, and statement export.
- `backend/` — Express REST API connected to Neon PostgreSQL with JWT authentication.
- `render.yaml` — One-click cloud backend deployment config for Render.com.

## Standalone Build Commands

### 1. Android Standalone APK (Free, Direct Install)
```bash
cd mobile
eas build --platform android --profile preview
```

### 2. iPhone Standalone IPA (Requires Apple Developer Account)
```bash
cd mobile
eas build --platform ios --profile preview
```

### 3. iPhone Free Standalone Home-Screen App (PWA)
```bash
cd mobile
npx expo export --platform web
```
Deploy `mobile/dist` to Vercel or Netlify, open in iPhone Safari, and tap **Share → Add to Home Screen**.
