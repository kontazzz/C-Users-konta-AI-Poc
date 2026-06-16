import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDecksByCategory, getCardsByCategory } from '../data/flashcards';
import { getLearnedCards } from '../utils/storage';

export default function DeckListScreen({ navigation }) {
  const [decks, setDecks] = useState([]);
  const [learned, setLearned] = useState({});

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [deckList, learnedCards] = await Promise.all([
      Promise.resolve(getDecksByCategory()),
      getLearnedCards(),
    ]);
    setDecks(deckList);
    setLearned(learnedCards);
  };

  const getLearnedCountForCategory = (categoryId) => {
    const cards = getCardsByCategory(categoryId);
    return cards.filter((c) => learned[c.id]).length;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>カテゴリを選択</Text>
        <Text style={styles.subheading}>タップして学習またはクイズを開始</Text>

        {decks.map((deck) => {
          const learnedCount = getLearnedCountForCategory(deck.id);
          const pct = deck.cardCount > 0 ? learnedCount / deck.cardCount : 0;
          return (
            <View key={deck.id} style={styles.deckCard}>
              <View style={styles.deckHeader}>
                <View style={[styles.iconCircle, { backgroundColor: deck.color + '22' }]}>
                  <Text style={styles.deckIcon}>{deck.icon}</Text>
                </View>
                <View style={styles.deckInfo}>
                  <Text style={styles.deckName}>{deck.name}</Text>
                  <Text style={styles.deckCount}>
                    {learnedCount}/{deck.cardCount}枚 習得
                  </Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${pct * 100}%`, backgroundColor: deck.color },
                    ]}
                  />
                </View>
                <Text style={[styles.pctText, { color: deck.color }]}>
                  {Math.round(pct * 100)}%
                </Text>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.btn, { borderColor: deck.color }]}
                  onPress={() =>
                    navigation.navigate('Study', {
                      categoryId: deck.id,
                      categoryName: deck.name,
                    })
                  }
                >
                  <Text style={[styles.btnText, { color: deck.color }]}>📖 単語学習</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnFilled, { backgroundColor: deck.color }]}
                  onPress={() =>
                    navigation.navigate('Quiz', {
                      categoryId: deck.id,
                      categoryName: deck.name,
                    })
                  }
                >
                  <Text style={styles.btnTextFilled}>❓ クイズ</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#232F3E', marginTop: 20, marginBottom: 4 },
  subheading: { fontSize: 13, color: '#888', marginBottom: 16 },
  deckCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  deckHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deckIcon: { fontSize: 22 },
  deckInfo: { flex: 1 },
  deckName: { fontSize: 15, fontWeight: 'bold', color: '#232F3E' },
  deckCount: { fontSize: 12, color: '#888', marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#EEE',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  pctText: { fontSize: 12, fontWeight: 'bold', width: 36, textAlign: 'right' },
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: { fontSize: 13, fontWeight: '600' },
  btnFilled: { borderWidth: 0 },
  btnTextFilled: { fontSize: 13, fontWeight: '600', color: '#FFF' },
});
