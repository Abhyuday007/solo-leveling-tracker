import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ImageBackground, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { supabase } from '../../supabase';

const LORE_ART = { uri: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop' }; 
const screenWidth = Dimensions.get('window').width;

export default function Gate03_Lore() {
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState({
    xp: 0,
    level: 1,
    historyLabels: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
    historyData: [0, 0, 0, 0, 0, 0],
    skills: [0, 0, 0] // [Strength, Intelligence, Charisma]
  });

  useEffect(() => {
    fetchLoreData();
  }, []);

  async function fetchLoreData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all tasks for this player
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching lore:', error.message);
      setLoading(false);
      return;
    }

    if (data) {
      processPlayerData(data);
    }
  }

  function processPlayerData(tasks: any[]) {
    let totalXp = 0;
    let strengthXp = 0;
    let intXp = 0;
    let chaXp = 0;

    // 1. Generate the last 6 dates for the X-Axis
    const last6Days = Array.from({length: 6}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (5 - i));
      return d.toISOString().split('T')[0];
    });
    
    // Array to hold the XP earned exactly on those specific days
    const dailyEarned = [0, 0, 0, 0, 0, 0];

    tasks.forEach(task => {
      if (task.is_completed) {
        totalXp += task.xp_reward;
        
        // 2. Text Classification Engine (Categorize skills based on task titles)
        const title = task.title.toLowerCase();
        if (title.match(/(kg|press|gym|workout|run|squat|physique)/)) {
          strengthXp += task.xp_reward;
        } else if (title.match(/(leetcode|ds|ai|data|swayam|code|sql|python|system)/)) {
          intXp += task.xp_reward;
        } else {
          // Leadership, networking, and generic tasks default to Charisma
          chaXp += task.xp_reward; 
        }

        // 3. Map completed tasks to the timeline
        const taskDate = new Date(task.created_at).toISOString().split('T')[0];
        const dayIndex = last6Days.indexOf(taskDate);
        if (dayIndex !== -1) {
            dailyEarned[dayIndex] += task.xp_reward;
        }
      }
    });

    // 4. Calculate Cumulative Trajectory for the Line Chart
    let runningTotal = totalXp - dailyEarned.reduce((a, b) => a + b, 0); // Base XP from before the 6-day window
    const cumulativeHistory = dailyEarned.map(xp => {
        runningTotal += xp;
        return runningTotal;
    });

    // 5. Calculate Skill Mastery Percentages (Progress Rings require 0.0 to 1.0)
    // We base the rings on how balanced your current XP pool is
    const safeTotal = totalXp === 0 ? 1 : totalXp;
    const skills = [
      strengthXp / safeTotal, 
      intXp / safeTotal, 
      chaXp / safeTotal
    ];

    setPlayerStats({
      xp: totalXp,
      level: Math.floor(totalXp / 200) + 1,
      historyLabels: last6Days.map(date => date.substring(5)), // Format to MM-DD
      historyData: cumulativeHistory.every(val => val === 0) ? [0,0,0,0,0,0] : cumulativeHistory,
      skills: skills
    });
    setLoading(false);
  }

  const chartConfig = {
    backgroundGradientFrom: '#000000',
    backgroundGradientTo: '#000000',
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, 
    strokeWidth: 2,
    useShadowColorFromDataset: false,
    propsForDots: { r: "4", strokeWidth: "1", stroke: "#ffffff" }
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={LORE_ART} style={styles.artBackground}>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)', '#000000']} style={styles.gradientFade}>
          <SafeAreaView style={styles.headerSafeArea}>
            <Text style={styles.gateTitle}>GATE 03</Text>
            <Text style={styles.gateSubtitle}>PLAYER LORE</Text>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.voidContent}>
        {loading ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator color="#ffffff" size="large" />
            <Text style={{color: '#aaaaaa', marginTop: 15, letterSpacing: 2}}>COMPILING ARCHIVES...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            
            <View style={styles.identityBlock}>
              <Text style={styles.playerName}>ABHYUDAY</Text>
              <Text style={styles.playerClass}>CLASS: DATA SCIENCE VANGUARD</Text>
              <Text style={styles.playerRank}>RANK: {playerStats.level >= 10 ? 'A' : playerStats.level >= 5 ? 'C' : 'E'}   |   LEVEL: {playerStats.level}</Text>
            </View>

            <Text style={styles.sectionHeader}>XP TRAJECTORY (LAST 6 DAYS)</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: playerStats.historyLabels,
                  datasets: [{ data: playerStats.historyData }]
                }}
                width={screenWidth - 48}
                height={180}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={false}
              />
            </View>

            <Text style={styles.sectionHeader}>SKILL TREE (STR / INT / CHA)</Text>
            <View style={styles.chartContainer}>
              <ProgressChart
                data={{
                  labels: ['Strength', 'Intelligence', 'Charisma'],
                  data: playerStats.skills
                }}
                width={screenWidth - 48}
                height={180}
                strokeWidth={12}
                radius={28}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1, index) => {
                    const colors = ['rgba(255,255,255,1)', 'rgba(170,170,170,1)', 'rgba(85,85,85,1)'];
                    return colors[index || 0];
                  }
                }}
                hideLegend={false}
                style={styles.chart}
              />
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  artBackground: { height: 280, width: '100%' },
  gradientFade: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 10 },
  headerSafeArea: { marginTop: 50 },
  gateTitle: { color: '#ffffff', fontSize: 12, fontWeight: '700', letterSpacing: 4, opacity: 0.7 },
  gateSubtitle: { color: '#ffffff', fontSize: 32, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },
  voidContent: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 24 },
  identityBlock: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#333333', paddingBottom: 20 },
  playerName: { color: '#ffffff', fontSize: 24, letterSpacing: 4, marginBottom: 8 },
  playerClass: { color: '#aaaaaa', fontSize: 12, letterSpacing: 2, marginBottom: 4 },
  playerRank: { color: '#ffffff', fontSize: 10, letterSpacing: 2, fontWeight: 'bold' },
  sectionHeader: { color: '#aaaaaa', fontSize: 10, letterSpacing: 4, marginBottom: 15, marginTop: 10 },
  chartContainer: { borderWidth: 1, borderColor: '#333333', backgroundColor: '#050505', marginBottom: 25, paddingVertical: 10, alignItems: 'center' },
  chart: { paddingRight: 0 }
});