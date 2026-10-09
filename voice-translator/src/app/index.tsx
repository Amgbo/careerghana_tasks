import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { translateText } from "../services/translation";

import {
  requestSpeechPermissions,
  startSpeechRecognition,
  stopSpeechRecognition,
  speakText,
  stopSpeaking,
} from "../services/speech";

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export default function HomeScreen() {
  // Text typed by the user or recognized from speech.
  const [inputText, setInputText] = useState("");

  // Translation returned by the translation API.
  const [translatedText, setTranslatedText] = useState("");

  // Source language.
  const [sourceLanguage, setSourceLanguage] = useState("en");

  // Target language.
  const [targetLanguage, setTargetLanguage] = useState("fr");

  // Shows when translation is running.
  const [translating, setTranslating] = useState(false);

  // Shows when the microphone is listening.
  const [listening, setListening] = useState(false);

  /*
    Listen for speech recognition results.

    When the user speaks, the device converts
    the speech into text and sends the result here.
  */
  useSpeechRecognitionEvent("result", (event) => {
    const transcript =
      event.results?.[0]?.transcript ?? "";

    if (transcript) {
      setInputText(transcript);
    }

    // When the result is final, stop the listening state.
    if (event.isFinal) {
      setListening(false);
    }
  });

  /*
    Handle speech recognition errors.
  */
  useSpeechRecognitionEvent("error", (event) => {
    console.error(
      "Speech recognition error:",
      event.error
    );

    setListening(false);

    Alert.alert(
      "Speech recognition error",
      event.message ||
        "Unable to recognize your voice. Please try again."
    );
  });

  /*
    Stop speech playback when the screen
    is removed from the application.
  */
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopSpeechRecognition();
    };
  }, []);

  /*
    Translate the entered or recognized text.
  */
  const handleTranslate = async () => {
    if (!inputText.trim()) {
      Alert.alert(
        "No text",
        "Please enter something to translate."
      );

      return;
    }

    try {
      setTranslating(true);

      const result = await translateText({
        text: inputText,
        sourceLanguage,
        targetLanguage,
      });

      setTranslatedText(result);
    } catch (error) {
      console.error(
        "Translation failed:",
        error
      );

      Alert.alert(
        "Translation failed",
        "Unable to translate the text. Please check your internet connection and try again."
      );
    } finally {
      setTranslating(false);
    }
  };

  /*
    Swap the source and target languages.
  */
  const handleSwapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);

    // Also swap the text currently displayed.
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  /*
    Clear the translator.
  */
  const handleClear = () => {
    setInputText("");
    setTranslatedText("");
  };

  /*
    Start or stop voice recognition.
  */
  const handleVoiceInput = async () => {
    // If we are already listening, stop recognition.
    if (listening) {
      await stopSpeechRecognition();
      setListening(false);
      return;
    }

    try {
      // Ask the user for microphone/speech permissions.
      const permissionGranted =
        await requestSpeechPermissions();

      if (!permissionGranted) {
        Alert.alert(
          "Permission required",
          "Microphone and speech recognition permission are required to use voice input."
        );

        return;
      }

      /*
        Convert our language code into the language
        format expected by the speech recognition API.

        English -> en-US
        French  -> fr-FR
      */
      const recognitionLanguage =
        sourceLanguage === "en"
          ? "en-US"
          : "fr-FR";

      // Remove the previous text before listening.
      setInputText("");
      setTranslatedText("");

      // Start listening.
      setListening(true);

      await startSpeechRecognition(
        recognitionLanguage
      );
    } catch (error) {
      console.error(
        "Voice input failed:",
        error
      );

      setListening(false);

      Alert.alert(
        "Voice input failed",
        "Unable to start speech recognition. Please try again."
      );
    }
  };

  /*
    Read the translated result aloud.
  */
  const handleListen = () => {
    if (!translatedText.trim()) {
      return;
    }

    const speechLanguage =
      targetLanguage === "en"
        ? "en-US"
        : "fr-FR";

    speakText(
      translatedText,
      speechLanguage
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons
              name="language"
              size={26}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.title}>
            Voice Translator
          </Text>

          <Text style={styles.subtitle}>
            Translate words, speak naturally.
          </Text>
        </View>

        {/* Language selectors */}
        <View style={styles.languageRow}>
          <View style={styles.languageBox}>
            <Text style={styles.languageLabel}>
              FROM
            </Text>

            <Text style={styles.languageName}>
              {sourceLanguage === "en"
                ? "English"
                : "French"}
            </Text>
          </View>

          <Pressable
            style={styles.swapButton}
            onPress={handleSwapLanguages}
          >
            <Ionicons
              name="swap-horizontal"
              size={22}
              color="#208AEF"
            />
          </Pressable>

          <View style={styles.languageBox}>
            <Text style={styles.languageLabel}>
              TO
            </Text>

            <Text style={styles.languageName}>
              {targetLanguage === "en"
                ? "English"
                : "French"}
            </Text>
          </View>
        </View>

        {/* Input section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Enter text
            </Text>

            {inputText.length > 0 && (
              <Pressable
                onPress={handleClear}
                hitSlop={10}
              >
                <Text style={styles.clearText}>
                  Clear
                </Text>
              </Pressable>
            )}
          </View>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type something to translate..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            style={styles.textInput}
          />
        </View>

        {/* Translate button */}
        <Pressable
          style={[
            styles.translateButton,
            translating &&
              styles.disabledButton,
          ]}
          onPress={handleTranslate}
          disabled={translating}
        >
          {translating ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <>
              <Ionicons
                name="language"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.translateButtonText
                }
              >
                Translate
              </Text>
            </>
          )}
        </Pressable>

        {/* Translation result */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Translation
          </Text>

          <View style={styles.resultBox}>
            {translatedText ? (
              <Text style={styles.resultText}>
                {translatedText}
              </Text>
            ) : (
              <Text style={styles.emptyText}>
                Your translation will appear here.
              </Text>
            )}
          </View>

          {/* Listen to translated text */}
          <Pressable
            style={[
              styles.listenButton,
              !translatedText &&
                styles.disabledOutlineButton,
            ]}
            disabled={!translatedText}
            onPress={handleListen}
          >
            <Ionicons
              name="volume-high-outline"
              size={20}
              color={
                translatedText
                  ? "#208AEF"
                  : "#AAAAAA"
              }
            />

            <Text
              style={[
                styles.listenText,
                !translatedText &&
                  styles.disabledText,
              ]}
            >
              Listen
            </Text>
          </Pressable>
        </View>

        {/* Voice input */}
        <Pressable
          style={[
            styles.voiceButton,
            listening &&
              styles.listeningButton,
          ]}
          onPress={handleVoiceInput}
        >
          <View style={styles.microphoneCircle}>
            <Ionicons
              name={
                listening
                  ? "mic"
                  : "mic-outline"
              }
              size={28}
              color="#FFFFFF"
            />
          </View>

          <View>
            <Text style={styles.voiceTitle}>
              {listening
                ? "Listening..."
                : "Speak"}
            </Text>

            <Text style={styles.voiceSubtitle}>
              {listening
                ? "Speak now..."
                : "Tap to translate your voice"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },

  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#208AEF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
  },

  subtitle: {
    fontSize: 14,
    color: "#777777",
    marginTop: 5,
  },

  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },

  languageBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
  },

  languageLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#999999",
    marginBottom: 5,
  },

  languageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },

  swapButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
  },

  clearText: {
    fontSize: 13,
    color: "#208AEF",
    fontWeight: "600",
  },

  textInput: {
    minHeight: 130,
    fontSize: 16,
    lineHeight: 24,
    color: "#222222",
  },

  translateButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#208AEF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },

  disabledButton: {
    opacity: 0.6,
  },

  translateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  resultBox: {
    minHeight: 100,
    justifyContent: "center",
    marginTop: 12,
  },

  resultText: {
    fontSize: 18,
    lineHeight: 28,
    color: "#222222",
  },

  emptyText: {
    fontSize: 14,
    color: "#999999",
    lineHeight: 22,
  },

  listenButton: {
    height: 46,
    borderWidth: 1,
    borderColor: "#208AEF",
    borderRadius: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
  },

  disabledOutlineButton: {
    borderColor: "#DDDDDD",
  },

  listenText: {
    color: "#208AEF",
    fontSize: 14,
    fontWeight: "600",
  },

  disabledText: {
    color: "#AAAAAA",
  },

  voiceButton: {
    backgroundColor: "#111111",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  listeningButton: {
    opacity: 0.85,
  },

  microphoneCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#208AEF",
    justifyContent: "center",
    alignItems: "center",
  },

  voiceTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  voiceSubtitle: {
    color: "#AAAAAA",
    fontSize: 12,
    marginTop: 3,
  },
});