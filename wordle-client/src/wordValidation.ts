const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

export interface WordValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateWordWithAPI = async (word: string): Promise<WordValidationResult> => {
  try {
    if (word.length !== 5) {
      return { isValid: false, error: 'Word must be exactly 5 letters long' };
    }

    if (!/^[a-zA-Z]+$/.test(word)) {
      return { isValid: false, error: 'Word must contain only letters' };
    }

    const response = await fetch(`${DICTIONARY_API_BASE}${word.toLowerCase()}`);
    
    if (response.ok) {
      return { isValid: true };
    } else if (response.status === 404) {
      return { isValid: false, error: 'Not a valid English word' };
    } else {
      return { isValid: false, error: 'Unable to validate word at this time' };
    }
  } catch (error) {
    console.error('Word validation error:', error);
    return { isValid: false, error: 'Network error - unable to validate word' };
  }
};

export const validateWordLocally = (word: string, wordList: string[]): boolean => {
  return wordList.includes(word.toLowerCase());
};

export const validateWord = async (
  word: string, 
  wordList: string[], 
  useAPI: boolean = true
): Promise<WordValidationResult> => {
  if (useAPI) {
    try {
      const apiResult = await validateWordWithAPI(word);
      if (apiResult.isValid) {
        return apiResult;
      }
      console.log('API validation failed, falling back to local validation');
    } catch (error) {
      console.log('API unavailable, using local validation');
    }
  }
  
  const isValid = validateWordLocally(word, wordList);
  return {
    isValid,
    error: isValid ? undefined : 'Not a valid word'
  };
}; 