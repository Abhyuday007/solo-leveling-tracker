import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase';
import QuestCard from '../components/QuestCard';
import SystemModal, { Task } from '../components/SystemModal';

const PLACEHOLDER_ART = { uri: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop' };

export default function Gate01_Dungeons() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [playerXp, setPlayerXp] = useState(0); 
  const [isModalVisible, setModalVisible] = useState(false);

  // 1. Fetch Tasks from Cloud on Load
  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error.message);
    } else if (data) {
      setTasks(data);
      // Calculate XP based on completed tasks
      const earnedXp = data.filter(t => t.is_completed).reduce((acc, curr) => acc + curr.xp_reward, 0);
      setPlayerXp(earnedXp);
    }
  }

  // 2. Save AI Tasks to Cloud
  async function handleConfirmTasks(newTasks: Task[]) {
    console.log("1. Initiating Cloud Sync for tasks...", newTasks);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      alert("Authentication Error: Cannot verify Player ID.");
      console.error("Auth Error:", authError);
      return;
    }

    const tasksToInsert = newTasks.map(t => ({
      user_id: user.id,
      title: t.title,
      difficulty: t.difficulty,
      xp_reward: t.xp_reward,
      is_completed: false
    }));

    console.log("2. Sending payload to Supabase:", tasksToInsert);

    const { data, error } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (error) {
      alert(`Database Rejected Sync: ${error.message}`);
      console.error("Supabase Insert Error:", error);
    } else if (data) {
      console.log("3. Sync Successful. Data returned:", data);
      setTasks(prev => [...data, ...prev]);
    }
  }

  // 3. Update Cloud when Task is Toggled
  const toggleQuest = async (id: string, xpReward: number) => {
    // Find current state
    const taskTarget = tasks.find(t => t.id === id);
    if (!taskTarget) return;
    
    const newStatus = !taskTarget.is_completed;

    // Optimistically update UI instantly for a snappy feel
    setTasks(current => current.map(t => t.id === id ? { ...t, is_completed: newStatus } : t));
    
    // Update XP
    setPlayerXp(prev => newStatus ? prev + xpReward : prev - xpReward);

    // Sync to Supabase in the background
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: newStatus })
      .eq('id', id);

    if (error) {
      console.error("Failed to sync task status:", error.message);
      // If it fails, we would ideally revert the UI state here
    }
  };

  // Calculate Level dynamically (200 XP per level)
  const currentLevel = Math.floor(playerXp / 200) + 1;

  return (
    <View style={styles.container}>
      <ImageBackground source={PLACEHOLDER_ART} style={styles.artBackground}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
          style={styles.gradientFade}
        >
          <SafeAreaView style={styles.headerSafeArea}>
            <Text style={styles.gateTitle}>GATE 01</Text>
            <Text style={styles.gateSubtitle}>ACTIVE DUNGEONS</Text>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.voidContent}>
        <View style={styles.playerStats}>
          <Text style={styles.playerName}>ABHYUDAY</Text>
          <Text style={styles.playerLevel}>LEVEL {currentLevel}  //  XP: {playerXp}</Text>
        </View>

        <TouchableOpacity 
          style={styles.directiveButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.directiveButtonText}>+ ADD NEW DIRECTIVE</Text>
        </TouchableOpacity>

        {tasks.length === 0 ? (
          <Text style={{color: '#4d4d4d', textAlign: 'center', marginTop: 40, letterSpacing: 2}}>NO ACTIVE DUNGEONS. ADD DIRECTIVE.</Text>
        ) : (
          <FlatList 
            data={tasks} 
            keyExtractor={item => item.id} 
            renderItem={({ item }) => (
              <QuestCard 
                {...item} 
                onToggle={() => toggleQuest(item.id, item.xp_reward)} 
              />
            )} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}

        <SystemModal 
          visible={isModalVisible} 
          onClose={() => setModalVisible(false)} 
          onConfirmTasks={handleConfirmTasks} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  artBackground: { height: 350, width: '100%' },
  gradientFade: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 20 },
  headerSafeArea: { marginTop: 50 },
  gateTitle: { color: '#ffffff', fontSize: 12, fontWeight: '700', letterSpacing: 4, opacity: 0.7 },
  gateSubtitle: { color: '#ffffff', fontSize: 32, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },
  voidContent: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 24 },
  playerStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#ffffff', paddingBottom: 10 },
  playerName: { color: '#ffffff', fontSize: 18, letterSpacing: 2 },
  playerLevel: { color: '#aaaaaa', fontSize: 12, letterSpacing: 1 },
  directiveButton: { borderWidth: 1, borderColor: '#ffffff', padding: 15, alignItems: 'center', marginBottom: 20 },
  directiveButtonText: { color: '#ffffff', letterSpacing: 2, fontSize: 12 }
});