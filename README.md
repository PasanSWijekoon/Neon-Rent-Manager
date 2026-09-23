# Neon Rent Manager

**Simple Rent & Tenant Management**

Neon Rent Manager is a production-quality, offline-first Android application designed specifically for property owners to easily manage hostel rooms, shops, tenants, and monthly rent collections. 

## Features

### 1. Dashboard & Analytics
- **Dynamic Dashboard**: Time-aware greetings and automatic monthly calculation of total collected, expected rent, and outstanding balances.
- **Actionable Lists**: View "This Month's Due / Overdue" and "Recent Payments" directly from the home screen.
- **Month-Over-Month Tracking**: Visual progress bars and percentage changes compared to the previous month.

### 2. Core Management
- **Properties & Units**: Manage multiple properties and categorize units as either "Hostel Room" or "Shop".
- **Tenants**: Maintain detailed tenant profiles with contact info and historical records. Safely archive tenants without losing financial history.
- **Contracts**: Create robust rental agreements that link a Tenant to a Unit. Track start/end dates, monthly rent, deposits, and due days.
- **History Preservation**: When a tenant moves out, contracts can be cleanly terminated, preserving all historical payment data.

### 3. Rent & Payments
- **Monthly Rent Periods**: The app automatically tracks monthly obligations based on active contracts.
- **Payment Tracking**: Log full or partial payments using various methods (Cash, Bank Transfer, Digital).
- **Auto-Calculations**: Automatically updates statuses (Paid, Partial, Due, Overdue) based on recorded payments.

### 4. Smart Reminders
- **One-Tap Sharing**: Calculate and summarize all outstanding rent for a tenant (across multiple units and months) into a single concise message.
- **Native Integration**: Instantly send generated reminders via WhatsApp, SMS, or Telegram using the native Android share sheet.

### 5. Architecture & Tech Stack
- **Framework**: Expo / React Native (TypeScript)
- **Routing**: Expo Router for file-based navigation
- **State Management**: Zustand
- **Local Persistence**: Expo SQLite (Offline-first architecture)
- **Styling**: NativeWind (Tailwind CSS)

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the app**
   ```bash
   npx expo start
   ```

Press `a` to open the app on an Android emulator, or use the Expo Go app on a physical Android device.

## Design Philosophy

- **Offline-First**: The database lives on the device, ensuring the app works instantly anywhere, regardless of internet connection.
- **History is Sacred**: Modifying active states (like replacing a tenant) is done by creating new contracts rather than overwriting old data, guaranteeing a perfect financial paper trail.
- **Clean UI**: Blue-and-white oriented, scanning-friendly, and utilizing a consistent card-based layout designed strictly for mobile.
