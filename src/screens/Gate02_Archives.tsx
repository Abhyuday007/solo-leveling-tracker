import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import { supabase } from '../../supabase';
import { useIsFocused } from '@react-navigation/native'; // Refreshes data when you switch tabs

export default function Gate02_Archives() {
  const [totalXp, setTotalXp] = useState(0);
  const [historyLog, setHistoryLog] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const isFocused = useIsFocused(); // Re-runs fetch every time you open this tab

  useEffect(() => {
    if (isFocused) {
      fetchArchives();
    }
  }, [isFocused]);

  const fetchArchives = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_campaigns')
        .select('total_xp, combat_log')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setTotalXp(data.total_xp || 0);
        setHistoryLog(data.combat_log || []);
      }
    } catch (error) {
      console.error("[Gate 02 Error]", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Level Math
  const currentLevel = Math.floor(totalXp / 500) + 1;
  const currentXPInLevel = totalXp % 500;
  const xpToNextLevel = 500;
  const progressPercentage = (currentXPInLevel / xpToNextLevel) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.systemSub}>GATE 02</Text>
          <Text style={styles.systemTitle}>THE ARCHIVES</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.trackerContainer}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelText}>CURRENT RANK: LEVEL {currentLevel}</Text>
                <Text style={styles.xpText}>{currentXPInLevel} / {xpToNextLevel} XP</Text>
              </View>
              
              <View style={styles.barBackground}>
                <MotiView 
                  key={`bar-${totalXp}`}
                  from={{ width: '0%' }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ type: 'spring', damping: 15 }}
                  style={styles.barFill}
                />
              </View>
              <Text style={styles.nextLevelSub}>{(xpToNextLevel - currentXPInLevel)} XP UNTIL LEVEL {currentLevel + 1}</Text>
            </View>

            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>COMBAT LOG</Text>
              
              <View style={styles.logList}>
                {historyLog.length === 0 ? (
                  <Text style={styles.emptyText}>No combat data recorded.</Text>
                ) : (
                  historyLog.map((item, index) => (
                    <MotiView 
                      key={item.id}
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                      style={styles.logItem}
                    >
                      <View style={styles.logLeft}>
                        <View style={styles.bulletPoint} />
                        <View>
                          <Text style={styles.logTaskTitle}>{item.title}</Text>
                          <Text style={styles.logDate}>{item.date}</Text>
                        </View>
                      </View>
                      <Text style={styles.logXp}>{item.xp}</Text>
                    </MotiView>
                  ))
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  header: { marginBottom: 40, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 15 },
  systemSub: { color: '#666', fontSize: 10, letterSpacing: 4, marginBottom: 5 },
  systemTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  trackerContainer: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1a1a1a', padding: 24, borderRadius: 4, marginBottom: 40 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  levelText: { color: '#ffffff', fontSize: 12, letterSpacing: 2, fontWeight: 'bold' },
  xpText: { color: '#aaaaaa', fontSize: 10, letterSpacing: 1 },
  barBackground: { height: 8, backgroundColor: '#111', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  barFill: { height: '100%', backgroundColor: '#ffffff', borderRadius: 4 },
  nextLevelSub: { color: '#444', fontSize: 9, letterSpacing: 2, textAlign: 'right' },
  historyContainer: { marginTop: 10 },
  historyTitle: { color: '#666', fontSize: 10, letterSpacing: 3, marginBottom: 20 },
  logList: { gap: 16 },
  emptyText: { color: '#444', fontStyle: 'italic', fontSize: 12, marginTop: 10 },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#111', paddingBottom: 16 },
  logLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 15 },
  bulletPoint: { width: 4, height: 4, backgroundColor: '#444', borderRadius: 2, marginRight: 15 },
  logTaskTitle: { color: '#cccccc', fontSize: 13, marginBottom: 4, lineHeight: 18 },
  logDate: { color: '#555555', fontSize: 9, letterSpacing: 1 },
  logXp: { color: '#4488ff', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 } // Highlighted XP color
});