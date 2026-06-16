import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import FlipCard from '../components/FlipCard';
import {
  getCardsByCategory,
  getAllCards,
  FLASHCARDS,
} from '../data/flashcards';
import {
  markLearned,
  markUnlearned,
  getLearnedCards,
  toggleBookmark,
  getBookmarks,
} from '../utils/storage';

const { width } = Dimensions.get('window');

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StudyScreen({ route, navigation }) {
  const { categoryId, categoryName } = route.params;
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [learned, setLearned] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [isFlipped, setIsFlipped] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    let src;
    if (categoryId === 'all') {
      src = getAllCards();
    } else if (categoryId === 'bookmarks') {
      const bms = await getBookmarks();
      src = FLASHCARDS.filter((c) => bms[c.id]);
    } else {
      src = getCardsByCategory(categoryId);
    }

    const [learnedData, bookmarkData] = await Promise.all([getLearnedCards(), getBookmarks()]);
    setCards(shuffleArray(src));
    setLearned(learnedData);
    setBookmarks(bookmarkData);
  };

  const currentCard = cards[index];
  const isLearned = currentCard ? !!learned[currentCard.id] : false;
  const isBookmarked = currentCard ? !!bookmarks[currentCard.id] : false;

  const goNext = useCallback(() => {
    if (index < cards.length - 1) {
      animateSlide(() => {
        setIndex((i) => i + 1);
        setIsFlipped(false);
      });
    } else {
      Alert.alert(
        '学習完了！',
        `${cards.length}枚のカードを学習しました。`,
        [
          { text: 'もう一度', onPress: () => { setIndex(0); setIsFlipped(false); } },
          { text: '戻る', onPress: () => navigation.goBack() },
        ]
      );
    }
  }, [index, cards]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      animateSlide(() => {
        setIndex((i) => i - 1);
        setIsFlipped(false);
      }, true);
    }
  }, [index]);

  const animateSlide = (cb, reverse = false) => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: reverse ? width : -width,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(reverse ? -width : width);
      cb();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleToggleLearned = async () => {
    if (!currentCard) return;
    if (isLearned) {
      await markUnlearned(currentCard.id);
      setLearned((prev) => { const n = { ...prev }; delete n[currentCard.id]; return n; });
    } else {
      await markLearned(currentCard.id);
      setLearned((prev) => ({ ...prev, [currentCard.id]: true }));
    }
  };

  const handleToggleBookmark = async () => {
    if (!currentCard) return;
    const result = await toggleBookmark(currentCard.id);
    setBookmarks((prev) => {
      const n = { ...prev };
      if (result) n[currentCard.id] = true;
      else delete n[currentCard.id];
      return n;
    });
  };

  if (cards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>カードがありません</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const difficultyColors = { easy: '#2E7D32', medium: '#F57F17', hard: '#C62828' };
  const difficultyLabels = { easy: '基礎', medium: '標準', hard: '応用' };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
        <TouchableOpacity onPress={handleToggleBookmark} style={styles.bookmarkBtn}>
          <Text style={styles.bookmarkIcon}>{isBookmarked ? '🔖' : '🏷️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${((index + 1) / cards.length) * 100}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {index + 1} / {cards.length}
        </Text>
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <View style={styles.diffRow}>
          {currentCard && (
            <View
              style={[
                styles.diffBadge,
                { backgroundColor: difficultyColors[currentCard.difficulty] + '22' },
              ]}
            >
              <Text
                style={[
                  styles.diffText,
                  { color: difficultyColors[currentCard.difficulty] },
                ]}
              >
                {difficultyLabels[currentCard.difficulty]}
              </Text>
            </View>
          )}
        </View>

        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          {currentCard && (
            <FlipCard
              key={currentCard.id}
              front={currentCard.front}
              back={currentCard.back}
              onFlip={setIsFlipped}
            />
          )}
        </Animated.View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.navBtn, index === 0 && styles.navBtnDisabled]}
          onPress={goPrev}
          disabled={index === 0}
        >
          <Text style={styles.navBtnText}>‹ 前へ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.learnedBtn, isLearned ? styles.learnedBtnActive : styles.learnedBtnInactive]}
          onPress={handleToggleLearned}
        >
          <Text style={styles.learnedBtnText}>
            {isLearned ? '✓ 習得済み' : '習得にする'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtn} onPress={goNext}>
          <Text style={styles.navBtnText}>
            {index === cards.length - 1 ? '完了 ✓' : '次へ ›'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Learned count */}
      <Text style={styles.learnedCount}>
        習得済み: {Object.keys(learned).length}枚
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#232F3E',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 12, padding: 4 },
  backArrow: { color: '#FFF', fontSize: 24 },
  headerTitle: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bookmarkBtn: { padding: 4 },
  bookmarkIcon: { fontSize: 22 },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#EEE',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: { height: '100%', backgroundColor: '#FF9900', borderRadius: 3 },
  progressText: { fontSize: 13, color: '#888', minWidth: 50, textAlign: 'right' },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  diffRow: { marginBottom: 10, alignSelf: 'flex-start', marginLeft: 2 },
  diffBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  diffText: { fontSize: 12, fontWeight: 'bold' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  navBtn: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: '#232F3E', fontSize: 15, fontWeight: '600' },
  learnedBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  learnedBtnActive: { backgroundColor: '#2E7D32' },
  learnedBtnInactive: { backgroundColor: '#FF9900' },
  learnedBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  learnedCount: { textAlign: 'center', color: '#AAA', fontSize: 12, paddingBottom: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 24 },
  backBtn: { backgroundColor: '#232F3E', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10 },
  backBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
