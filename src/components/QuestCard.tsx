import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface QuestCardProps {
  id: string;
  title: string;
  difficulty: string;
  xp_reward: number;
  is_completed: boolean;
  onToggle: (id: string, xp: number) => void;
}

export default function QuestCard({ id, title, difficulty, xp_reward, is_completed, onToggle }: QuestCardProps) {
  return (
    <TouchableOpacity 
      style={[styles.card, is_completed && styles.cardCompleted]} 
      onPress={() => onToggle(id, xp_reward)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.title, is_completed && styles.titleCompleted]}>
          {title}
        </Text>
        <Text style={[styles.meta, is_completed && styles.metaCompleted]}>
          RANK: {difficulty}   |   REWARD: +{xp_reward} XP
        </Text>
      </View>
      <View style={[styles.runeCircle, is_completed && styles.runeCircleCompleted]}>
        {is_completed && <View style={styles.runeInner} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCompleted: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
    marginBottom: 6,
    // fontFamily: 'serif' // We will link a real font here later
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#7c7c7c',
  },
  meta: {
    color: '#aaaaaa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  metaCompleted: {
    color: '#4d4d4d',
  },
  runeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  runeCircleCompleted: {
    borderColor: '#7c7c7c',
  },
  runeInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
});