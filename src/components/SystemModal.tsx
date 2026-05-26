import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';

// We define the Task type here to pass it back to the main screen
export interface Task {
  id: string;
  title: string;
  difficulty: string;
  xp_reward: number;
  is_completed: boolean;
}

interface SystemModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmTasks: (tasks: Task[]) => void;
}

export default function SystemModal({ visible, onClose, onConfirmTasks }: SystemModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiState, setAiState] = useState<'input' | 'clarifying' | 'review'>('input');
  
  // Memory & Context
  const [initialGoal, setInitialGoal] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  
  // Clarification Data
  const [systemQuestion, setSystemQuestion] = useState('');
  const [systemOptions, setSystemOptions] = useState<string[]>([]);
  const [otherInput, setOtherInput] = useState('');

  // Review Data
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [systemExplanation, setSystemExplanation] = useState('');

  const processAiInteraction = async (userInput: string, isClarification: boolean = false) => {
    if (!userInput.trim()) return;
    setIsAnalyzing(true);
    
    if (!isClarification) setInitialGoal(userInput);
    
    const evaluationContext = isClarification 
      ? `Main Goal: "${initialGoal}". The user clarified with this specific focus: "${userInput}".`
      : `Main Goal: "${userInput}".`;
    
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key is missing!");
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

      const prompt = `
        You are the "System" from a gamified leveling tracker. 
        Context: ${evaluationContext}
        
        Evaluate if this goal is specific enough to break down into 3 highly actionable daily tasks (Dungeons).
        
        IF TOO VAGUE:
        Return a JSON object asking 1 specific clarifying question to narrow down the scope, along with 5 likely options.
        Format: {"status": "clarify", "question": "What is your primary tech stack?", "options": ["React", "Python", "Java", "Data Science", "C++"]}
        
        IF SPECIFIC ENOUGH:
        Generate 3 daily tasks. Assign difficulty ('C-Rank', 'B-Rank', 'A-Rank', 'S-Rank') and xp_reward (C=20, B=40, A=60, S=100).
        Provide a concise explanation (max 2 sentences) analyzing WHY these specific tasks are the optimal path to achieve the goal.
        Format: {"status": "ready", "explanation": "To achieve this, focusing on backend scalability is the highest leverage point.", "tasks": [{"title": "Task 1", "difficulty": "B-Rank", "xp_reward": 40}]}
        
        CRITICAL: Return ONLY valid JSON.
      `;

      const result = await model.generateContent(prompt);
      const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.status === 'clarify') {
        setSystemQuestion(parsed.question);
        setSystemOptions(parsed.options);
        setAiState('clarifying');
        setOtherInput('');
      } else if (parsed.status === 'ready') {
        const newTasks: Task[] = parsed.tasks.map((task: any, index: number) => ({
          id: Date.now().toString() + index,
          title: task.title,
          difficulty: task.difficulty,
          xp_reward: task.xp_reward,
          is_completed: false
        }));
        setPendingTasks(newTasks);
        setSystemExplanation(parsed.explanation);
        setAiState('review');
      }
      
    } catch (error) {
      console.error("System Error:", error);
      alert("System Failed to Analyze Target. Try rephrasing.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    if (aiState === 'review') setAiState('clarifying');
    else if (aiState === 'clarifying') setAiState('input');
  };

  const handleClose = () => {
    setAiState('input');
    setCurrentInput('');
    setInitialGoal('');
    setOtherInput('');
    setPendingTasks([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            
            {/* PHASE 1: INPUT */}
            {aiState === 'input' && (
              <View style={styles.phaseContainer}>
                <Text style={styles.systemVoice}>SYSTEM</Text>
                <Text style={styles.title}>IDENTIFY TARGET</Text>
                <Text style={styles.subtitle}>State your overarching objective. The System will architect the required milestones.</Text>
                
                <TextInput 
                  style={styles.inputBox} 
                  placeholder="e.g., Secure a remote tech role..." 
                  placeholderTextColor="#4d4d4d" 
                  value={currentInput} 
                  onChangeText={setCurrentInput} 
                  multiline 
                />
                
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.btnSecondary} onPress={handleClose} disabled={isAnalyzing}>
                    <Text style={styles.btnSecondaryText}>ABORT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnPrimary, !currentInput.trim() && styles.btnDisabled]} onPress={() => processAiInteraction(currentInput, false)} disabled={!currentInput.trim() || isAnalyzing}>
                    {isAnalyzing ? <ActivityIndicator color="#000" /> : <Text style={styles.btnPrimaryText}>INITIATE SCAN</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* PHASE 2: CLARIFICATION */}
            {aiState === 'clarifying' && (
              <View style={styles.phaseContainer}>
                <Text style={styles.systemVoice}>SYSTEM ALARM</Text>
                <Text style={styles.title}>TARGET TOO BROAD</Text>
                <Text style={styles.subtitle}>{systemQuestion}</Text>
                
                <View style={styles.optionsGrid}>
                  {systemOptions.map((opt, i) => (
                    <TouchableOpacity key={i} style={styles.optionBox} onPress={() => processAiInteraction(opt, true)} disabled={isAnalyzing}>
                      <Text style={styles.optionText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.otherRow}>
                  <TextInput style={[styles.inputBox, { flex: 1, minHeight: 50, marginBottom: 0 }]} placeholder="Specify other..." placeholderTextColor="#4d4d4d" value={otherInput} onChangeText={setOtherInput} />
                  <TouchableOpacity style={[styles.btnPrimary, { marginLeft: 10 }, !otherInput.trim() && styles.btnDisabled]} onPress={() => processAiInteraction(otherInput, true)} disabled={!otherInput.trim() || isAnalyzing}>
                     {isAnalyzing ? <ActivityIndicator color="#000" /> : <Text style={styles.btnPrimaryText}>SEND</Text>}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.btnSecondary, { marginTop: 30 }]} onPress={handleBack} disabled={isAnalyzing}>
                  <Text style={styles.btnSecondaryText}>RETURN</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PHASE 3: TACTICAL REVIEW */}
            {aiState === 'review' && (
              <View style={styles.phaseContainer}>
                <Text style={styles.systemVoice}>SYSTEM</Text>
                <Text style={styles.title}>TACTICAL REVIEW</Text>
                <Text style={styles.explanationText}>{systemExplanation}</Text>
                
                <View style={styles.taskPreviewList}>
                  {pendingTasks.map((task) => (
                    <View key={task.id} style={styles.taskPreviewCard}>
                       <Text style={styles.previewMeta}>RANK: {task.difficulty}   |   +{task.xp_reward} XP</Text>
                       <Text style={styles.previewTitle}>{task.title}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.btnSecondary} onPress={handleBack}>
                    <Text style={styles.btnSecondaryText}>REJECT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => { onConfirmTasks(pendingTasks); handleClose(); }}>
                    <Text style={styles.btnPrimaryText}>ACCEPT & INITIATE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)', // Deep void fade
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    padding: 30,
    maxHeight: '85%',
  },
  phaseContainer: {
    width: '100%',
  },
  systemVoice: {
    color: '#aaaaaa',
    fontSize: 10,
    letterSpacing: 4,
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    letterSpacing: 2,
    marginBottom: 16,
    // fontFamily: 'serif', 
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 30,
  },
  explanationText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 30,
    borderLeftWidth: 2,
    borderLeftColor: '#ffffff',
    paddingLeft: 15,
  },
  inputBox: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#4d4d4d',
    color: '#ffffff',
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 30,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  btnDisabled: {
    backgroundColor: '#333333',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#ffffff',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  optionBox: {
    borderWidth: 1,
    borderColor: '#4d4d4d',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 1,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskPreviewList: {
    gap: 10,
    marginBottom: 30,
  },
  taskPreviewCard: {
    borderWidth: 1,
    borderColor: '#333333',
    padding: 15,
  },
  previewMeta: {
    color: '#aaaaaa',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8,
  },
  previewTitle: {
    color: '#ffffff',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});