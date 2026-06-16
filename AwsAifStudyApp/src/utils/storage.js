import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  LEARNED: 'learned_cards',
  BOOKMARKS: 'bookmarked_cards',
  QUIZ_HISTORY: 'quiz_history',
  STUDY_STREAK: 'study_streak',
  LAST_STUDY_DATE: 'last_study_date',
};

export const markLearned = async (cardId) => {
  try {
    const existing = await AsyncStorage.getItem(KEYS.LEARNED);
    const learned = existing ? JSON.parse(existing) : {};
    learned[cardId] = true;
    await AsyncStorage.setItem(KEYS.LEARNED, JSON.stringify(learned));
  } catch (_) {}
};

export const markUnlearned = async (cardId) => {
  try {
    const existing = await AsyncStorage.getItem(KEYS.LEARNED);
    const learned = existing ? JSON.parse(existing) : {};
    delete learned[cardId];
    await AsyncStorage.setItem(KEYS.LEARNED, JSON.stringify(learned));
  } catch (_) {}
};

export const getLearnedCards = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.LEARNED);
    return data ? JSON.parse(data) : {};
  } catch (_) {
    return {};
  }
};

export const toggleBookmark = async (cardId) => {
  try {
    const existing = await AsyncStorage.getItem(KEYS.BOOKMARKS);
    const bookmarks = existing ? JSON.parse(existing) : {};
    if (bookmarks[cardId]) {
      delete bookmarks[cardId];
    } else {
      bookmarks[cardId] = true;
    }
    await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return !!bookmarks[cardId];
  } catch (_) {
    return false;
  }
};

export const getBookmarks = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : {};
  } catch (_) {
    return {};
  }
};

export const saveQuizResult = async (categoryId, score, total) => {
  try {
    const existing = await AsyncStorage.getItem(KEYS.QUIZ_HISTORY);
    const history = existing ? JSON.parse(existing) : {};
    if (!history[categoryId]) history[categoryId] = [];
    history[categoryId].push({ score, total, date: new Date().toISOString() });
    if (history[categoryId].length > 10) history[categoryId].shift();
    await AsyncStorage.setItem(KEYS.QUIZ_HISTORY, JSON.stringify(history));
  } catch (_) {}
};

export const getQuizHistory = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.QUIZ_HISTORY);
    return data ? JSON.parse(data) : {};
  } catch (_) {
    return {};
  }
};

export const updateStudyStreak = async () => {
  try {
    const today = new Date().toDateString();
    const lastDate = await AsyncStorage.getItem(KEYS.LAST_STUDY_DATE);
    const streakData = await AsyncStorage.getItem(KEYS.STUDY_STREAK);
    let streak = streakData ? parseInt(streakData) : 0;

    if (lastDate === today) return streak;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastDate === yesterday.toDateString()) {
      streak += 1;
    } else {
      streak = 1;
    }

    await AsyncStorage.setItem(KEYS.LAST_STUDY_DATE, today);
    await AsyncStorage.setItem(KEYS.STUDY_STREAK, String(streak));
    return streak;
  } catch (_) {
    return 0;
  }
};

export const getStudyStreak = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.STUDY_STREAK);
    return data ? parseInt(data) : 0;
  } catch (_) {
    return 0;
  }
};

export const resetAllData = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (_) {}
};
