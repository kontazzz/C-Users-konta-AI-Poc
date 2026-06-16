import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllCards, CATEGORIES } from '../data/flashcards';
import {
  getLearnedCards,
  getStudyStreak,
  updateStudyStreak,
  resetAllData,
  getBookmarks,
} from '../utils/storage';

export default function HomeScreen({ navigation }) {
  const [learnedCount, setLearnedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const totalCards = getAllCards().length;

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    const [learned, bookmarks, currentStreak] = await Promise.all([
      getLearnedCards(),
      getBookmarks(),
      updateStudyStreak(),
    ]);
    setLearnedCount(Object.keys(learned).length);
    setBookmarkCount(Object.keys(bookmarks).length);
    setStreak(currentStreak);
  };

  const handleReset = () => {
    Alert.alert(
      'データをリセット',
      '学習履歴・ブックマーク・クイズ結果を全て削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            loadStats();
          },
        },
      ]
    );
  };

  const progress = totalCards > 0 ? learnedCount / totalCards : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#232F3E" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AWS AIF 単語帳</Text>
          <Text style={styles.headerSub}>AWS Certified AI Practitioner</Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
          <Text style={styles.resetBtnText}>↺</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>学習進捗</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{learnedCount}</Text>
              <Text style={styles.statLabel}>習得済み</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalCards - learnedCount}</Text>
              <Text style={styles.statLabel}>未習得</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalCards}</Text>
              <Text style={styles.statLabel}>全カード</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressPct}>{Math.round(progress * 100)}% 完了</Text>
        </View>

        {/* Badges Row */}
        <View style={styles.badgeRow}>
          <View style={styles.badgeCard}>
            <Text style={styles.badgeIcon}>🔥</Text>
            <Text style={styles.badgeValue}>{streak}日</Text>
            <Text style={styles.badgeLabel}>連続学習</Text>
          </View>
          <View style={styles.badgeCard}>
            <Text style={styles.badgeIcon}>🔖</Text>
            <Text style={styles.badgeValue}>{bookmarkCount}枚</Text>
            <Text style={styles.badgeLabel}>ブックマーク</Text>
          </View>
          <View style={styles.badgeCard}>
            <Text style={styles.badgeIcon}>📚</Text>
            <Text style={styles.badgeValue}>{CATEGORIES.length}分野</Text>
            <Text style={styles.badgeLabel}>カテゴリ</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <Text style={styles.sectionTitle}>学習を始める</Text>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#232F3E' }]}
          onPress={() => navigation.navigate('DeckList')}
        >
          <Text style={styles.actionBtnIcon}>📖</Text>
          <View style={styles.actionBtnText}>
            <Text style={styles.actionBtnTitle}>カテゴリ別学習</Text>
            <Text style={styles.actionBtnSub}>8つのカテゴリから選んで単語カード学習</Text>
          </View>
          <Text style={styles.actionBtnArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#7B2D8B' }]}
          onPress={() => navigation.navigate('Study', { categoryId: 'all', categoryName: '全カード' })}
        >
          <Text style={styles.actionBtnIcon}>🎯</Text>
          <View style={styles.actionBtnText}>
            <Text style={styles.actionBtnTitle}>全カード学習</Text>
            <Text style={styles.actionBtnSub}>{totalCards}枚のカードをランダムで学習</Text>
          </View>
          <Text style={styles.actionBtnArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#0066CC' }]}
          onPress={() => navigation.navigate('Quiz', { categoryId: 'all', categoryName: '全カード' })}
        >
          <Text style={styles.actionBtnIcon}>❓</Text>
          <View style={styles.actionBtnText}>
            <Text style={styles.actionBtnTitle}>クイズモード</Text>
            <Text style={styles.actionBtnSub}>4択クイズで理解度チェック</Text>
          </View>
          <Text style={styles.actionBtnArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#C62828' }]}
          onPress={() =>
            navigation.navigate('Study', { categoryId: 'bookmarks', categoryName: 'ブックマーク' })
          }
        >
          <Text style={styles.actionBtnIcon}>🔖</Text>
          <View style={styles.actionBtnText}>
            <Text style={styles.actionBtnTitle}>ブックマーク復習</Text>
            <Text style={styles.actionBtnSub}>苦手なカードをまとめて復習</Text>
          </View>
          <Text style={styles.actionBtnArrow}>›</Text>
        </TouchableOpacity>

        {/* Exam Info */}
        <View style={styles.examInfo}>
          <Text style={styles.examInfoTitle}>📋 AIF-C01 試験ドメイン</Text>
          {[
            ['Domain 1', 'AI/MLの基礎', '20%'],
            ['Domain 2', '生成AIの基礎', '24%'],
            ['Domain 3', 'FMのアプリケーション', '28%'],
            ['Domain 4', '責任あるAI', '14%'],
            ['Domain 5', 'セキュリティ・ガバナンス', '14%'],
          ].map(([d, name, pct]) => (
            <View key={d} style={styles.examRow}>
              <Text style={styles.examDomain}>{d}</Text>
              <Text style={styles.examName}>{name}</Text>
              <Text style={styles.examPct}>{pct}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#232F3E',
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { color: '#FF9900', fontSize: 22, fontWeight: 'bold' },
  headerSub: { color: '#8CA2B5', fontSize: 12, marginTop: 2 },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnText: { color: '#FFF', fontSize: 20 },
  content: { flex: 1, padding: 16 },
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTitle: { fontSize: 14, color: '#888', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#232F3E' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#EEE' },
  progressBarBg: { height: 8, backgroundColor: '#EEE', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FF9900', borderRadius: 4 },
  progressPct: { textAlign: 'right', fontSize: 12, color: '#888', marginTop: 6 },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  badgeCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIcon: { fontSize: 24, marginBottom: 4 },
  badgeValue: { fontSize: 18, fontWeight: 'bold', color: '#232F3E' },
  badgeLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#232F3E', marginBottom: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnIcon: { fontSize: 28, marginRight: 14 },
  actionBtnText: { flex: 1 },
  actionBtnTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  actionBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  actionBtnArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 28, fontWeight: '300' },
  examInfo: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  examInfoTitle: { fontSize: 14, fontWeight: 'bold', color: '#232F3E', marginBottom: 12 },
  examRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  examDomain: { width: 80, fontSize: 12, color: '#FF9900', fontWeight: 'bold' },
  examName: { flex: 1, fontSize: 13, color: '#444' },
  examPct: { fontSize: 13, fontWeight: 'bold', color: '#232F3E' },
});
