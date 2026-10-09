/*
  Translation service for Voice Translator.

  We use the MyMemory Translation API.

  Why MyMemory?
  - It does not require an API key for basic usage.
  - It supports many language pairs.
  - It works with simple HTTP requests.
*/

const TRANSLATION_API_URL =
  "https://api.mymemory.translated.net/get";

export type TranslateParams = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

/*
  Translate text using MyMemory.
*/
export const translateText = async ({
  text,
  sourceLanguage,
  targetLanguage,
}: TranslateParams): Promise<string> => {
  // Prevent empty translation requests.
  if (!text.trim()) {
    throw new Error(
      "Please enter some text to translate."
    );
  }

  try {
    /*
      MyMemory expects the language pair
      in this format:

      en|fr
      en|es
      fr|en
    */
    const languagePair =
      `${sourceLanguage}|${targetLanguage}`;

    /*
      URLSearchParams safely encodes the user's
      text before sending it to the API.
    */
    const params = new URLSearchParams({
      q: text.trim(),
      langpair: languagePair,
    });

    const response = await fetch(
      `${TRANSLATION_API_URL}?${params.toString()}`
    );

    /*
      Check whether the server returned
      a successful HTTP response.
    */
    if (!response.ok) {
      throw new Error(
        `Translation failed (${response.status})`
      );
    }

    const data = await response.json();

    /*
      MyMemory returns the translated text
      inside responseData.translatedText.
    */
    const translatedText =
      data?.responseData?.translatedText;

    if (!translatedText) {
      throw new Error(
        "The translation service returned no result."
      );
    }

    return translatedText;
  } catch (error) {
    console.error(
      "Translation error:",
      error
    );

    throw error;
  }
};