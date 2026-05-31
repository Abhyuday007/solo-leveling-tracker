import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../supabase';
import { forgeNewDirective } from '../services/aiCouncil'; 

export default function Gate01_Dungeons() {
  const [quests, setQuests] = useState<any[]>([]);
  const [playerClass, setPlayerClass] = useState("LOADING...");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [combatLog, setCombatLog] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- DYNAMIC MODAL STATE ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalPhase, setModalPhase] = useState<'INPUT' | 'INTERROGATION'>('INPUT');
  const [directiveInput, setDirectiveInput] = useState('');
  const [aiQuestions, setAiQuestions] = useState('');
  const [userAnswers, setUserAnswers] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchActiveCampaign();
  }, []);

  const fetchActiveCampaign = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_campaigns')
        .select('id, player_class, daily_dungeons, total_xp, combat_log')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setCampaignId(data.id);
        setPlayerClass(data.player_class);
        setTotalXp(data.total_xp || 0);
        setCombatLog(data.combat_log || []);
        
        const formattedQuests = data.daily_dungeons.map((dungeon: any, index: number) => ({
          id: index.toString(),
          title: dungeon.title,
          difficulty: dungeon.difficulty,
          xp: dungeon.xp_reward,
          completed: dungeon.completed || false
        }));
        setQuests(formattedQuests);
      }
    } catch (error) {
      console.error("[Gate 01 Error]", error);
      setPlayerClass("SYSTEM OFFLINE");
    } finally {
      setIsLoading(false);
    }
  };

