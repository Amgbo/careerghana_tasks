# Voice Translator

Voice Translator translates text between English and French and supports voice input and spoken translations.

## Features

- Translate text between English and French
- Swap the source and target languages
- Convert speech to text with the device microphone
- Read translated text aloud with text-to-speech

## Tech Stack

- React Native and Expo SDK 57
- TypeScript and Expo Router
- MyMemory Translation API
- `expo-speech-recognition` for speech-to-text
- `expo-speech` for text-to-speech

## Getting Started

```bash
npm install
npx expo start
```

## Running the App

Translation requires an internet connection because the app calls the MyMemory API; no API key is configured. Voice input requires microphone and speech-recognition permissions. Because speech recognition uses a native module, use a development build (`npx expo run:android` or `npx expo run:ios`) rather than relying on Expo Go for that feature.
