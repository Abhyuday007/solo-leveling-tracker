
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbnssgyvhedosmzahlsz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNzZ3l2aGVkb3NtemFobHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTYwNDQsImV4cCI6MjA5NTI3MjA0NH0.k0547SnRyLK7Ev8V1dihL7Q5auj20xdbRL51ppPYNp8';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});