import { supabase } from '../../supabase'; // Adjust path if necessary
import { runAwakeningCouncil } from '../services/aiCouncil';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const INTAKE_QUESTIONS = [
  // --- PHASE 1: THE BASELINE (Current Save File) ---
  { id: 'q1', type: 'choice', title: 'STATUS LOG', question: 'How would you describe your current save file?', options: ['Satisfied, but need an edge', 'Feeling stuck in a loop', 'At rock bottom, need a reset'] },
  { id: 'q2', type: 'choice', title: 'HISTORICAL DATA', question: 'When was the last time you felt truly proud of yourself?', options: ['Just today', 'A few weeks ago', 'A few months ago', 'Too long to remember'] },
  { id: 'q3', type: 'choice', title: 'GUILD STATUS', question: 'Where are you currently stationed in life?', options: ['Student / Academy', 'Early Career / Grinding', 'Mid-Career / Feeling Stuck', 'Solo Entrepreneur / Freelance'] },

  // --- PHASE 2: THE SKILL TREE (Target Selection) ---
  { id: 'q4', type: 'choice', title: 'SKILL TREE', question: 'Which attribute requires the most immediate XP?', options: ['Physical Health & Athletics', 'Career & Wealth Generation', 'Mental Peace & Clarity', 'Discipline & Deep Work'] },
  { id: 'q5', type: 'choice', title: 'CLASS SELECTION', question: 'What outcome matters most to you in this Campaign?', options: ['Building undeniable skills', 'Taking control of my time', 'Having endless daily energy', 'Getting promoted or launching a project'] },
  { id: 'q6', type: 'choice', title: 'THE MAIN QUEST', question: 'What is the ultimate focus of this 90-Day Season?', options: ['The Ironclad (Fitness Mastery)', 'The Architect (Career Builder)', 'The Scholar (Focus & Study)', 'The Monk (Mindset & Detox)'] },

  // --- PHASE 3: FRICTION & DEBUFFS (Identifying The Bosses) ---
  { id: 'q7', type: 'choice', title: 'BOSS FIGHT', question: 'What is the biggest boss currently stopping you?', options: ['The Time Void (I have no time)', 'The Motivation Drop (I give up easily)', 'The Overthinking Trap (I never start)', 'The Burnout Debuff (I have no energy)'] },
  { id: 'q8', type: 'choice', title: 'ACTIVE DEBUFFS', question: 'Which of these debuffs is quietly draining your daily HP?', options: ['Endless Doomscrolling', 'Junk Food / Sugar Spikes', 'Video Game / Media Addiction', 'None, I just lack structure'] },
  { id: 'q9', type: 'choice', title: 'THE ANTI-GOAL', question: 'Use negativity as fuel: Who do you absolutely REFUSE to become?', options: ['Someone who wastes their potential', 'Someone who is chronically tired', 'Someone who just talks, never acts', 'Someone who settles for average'] },
  { id: 'q10', type: 'choice', title: 'EMOTIONAL STATE', question: 'How does breaking your own promises make you feel?', options: ['Guilty and frustrated', 'Numb and apathetic', 'Anxious about the future', 'I brush it off, but I know it hurts me'] },

  // --- PHASE 4: SYSTEM MECHANICS (Daily Operations) ---
  { id: 'q11', type: 'choice', title: 'REGENERATION', question: 'How would you describe your current sleep rhythm?', options: ['Optimal (7-8 hours, refreshed)', 'Okay, but could be much better', 'Struggling (Insomnia / Revenge sleep)', 'Completely chaotic'] },
  { id: 'q12', type: 'choice', title: 'DOWNTIME LOG', question: 'Where do you usually spend your offline downtime?', options: ['Alone in my room', 'Outdoors / Gym / Cafe', 'With friends or family', 'Scrolling in bed'] },
  { id: 'q13', type: 'choice', title: 'DIFFICULTY CALIBRATION', question: 'How do you want the System to challenge you?', options: ['Gentle steps to build momentum', 'Steady growth, build up gradually', 'Push me hard, I can take pressure', 'Maximum difficulty, total immersion'] },
  { id: 'q14', type: 'choice', title: 'STAMINA ALLOCATION', question: 'How many daily hours can you strictly pledge without burning out?', options: ['1 Hour (Precision Strike)', '2-3 Hours (Deep Work)', '4+ Hours (Total War)'] },
  { id: 'q15', type: 'choice', title: 'THE PLEDGE', question: 'Are you ready to initialize the 90-Day Protocol?', options: ['I am ready.', 'Forge the System.', 'Let the Season begin.'] }
];

