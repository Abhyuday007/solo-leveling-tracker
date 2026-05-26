import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ImageBackground, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase';

const ARCHIVE_ART = { uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1000&auto=format&fit=crop' }; 

export default function Gate02_Archives() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State for New Campaigns
  const [isModalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Archive Error:', error.message);
    } else if (data) {
      setCampaigns(data);
    }
    setLoading(false);
  }

  // Create a new long-term goal
  async function addCampaign() {
    if (!newTitle.trim() || !newTarget.trim() || isNaN(Number(newTarget))) {
      alert("System Error: Invalid parameters. Target must be a number.");
      return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('campaigns')
      .insert([{
        user_id: user.id,
        title: newTitle,
        target_progress: Number(newTarget),
        current_progress: 0,
        status: 'ACTIVE'
      }])
      .select();

    if (error) {
      alert(`Database Error: ${error.message}`);
    } else if (data) {
      setCampaigns(prev => [data[0], ...prev]);
      setModalVisible(false);
      setNewTitle('');
      setNewTarget('');
    }
    setIsSubmitting(false);
  }

  // Increment progress when you tap a card
  async function incrementProgress(id: string, current: number, target: number) {
    if (current >= target) return; // Already finished
    
    const newProgress = current + 1;
    const newStatus = newProgress >= target ? 'CONQUERED' : 'ACTIVE';

    // Optimistic UI Update for instant feedback
    setCampaigns(currentCamps => 
      currentCamps.map(c => 
        c.id === id ? { ...c, current_progress: newProgress, status: newStatus } : c
      )
    );

    // Sync to Cloud
    const { error } = await supabase
      .from('campaigns')
      .update({ current_progress: newProgress, status: newStatus })
      .eq('id', id);

    if (error) {
      console.error("Failed to sync progression:", error.message);
    }
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={ARCHIVE_ART} style={styles.artBackground}>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']} style={styles.gradientFade}>
          <SafeAreaView style={styles.headerSafeArea}>
            <Text style={styles.gateTitle}>GATE 02</Text>
            <Text style={styles.gateSubtitle}>MASTER ARCHIVES</Text>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.voidContent}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionHeader}>ACTIVE CAMPAIGNS</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addText}>+ DECLARE</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#ffffff" style={{marginTop: 40}} />
        ) : campaigns.length === 0 ? (
          <Text style={styles.emptyText}>THE ARCHIVES ARE EMPTY. DECLARE A CAMPAIGN.</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {campaigns.map((goal) => {
              const progressPercent = Math.min((goal.current_progress / goal.target_progress) * 100, 100);
              const isConquered = goal.status === 'CONQUERED';
              
              return (
                <TouchableOpacity 
                  key={goal.id} 
                  style={[styles.campaignCard, isConquered && styles.campaignCardConquered]} 
                  activeOpacity={0.7}
                  onPress={() => incrementProgress(goal.id, goal.current_progress, goal.target_progress)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.campaignStatus, isConquered && styles.textMuted]}>[{goal.status}]</Text>
                    <Text style={[styles.campaignProgress, isConquered && styles.textMuted]}>
                      {goal.current_progress} / {goal.target_progress}
                    </Text>
                  </View>
                  
                  <Text style={[styles.campaignTitle, isConquered && styles.textMuted]}>{goal.title}</Text>
                  
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }, isConquered && { backgroundColor: '#4d4d4d' }]} />
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}

        {/* DECLARE CAMPAIGN MODAL */}
        <Modal visible={isModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.systemVoice}>SYSTEM ARCHIVE</Text>
              <Text style={styles.modalTitle}>DECLARE MASTER CAMPAIGN</Text>
              
              <TextInput 
                style={styles.inputBox} 
                placeholder="e.g., The 30LPA Tech Vanguard" 
                placeholderTextColor="#4d4d4d" 
                value={newTitle} 
                onChangeText={setNewTitle} 
              />
              <TextInput 
                style={styles.inputBox} 
                placeholder="Target Number (e.g., 60 days, 100 hours)" 
                placeholderTextColor="#4d4d4d" 
                value={newTarget} 
                onChangeText={setNewTarget} 
                keyboardType="numeric"
              />
              
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalVisible(false)} disabled={isSubmitting}>
                  <Text style={styles.btnSecondaryText}>ABORT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={addCampaign} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.btnPrimaryText}>ETCH INTO ARCHIVE</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  artBackground: { height: 300, width: '100%' },
  gradientFade: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 20 },
  headerSafeArea: { marginTop: 50 },
  gateTitle: { color: '#ffffff', fontSize: 12, fontWeight: '700', letterSpacing: 4, opacity: 0.7 },
  gateSubtitle: { color: '#ffffff', fontSize: 32, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },
  voidContent: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#333333', paddingBottom: 10 },
  sectionHeader: { color: '#aaaaaa', fontSize: 10, letterSpacing: 4 },
  addText: { color: '#ffffff', fontSize: 10, letterSpacing: 2, fontWeight: 'bold' },
  emptyText: { color: '#4d4d4d', textAlign: 'center', marginTop: 40, letterSpacing: 2, fontSize: 12 },
  
  // Cards
  campaignCard: { borderWidth: 1, borderColor: '#333333', padding: 20, marginBottom: 15, backgroundColor: '#050505' },
  campaignCardConquered: { borderColor: '#111111', backgroundColor: '#000000' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  campaignStatus: { color: '#ffffff', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  campaignProgress: { color: '#aaaaaa', fontSize: 10, letterSpacing: 1 },
  campaignTitle: { color: '#ffffff', fontSize: 18, letterSpacing: 1, marginBottom: 20 },
  textMuted: { color: '#4d4d4d' },
  progressBarBg: { height: 2, backgroundColor: '#1a1a1a', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: '#ffffff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#000000', borderWidth: 1, borderColor: '#333333', padding: 30 },
  systemVoice: { color: '#aaaaaa', fontSize: 10, letterSpacing: 4, marginBottom: 8 },
  modalTitle: { color: '#ffffff', fontSize: 20, letterSpacing: 2, marginBottom: 30 },
  inputBox: { backgroundColor: '#000000', borderWidth: 1, borderColor: '#4d4d4d', color: '#ffffff', padding: 16, fontSize: 14, marginBottom: 20, letterSpacing: 1 },
  actionRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  btnPrimary: { flex: 1, backgroundColor: '#ffffff', paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#000000', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  btnSecondary: { flex: 1, backgroundColor: '#000000', borderWidth: 1, borderColor: '#ffffff', paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
});