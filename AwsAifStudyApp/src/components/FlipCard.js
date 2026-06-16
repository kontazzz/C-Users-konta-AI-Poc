import React, { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function FlipCard({ front, back, onFlip }) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  const flip = () => {
    const toValue = isFlipped ? 0 : 180;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    const next = !isFlipped;
    setIsFlipped(next);
    onFlip && onFlip(next);
  };

  return (
    <TouchableOpacity onPress={flip} activeOpacity={0.9}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.card,
            styles.frontCard,
            { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity },
          ]}
        >
          <Text style={styles.hintText}>タップして答えを見る</Text>
          <Text style={styles.frontText}>{front}</Text>
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>👆 タップ</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            styles.backCard,
            { transform: [{ rotateY: backInterpolate }], opacity: backOpacity },
          ]}
        >
          <Text style={styles.hintText}>解説</Text>
          <Text style={styles.backText}>{back}</Text>
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>👆 タップして戻る</Text>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    height: 380,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: 24,
    backfaceVisibility: 'hidden',
    position: 'absolute',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  frontCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8F0FE',
  },
  backCard: {
    backgroundColor: '#F8FAFF',
    borderWidth: 2,
    borderColor: '#C5D8FF',
  },
  hintText: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11,
    color: '#999',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  frontText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A237E',
    textAlign: 'center',
    lineHeight: 38,
  },
  backText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  tapHint: {
    position: 'absolute',
    bottom: 14,
    right: 20,
  },
  tapHintText: {
    fontSize: 11,
    color: '#AAA',
  },
});
