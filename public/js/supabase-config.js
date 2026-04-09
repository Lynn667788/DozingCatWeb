const SUPABASE_URL = 'https://dtkbnkqtgelwvtgmpaad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0a2Jua3F0Z2Vsd3Z0Z21wYWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDU4MzEsImV4cCI6MjA5MTMyMTgzMX0.RiitiByYneE0Fe9z6gNdwfDOrtYCbLXmhLA6w0xJYYM';

let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase 已初始化');
        return supabaseClient;
    }
    console.error('Supabase 库未加载');
    return null;
}

function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});
