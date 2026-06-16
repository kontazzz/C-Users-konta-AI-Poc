import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { getCardsByCategory, getAllCards, FLASHCARDS } from '../data/flashcards';
import { saveQuizResult, getBookmarks } from '../utils/storage';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(cards, allCards, count = 15) {
  const shuffled = shuffleArray(cards).slice(0, count);
  return shuffled.map((card) => {
    const wrongs = shuffleArray(
      allCards.filter((c) => c.id !== card.id)
    ).slice(0, 3);
    const options = shuffleArray([card, ...wrongs]);
    return {
      card,
      options,
      correctId: card.id,
    };
  });
}

export default function QuizScreen({ route, navigation }) {
  const { categoryId, categoryName } = route.params;
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    initQuiz();
  }, []);

  const initQuiz = async () => {
    const allCards = getAllCards();
    let src;
    if (categoryId === 'all') {
      src = allCards;
    } else if (categoryId === 'bookmarks') {
      const bms = await getBookmarks();
      src = FLASHCARDS.filter((c) => bms[c.id]);
      if (src.length < 4) src = allCards;
    } else {
      src = getCardsByCategory(categoryId);
    }
    const qs = buildQuestions(src, allCards);
    setQuestions(qs);
  };

  const currentQ = questions[qIndex];

  const handleSelect = (optionId) => {
    if (answered) return;
    setSelected(optionId);
    setAnswered(true);
    const correct = optionId === currentQ.correctId;
    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);
    setResults((prev) => [...prev, { question: currentQ, selected: optionId, correct }]);
  };

  const handleNext = async () => {
    if (qIndex + 1 >= questions.length) {
      await saveQuizResult(categoryId, score + (selected === currentQ?.correctId ? 1 : 0), questions.length);
      setFinished(true);
      return;
    }
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setQIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  if (finished) {
    const total = questions.length;
    const finalScore = results.filter((r) => r.correct).length;
    const pct = Math.round((finalScore / total) * 100);
    const grade = pct >= 80 ? '合格圏' : pct >= 60 ? 'あと少し' : '要復習';
    const gradeColor = pct >= 80 ? '#2E7D32' : pct >= 60 ? '#F57F17' : '#C62828';

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>クイズ結果</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreIcon}>{pct >= 80 ? '🎉' : pct >= 60 ? '📚' : '💪'}</Text>
            <Text style={styles.scoreValue}>{finalScore}<Text style={styles.scoreTotal}>/{total}</Text></Text>
            <Text style={styles.scorePct}>{pct}%</Text>
            <View style={[styles.gradeBadge, { backgroundColor: gradeColor }]}>
              <Text style={styles.gradeText}>{grade}</Text>
            </View>
          </View>

          <Text style={styles.resultSectionTitle}>問題の詳細</Text>
          {results.map((r, i) => (
            <View
              key={i}
              style={[styles.resultItem, r.correct ? styles.resultCorrect : styles.resultWrong]}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultIcon}>{r.correct ? '✓' : '✗'}</Text>
                <Text style={styles.resultQNum}>Q{i + 1}</Text>
                <Text style={styles.resultQFront} numberOfLines={2}>
                  {r.question.card.front.replace('\n', ' ')}
                </Text>
              </View>
              {!r.correct && (
                <View style={styles.correctAnswerBox}>
                  <Text style={styles.correctAnswerLabel}>正解：</Text>
                  <Text style={styles.correctAnswerText} numberOfLines={3}>
                    {r.question.card.back.split('\n').slice(0, 2).join(' ')}
                  </Text>
                </View>
              )}
            </View>
          ))}

          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={[styles.resultBtn, { backgroundColor: '#232F3E' }]}
              onPress={() => {
                setFinished(false);
                setQIndex(0);
                setScore(0);
                setSelected(null);
                setAnswered(false);
                setResults([]);
                initQuiz();
              }}
            >
              <Text style={styles.resultBtnText}>もう一度挑戦</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultBtn, { backgroundColor: '#FF9900' }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.resultBtnText}>カテゴリに戻る</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  if (!currentQ) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName} クイズ</Text>
        <Text style={styles.headerScore}>{score}点</Text>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${((qIndex + 1) / questions.length) * 100}%` }]}
          />
        </View>
        <Text style={styles.qNum}>{qIndex + 1}/{questions.length}</Text>
      </View>

      <Animated.View style={[styles.quizContent, { opacity: fadeAnim }]}>
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>次の用語/概念の正しい説明はどれ？</Text>
          <Text style={styles.questionText}>{currentQ.card.front}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQ.options.map((opt, i) => {
            const isCorrect = opt.id === currentQ.correctId;
            const isSelected = opt.id === selected;
            let bgColor = '#FFF';
            let borderColor = '#E0E0E0';
            let textColor = '#333';

            if (answered) {
              if (isCorrect) {
                bgColor = '#E8F5E9';
                borderColor = '#2E7D32';
                textColor = '#1B5E20';
              } else if (isSelected && !isCorrect) {
                bgColor = '#FFEBEE';
                borderColor = '#C62828';
                textColor = '#B71C1C';
              }
            } else if (isSelected) {
              bgColor = '#E3F2FD';
              borderColor = '#1565C0';
            }

            const labels = ['A', 'B', 'C', 'D'];
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
                onPress={() => handleSelect(opt.id)}
                disabled={answered}
              >
                <View style={[styles.optionLabel, { borderColor, backgroundColor: borderColor + '44' }]}>
                  <Text style={[styles.optionLabelText, { color: textColor }]}>{labels[i]}</Text>
                </View>
                <Text style={[styles.optionText, { color: textColor }]} numberOfLines={4}>
                  {opt.back.split('\n').slice(0, 2).join(' ').substring(0, 100)}
                </Text>
                {answered && isCorrect && <Text style={styles.correctMark}>✓</Text>}
                {answered && isSelected && !isCorrect && <Text style={styles.wrongMark}>✗</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {answered && (
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {qIndex + 1 >= questions.length ? '結果を見る →' : '次の問題 →'}
          </Text>
        </TouchableOpacity>
      )}
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
  headerScore: { color: '#FF9900', fontSize: 16, fontWeight: 'bold' },
  progressRow: {
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
  qNum: { fontSize: 13, color: '#888', minWidth: 45, textAlign: 'right' },
  quizContent: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  questionCard: {
    backgroundColor: '#232F3E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  questionLabel: { color: '#FF9900', fontSize: 12, marginBottom: 8 },
  questionText: { color: '#FFF', fontSize: 22, fontWeight: 'bold', lineHeight: 32 },
  optionsContainer: { gap: 10 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  optionLabelText: { fontSize: 14, fontWeight: 'bold' },
  optionText: { flex: 1, fontSize: 13, lineHeight: 20 },
  correctMark: { fontSize: 18, color: '#2E7D32', marginLeft: 8 },
  wrongMark: { fontSize: 18, color: '#C62828', marginLeft: 8 },
  nextBtn: {
    backgroundColor: '#FF9900',
    margin: 16,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF9900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  resultScroll: { flex: 1, paddingHorizontal: 16 },
  scoreCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  scoreIcon: { fontSize: 48, marginBottom: 12 },
  scoreValue: { fontSize: 56, fontWeight: 'bold', color: '#232F3E' },
  scoreTotal: { fontSize: 28, color: '#999' },
  scorePct: { fontSize: 24, color: '#666', marginTop: 4 },
  gradeBadge: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  gradeText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  resultSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#232F3E', marginBottom: 10 },
  resultItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  resultCorrect: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  resultWrong: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  resultHeader: { flexDirection: 'row', alignItems: 'center' },
  resultIcon: { fontSize: 18, marginRight: 8, width: 22 },
  resultQNum: { fontSize: 12, color: '#888', marginRight: 6, width: 24 },
  resultQFront: { flex: 1, fontSize: 13, color: '#333', fontWeight: '600' },
  correctAnswerBox: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#FFCDD2', flexDirection: 'row' },
  correctAnswerLabel: { fontSize: 12, color: '#C62828', fontWeight: 'bold', marginRight: 4 },
  correctAnswerText: { flex: 1, fontSize: 12, color: '#555', lineHeight: 18 },
  resultButtons: { gap: 10, marginTop: 16 },
  resultBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resultBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#888' },
});
