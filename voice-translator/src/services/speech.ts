/*
  Speech service for Voice Translator.

  This file handles:
  1. Speech-to-text using the device's native speech recognition.
  2. Text-to-speech using Expo Speech.
*/

import * as Speech from "expo-speech";
import {
  ExpoSpeechRecognitionModule,
} from "expo-speech-recognition";

/*
  Request permission to use the microphone
  and speech recognition.
*/
export const requestSpeechPermissions =
  async (): Promise<boolean> => {
    try {
      const result =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      return result.granted === true;
    } catch (error) {
      console.error(
        "Speech permission error:",
        error
      );

      return false;
    }
  };

/*
  Start speech recognition.

  The recognized words will be received
  through the event listener in index.tsx.
*/
export const startSpeechRecognition =
  async (language: string): Promise<void> => {
    try {
      await ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: false,
        continuous: false,
      });
    } catch (error) {
      console.error(
        "Failed to start speech recognition:",
        error
      );

      throw error;
    }
  };

/*
  Stop speech recognition.
*/
export const stopSpeechRecognition =
  async (): Promise<void> => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error(
        "Failed to stop speech recognition:",
        error
      );
    }
  };

/*
  Speak the translated text aloud.
*/
export const speakText = (
  text: string,
  language: string
): void => {
  if (!text.trim()) {
    return;
  }

  // Stop any speech that is currently playing.
  Speech.stop();

  // Start speaking the translated text.
  Speech.speak(text, {
    language,
    rate: 0.9,
    pitch: 1.0,
  });
};

/*
  Stop the current text-to-speech playback.
*/
export const stopSpeaking = (): void => {
  Speech.stop();
};