export default function Gate00_Awakening({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [blueprint, setBlueprint] = useState<any>(null);

  const currentQ = INTAKE_QUESTIONS[step];

  const handleSelect = async (answer: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newAnswers = { ...answers, [currentQ.id]: answer };
    setAnswers(newAnswers);

    if (step < INTAKE_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      await triggerAwakening(newAnswers);
    }
  };

    const triggerAwakening = async (finalAnswers: any) => {
        setIsProcessing(true);
    
        try {
        console.log("[System] Transmitting payload to AI Council...");
        const systemBlueprint = await runAwakeningCouncil(finalAnswers);
      
        console.log("[System] Blueprint Forged. Locking into Supabase Vault...");

      // 1. Get the current logged-in user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No authenticated user found.");

      // 2. Insert the blueprint into the cloud database
        const { error: dbError } = await supabase
            .from('user_campaigns')
            .insert([
            {
                user_id: user.id,
                player_class: systemBlueprint.player_class,
                campaign_title: systemBlueprint.master_campaign.title,
                empathy_insight: systemBlueprint.empathy_insight,
                starting_stats: systemBlueprint.starting_stats,
                daily_dungeons: systemBlueprint.daily_dungeons
            }
            ]);

        if (dbError) throw dbError;

        console.log("[System] Data successfully secured in the cloud.");

      // Save to local state so the next screens can use it immediately
        setBlueprint(systemBlueprint); 
      
        setIsProcessing(false);
        setHasCompleted(true);
      
        } catch (error) {
        console.error("[System Error]", error);
        alert("The System encountered an error saving your profile.");
        setIsProcessing(false);
        }
    };

    const enterSystem = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Pass the AI data to the MainTabs navigator
        navigation.replace('MainTabs', { 
        screen: 'GATE 01', 
        params: { aiBlueprint: blueprint } 
        }); 
    };
  return (
    <SafeAreaView style={styles.container}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        
        {/* Progress Bar Header */}
        {!hasCompleted && !isProcessing && (
          <View style={styles.progressHeader}>
            <Text style={styles.systemVoice}>AWAKENING PROTOCOL // PHASE {step + 1} OF {INTAKE_QUESTIONS.length}</Text>
            <View style={styles.progressBar}>
              <MotiView 
                style={styles.progressFill}
                animate={{ width: `${((step + 1) / INTAKE_QUESTIONS.length) * 100}%` }}
                transition={{ type: 'spring', damping: 15 }}
              />
            </View>
          </View>
        )}

        {/* --- STATE ROUTER --- */}
        {isProcessing ? (
          /* STATE 1: PROCESSING */
          <MotiView 
            from={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ type: 'spring', damping: 20 }}
            style={styles.centerBox}
          >
            <MotiView 
               from={{ opacity: 0.5 }} 
               animate={{ opacity: 1 }} 
               transition={{ type: 'timing', duration: 800, loop: true }}
            >
              <Text style={styles.processingTitle}>SUMMONING COUNCIL</Text>
            </MotiView>
            <Text style={styles.subProcessingText}>Analyzing psychological friction & forging 90-day architecture...</Text>
          </MotiView>
        
        ) : hasCompleted ? (
          /* STATE 2: COMPLETED */
          <MotiView 
            from={{ opacity: 0, translateY: 30 }} 
            animate={{ opacity: 1, translateY: 0 }} 
            transition={{ type: 'spring', damping: 15, delay: 200 }}
            style={styles.centerBox}
          >
            <Text style={styles.processingTitle}>PROFILE FORGED</Text>
            <Text style={styles.subProcessingText}>The System is ready for you.</Text>
            
            <TouchableOpacity style={styles.enterBtn} onPress={enterSystem}>
              <Text style={styles.enterBtnText}>BREACH GATE 01</Text>
            </TouchableOpacity>
          </MotiView>

        ) : (
          /* STATE 3: QUESTIONS */
          <View style={styles.questionContainer}>
            <AnimatePresence exitBeforeEnter>
              <MotiView
                key={currentQ.id}
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -15 }}
                transition={{ type: 'timing', duration: 250 }}
                style={styles.motiWrapper}
              >
                <Text style={styles.tagline}>{currentQ.title}</Text>
                <Text style={styles.question}>{currentQ.question}</Text>

                <View style={styles.optionsWrapper}>
                  {currentQ.options.map((opt, idx) => (
                    <MotiView
                      key={`${currentQ.id}-${idx}`}
                      from={{ opacity: 0, translateX: 30 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'spring', damping: 14, delay: idx * 100 }}
                    >
                      <TouchableOpacity 
                        style={styles.optionBtn}
                        activeOpacity={0.6}
                        onPress={() => handleSelect(opt)}
                      >
                        <Text style={styles.optionText}>{opt}</Text>
                      </TouchableOpacity>
                    </MotiView>
                  ))}
                </View>
              </MotiView>
            </AnimatePresence>
          </View>
        )}
        {/* --- END STATE ROUTER --- */}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  content: { flex: 1, padding: 24, justifyContent: 'flex-start', paddingTop: 60 },
  
  progressHeader: { marginBottom: 60 },
  systemVoice: { color: '#aaaaaa', fontSize: 10, letterSpacing: 4, marginBottom: 15 },
  progressBar: { height: 2, backgroundColor: '#1a1a1a', width: '100%' },
  progressFill: { height: '100%', backgroundColor: '#ffffff' },
  
  questionContainer: { flex: 1, justifyContent: 'center' },
  motiWrapper: { flex: 1, justifyContent: 'center', paddingBottom: 60 },
  tagline: { color: '#aaaaaa', fontSize: 12, letterSpacing: 3, marginBottom: 12 },
  question: { color: '#ffffff', fontSize: 28, letterSpacing: 1, fontWeight: 'bold', marginBottom: 40, lineHeight: 36 },
  
  optionsWrapper: { gap: 16 },
  optionBtn: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333333', paddingVertical: 20, paddingHorizontal: 24, borderRadius: 4 },
  optionText: { color: '#ffffff', fontSize: 14, letterSpacing: 1 },
  
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  processingTitle: { color: '#ffffff', fontSize: 16, letterSpacing: 6, fontWeight: 'bold', marginBottom: 12 },
  subProcessingText: { color: '#aaaaaa', fontSize: 12, letterSpacing: 2, textAlign: 'center', lineHeight: 20, paddingHorizontal: 40, marginBottom: 40 },
  
  enterBtn: { backgroundColor: '#ffffff', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 4 },
  enterBtnText: { color: '#000000', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 }
});