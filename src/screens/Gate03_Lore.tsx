import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../supabase';

export default function Gate03_Lore({ navigation }: any) {
  const [playerClass, setPlayerClass] = useState("LOADING...");
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({ strength: 0, wisdom: 0, discipline: 0, focus: 0 });
  const [insight, setInsight] = useState({ 
    title: "SYNCING WITH VAULT...", 
    body: "Retrieving psychological profile." 
  });

  useEffect(() => {
    fetchLore();
  }, []);

  const fetchLore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_campaigns')
        .select('player_class, starting_stats, empathy_insight')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setPlayerClass(data.player_class);
        setStats(data.starting_stats);
        setInsight(data.empathy_insight);
      }
    } catch (error) {
      console.error("[Gate 03 Error]", error);
      setPlayerClass("SYSTEM OFFLINE");
      setInsight({ title: "DATA CORRUPTION", body: "Could not retrieve profile." });
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGOUT LOGIC ---
const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      Alert.alert("Logout Failed", error.message);
    } else {
      // Manually reset the entire navigation stack and kick the user to Login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Gate00_Login' }],
      });
    }
  };

  const statList = [
    { label: 'STRENGTH', value: stats.strength, color: '#ff4444' },
    { label: 'WISDOM', value: stats.wisdom, color: '#4488ff' },
    { label: 'DISCIPLINE', value: stats.discipline, color: '#ffaa00' },
    { label: 'FOCUS', value: stats.focus, color: '#00ffaa' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.systemSub}>GATE 03</Text>
          <Text style={styles.systemTitle}>PLAYER LORE</Text>
          <Text style={styles.playerClass}>{playerClass.toUpperCase()}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.insightBox}>
              <Text style={styles.insightSystem}>SYSTEM DIAGNOSTIC</Text>
              <Text style={styles.insightTitle}>"{insight.title}"</Text>
              <Text style={styles.insightBody}>{insight.body}</Text>
            </View>

            <View style={styles.statsContainer}>
              <Text style={styles.statsHeader}>BASE ATTRIBUTES</Text>
              
              {statList.map((stat, index) => (
                <View key={index} style={styles.statRow}>
                  <View style={styles.statLabelRow}>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <Text style={styles.statValue}>LVL {stat.value}</Text>
                  </View>
                  
                  <View style={styles.barBackground}>
                    <MotiView 
                      key={`bar-${stat.value}-${index}`}
                      from={{ width: '0%' }}
                      animate={{ width: `${(stat.value / 10) * 100}%` }}
                      transition={{ type: 'spring', damping: 15, delay: index * 150 }}
                      style={[styles.barFill, { backgroundColor: stat.color }]}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>SYSTEM LOGOUT</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 60 }, // Added bottom padding for scroll
  header: { marginBottom: 40, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 15 },
  systemSub: { color: '#666', fontSize: 10, letterSpacing: 4, marginBottom: 5 },
  systemTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  playerClass: { color: '#aaaaaa', fontSize: 12, letterSpacing: 3, fontWeight: 'bold' },
  insightBox: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1a1a1a', padding: 24, borderRadius: 4, marginBottom: 40 },
  insightSystem: { color: '#444', fontSize: 9, letterSpacing: 3, marginBottom: 15 },
  insightTitle: { color: '#ffffff', fontSize: 16, fontStyle: 'italic', fontWeight: 'bold', marginBottom: 10, lineHeight: 24 },
  insightBody: { color: '#888888', fontSize: 13, lineHeight: 22 },
  statsContainer: { marginTop: 10, marginBottom: 40 },
  statsHeader: { color: '#666', fontSize: 10, letterSpacing: 3, marginBottom: 20 },
  statRow: { marginBottom: 20 },
  statLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statLabel: { color: '#ffffff', fontSize: 11, letterSpacing: 2 },
  statValue: { color: '#aaaaaa', fontSize: 11, letterSpacing: 1 },
  barBackground: { height: 6, backgroundColor: '#111111', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  
  // New Logout Styles
  logoutBtn: { borderWidth: 1, borderColor: '#333333', paddingVertical: 18, alignItems: 'center', borderRadius: 4, marginTop: 20 },
  logoutBtnText: { color: '#ff4444', fontSize: 10, fontWeight: 'bold', letterSpacing: 3 }
});