const handleProcessDirective = async () => {
    if (modalPhase === 'INPUT' && !directiveInput.trim()) return;
    if (modalPhase === 'INTERROGATION' && !userAnswers.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);

    try {
      // Call the AI. Pass answers if we are in the Interrogation phase.
      const aiResponse = await forgeNewDirective(directiveInput, modalPhase === 'INTERROGATION' ? userAnswers : "");

      if (aiResponse.requires_clarification) {
        // The AI decided the goal was too broad. Shift the UI to ask the user.
        setAiQuestions(aiResponse.clarification_message || "System requires more data. Please specify.");
        setModalPhase('INTERROGATION');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        // Safety check: ensure dungeons exist even if the AI hallucinates
        const dungeonsArray = aiResponse.dungeons || [];
        
        if (dungeonsArray.length === 0) {
           console.warn("[System] AI returned an empty array. Injecting fallback.");
           dungeonsArray.push({ title: `Execute Directive: ${directiveInput}`, difficulty: "C-Rank", xp_reward: 30 });
        }

        const offset = quests.length;
        const formattedNewQuests = dungeonsArray.map((task: any, index: number) => ({
          id: (offset + index).toString(),
          title: task.title,
          difficulty: task.difficulty,
          xp: task.xp_reward || 30, // Safety fallback for XP
          completed: false
        }));

        const updatedQuests = [...quests, ...formattedNewQuests];
        setQuests(updatedQuests);

        if (campaignId) {
          const dbDungeons = updatedQuests.map(q => ({
            title: q.title,
            difficulty: q.difficulty,
            xp_reward: q.xp,
            completed: q.completed
          }));

          await supabase
            .from('user_campaigns')
            .update({ daily_dungeons: dbDungeons })
            .eq('id', campaignId);
        }

        // Cleanup & Reset UI on Success
        resetModal();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("[Gate 01 Error] Directive Processing Failed:", error);
      // If the whole thing crashes, kick them back to the input screen
      resetModal(); 
    } finally {
      // THIS is the magic line. No matter what happens—success or crash—turn off the spinner.
      setIsGenerating(false);
    }
  };
  const resetModal = () => {
    setIsModalVisible(false);
    setModalPhase('INPUT');
    setDirectiveInput('');
    setUserAnswers('');
    setAiQuestions('');
  };

  // ... [Keep your existing toggleQuest function exactly the same here] ...
  const toggleQuest = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const questToToggle = quests.find(q => q.id === id);
    if (!questToToggle) return;

    const isCompleting = !questToToggle.completed;
    const xpAmount = Number(questToToggle.xp) || 0;

    let newTotalXp = totalXp;
    let newCombatLog = [...combatLog];

    if (isCompleting) {
      newTotalXp += xpAmount;
      newCombatLog.unshift({
        id: Date.now().toString(),
        title: questToToggle.title,
        xp: `+${xpAmount} XP`,
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      });
    } else {
      newTotalXp = Math.max(0, newTotalXp - xpAmount);
      const logIndex = newCombatLog.findIndex(log => log.title === questToToggle.title);
      if (logIndex > -1) newCombatLog.splice(logIndex, 1);
    }

    setQuests(quests.map(q => q.id === id ? { ...q, completed: isCompleting } : q));
    setTotalXp(newTotalXp);
    setCombatLog(newCombatLog);

    if (campaignId) {
      try {
        const dbDungeons = quests.map(q => 
          q.id === id ? { title: q.title, difficulty: q.difficulty, xp_reward: q.xp, completed: isCompleting } 
          : { title: q.title, difficulty: q.difficulty, xp_reward: q.xp, completed: q.completed }
        );
        await supabase.from('user_campaigns').update({ daily_dungeons: dbDungeons, total_xp: newTotalXp, combat_log: newCombatLog }).eq('id', campaignId);
      } catch (err) { console.error("Vault Sync Failed", err); }
    }
  };

  const currentLevel = Math.floor(totalXp / 500) + 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.systemSub}>GATE 01</Text>
          <Text style={styles.systemTitle}>ACTIVE DUNGEONS</Text>
          <View style={styles.playerInfoRow}>
            <Text style={styles.playerClass}>{playerClass.toUpperCase()}</Text>
            <Text style={styles.levelText}>LEVEL {currentLevel} // XP: {totalXp}</Text> 
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.addBtnText}>+ ADD NEW DIRECTIVE</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.questList}>
            {quests.length === 0 ? (
              <Text style={styles.emptyText}>No Active Dungeons. The System is dormant.</Text>
            ) : (
              quests.map((quest) => (
                <TouchableOpacity key={quest.id} style={styles.questCard} onPress={() => toggleQuest(quest.id)} activeOpacity={0.7}>
                  <View style={styles.questContent}>
                    <Text style={[styles.questTitle, quest.completed && styles.questCompletedText]}>{quest.title}</Text>
                    <Text style={styles.questMeta}>RANK: {quest.difficulty}  |  REWARD: +{quest.xp} XP</Text>
                  </View>
                  <View style={[styles.checkbox, quest.completed && styles.checkboxActive]}>
                    {quest.completed && <View style={styles.checkboxInner} />}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* DYNAMIC AI TERMINAL */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {modalPhase === 'INPUT' ? (
              <>
                <Text style={styles.modalTitle}>INPUT DIRECTIVE</Text>
                <Text style={styles.modalSub}>The AI will analyze your goal scope.</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Learn Python, Read a book..."
                  placeholderTextColor="#555"
                  value={directiveInput}
                  onChangeText={setDirectiveInput}
                  autoFocus
                  multiline
                />
              </>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: '#ffaa00' }]}>DIRECTIVE TOO BROAD</Text>
                <Text style={styles.modalAiQuestion}>"{aiQuestions}"</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Provide context..."
                  placeholderTextColor="#555"
                  value={userAnswers}
                  onChangeText={setUserAnswers}
                  autoFocus
                  multiline
                />
              </>
            )}

            {isGenerating ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={resetModal}>
                  <Text style={styles.modalCancelText}>ABORT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={handleProcessDirective}>
                  <Text style={styles.modalSubmitText}>
                    {modalPhase === 'INPUT' ? 'ANALYZE' : 'FORGE CAMPAIGN'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 15 },
  systemSub: { color: '#666', fontSize: 10, letterSpacing: 4, marginBottom: 5 },
  systemTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 2, marginBottom: 20 },
  playerInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerClass: { color: '#fff', fontSize: 12, letterSpacing: 2, fontWeight: 'bold' },
  levelText: { color: '#4488ff', fontSize: 10, letterSpacing: 2, fontWeight: 'bold' },
  addBtn: { borderWidth: 1, borderColor: '#333', paddingVertical: 15, alignItems: 'center', marginBottom: 40 },
  addBtnText: { color: '#666', fontSize: 10, letterSpacing: 3, fontWeight: 'bold' },
  questList: { gap: 20 },
  emptyText: { color: '#444', fontStyle: 'italic', fontSize: 12, textAlign: 'center', marginTop: 40 },
  questCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#111', paddingBottom: 20 },
  questContent: { flex: 1, paddingRight: 20 },
  questTitle: { color: '#ccc', fontSize: 14, lineHeight: 22, marginBottom: 8 },
  questCompletedText: { color: '#444', textDecorationLine: 'line-through' },
  questMeta: { color: '#555', fontSize: 9, letterSpacing: 2 },
  checkbox: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#555', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  checkboxActive: { borderColor: '#fff' },
  checkboxInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', padding: 24, borderRadius: 4 },
  modalTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  modalSub: { color: '#666', fontSize: 11, marginBottom: 20, lineHeight: 18 },
  modalAiQuestion: { color: '#ccc', fontSize: 13, fontStyle: 'italic', marginBottom: 20, lineHeight: 20, borderLeftWidth: 2, borderLeftColor: '#ffaa00', paddingLeft: 10 },
  modalInput: { backgroundColor: '#000', borderWidth: 1, borderColor: '#333', color: '#fff', padding: 16, fontSize: 14, borderRadius: 2, minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 16 },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelText: { color: '#666', fontSize: 10, letterSpacing: 2 },
  modalSubmit: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 2 },
  modalSubmitText: { color: '#000', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 }
});