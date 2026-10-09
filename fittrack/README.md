# FitTrack

FitTrack is an offline Expo mobile app for recording fitness activities and reviewing weekly step progress.

## Features

- Log steps for walking, running, and cycling, or calories burned for swimming, gym, and other workouts
- View saved activity history
- Delete individual records or clear the history
- View a Monday-Sunday weekly steps chart with totals and daily averages
- Keep activity data stored locally on the device

## Tech Stack

- React Native and Expo SDK 57
- TypeScript and Expo Router
- AsyncStorage for local persistence
- React Native SVG and Expo vector icons

## Getting Started

```bash
npm install
npx expo start
```

## Running the App

Use the Expo development server with an Android emulator, iOS simulator, or compatible device. FitTrack does not require an API key or network service; activity records are stored locally. The first launch includes sample activity records for the dashboard and chart.
