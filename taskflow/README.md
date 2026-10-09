# TaskFlow

TaskFlow is an Expo mobile to-do app for managing tasks and scheduling local reminders.

## Features

- Add tasks with a title, description, and optional due date and time
- Edit, complete, and delete tasks
- Schedule and cancel local task reminders
- Store tasks on the device for offline use

## Tech Stack

- React Native and Expo SDK 57
- TypeScript and Expo Router
- AsyncStorage for local task data
- Expo Notifications and React Native DateTimePicker

## Getting Started

```bash
npm install
npx expo start
```

## Running the App

Use the Expo development server with an Android emulator, iOS simulator, or compatible device. The app requests notification permission when it starts; allow it to receive reminders. Reminders are scheduled locally on the device and only future due dates can be scheduled.
