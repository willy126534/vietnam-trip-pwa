import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const { useState, useEffect, useRef } = React;

// --- Firebase Initialization ---
let app, auth, db;
if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey !== "REPLACE_ME") {
  app = initializeApp(window.FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn("Firebase not configured yet.");
}

const WHITELIST = ['asianinvasiongap@gmail.com', 'asd093454@gmail.com'];

// --- Data: Itinerary ---
const DEFAULT_ITINERARY = [
  { 
    day: 1, date: '05/26 (二)', title: '啟程與放鬆', summary: '抵達峴港，入住飯店並在海灘放鬆。', icon: 'ph-airplane-landing',
    activities: [
      { time: '10:00', type: 'flight', title: '搭機前往峴港', location: 'TPE -> DAD (具體航班待定)', color: 'blue', imageUrl: 'https://images.unsplash.com/photo-1581467464195-23c50005b4a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxhbGx8fGZsaWdodHxlbnwwfHx8fDE3MTgyNTg5Mzh8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '14:00', type: 'hotel', title: '抵達飯店 Check-in', location: '峴港市區 (親子友善飯店)', color: 'indigo', imageUrl: 'https://images.unsplash.com/photo-1618773959807-bb2b86062ac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTB8fGhvdGVsJTIwY2hlY2tpbnxlbnwwfHx8fDE3MTgyNTg5NjJ8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '16:00', type: 'activity', title: '美溪沙灘玩沙', location: 'My Khe Beach', color: 'green', imageUrl: 'https://images.unsplash.com/photo-1627883515828-e4b3706c9a9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTR8fG15JTIwa2hlJTIwYmVhY2h8ZW58MHx8fHwxNzE4MjU4OTc4fDA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '18:30', type: 'meal', title: '晚餐', location: '飯店附近海鮮餐廳', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1546069901-dcd136d8fce2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fHZpZXRuYW1lc2UlMjBzZWFmb29kJTIwcmVzdGF1cmFudHxlbnwwfHx8fDE3MTgyNTkwNjh8MA&ixlib=rb-4.0.3&q=80&w=400' }
    ]
  },
  { 
    day: 2, date: '05/27 (三)', title: '市區輕鬆遊', summary: '市區觀光與品嚐當地美食。', icon: 'ph-buildings',
    activities: [
      { time: '09:00', type: 'meal', title: '飯店早餐', location: '飯店內', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1505576189958-8549646487e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fGhvdGVsJTIwYnJlYWtmYXN0fGVufDB8fHx8MTcxODI1OTA4OXww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '10:30', type: 'activity', title: '粉紅教堂拍照', location: 'Da Nang Cathedral', color: 'pink', imageUrl: 'https://images.unsplash.com/photo-1629851722818-4a94689b9d3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MXx8RGFuYW5nJTIwQ2F0aGVkcmFsfGVufDB8fHx8MTcxODI1OTExMHww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '12:00', type: 'meal', title: '午餐：越式河粉', location: 'Pho 29 或周邊', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1620792374304-41d3b0e3564c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8NXx8cGhvJTIwdmlldG5hbWVzZXxlbnwwfHx8fDE3MTgyNTkxMzh8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '14:00', type: 'activity', title: '漢市場周邊散步', location: 'Han Market', color: 'green', imageUrl: 'https://images.unsplash.com/photo-1616790937748-0051e59c0700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTR8fEhhbiUyME1hcmtldHxlbnwwfHx8fDE3MTgyNTkxNTZ8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '16:00', type: 'hotel', title: '回飯店午休', location: '避免小孩太累', color: 'indigo', imageUrl: 'https://images.unsplash.com/photo-1618773959807-bb2b86062ac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTB8fGhvdGVsJTIwY2hlY2tpbnxlbnwwfHx8fDE3MTgyNTg5NjJ8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '18:30', type: 'meal', title: '晚餐', location: '市區餐廳', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1546069901-dcd136d8fce2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fHZpZXRuYW1lc2UlMjBzZWFmb29kJTIwcmVzdGF1cmFudHxlbnwwfHx8fDE3MTgyNTkwNjh8MA&ixlib=rb-4.0.3&q=80&w=400' }
    ]
  },
  { 
    day: 3, date: '05/28 (四)', title: '巴拿山一日遊', summary: '搭乘世界最長纜車與遊樂園放電。', icon: 'ph-mountains',
    activities: [
      { time: '08:30', type: 'activity', title: '包車前往巴拿山', location: 'Ba Na Hills', color: 'green', imageUrl: 'https://images.unsplash.com/photo-1596706019323-c90a169b1610?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8QmElMjBOYSUyMEhpbGxzfGVufDB8fHx8MTcxODI1OTE5MHww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '09:30', type: 'activity', title: '搭乘纜車 & 黃金佛手橋', location: 'Golden Bridge', color: 'yellow', imageUrl: 'https://images.unsplash.com/photo-1561705608-d21f83c16260?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8R29sZGVuJTIwQnJpZGdlfGVufDB8fHx8MTcxODI1OTIxMnww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '12:00', type: 'meal', title: '午餐：山上自助餐', location: 'Arapang 或其他餐廳', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a42322?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8YnVmZmV0JTIwZm9vZHxlbnwwfHx8fDE3MTgyNTkyMzV8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '13:30', type: 'activity', title: 'Fantasy Park 室內遊樂園', location: '適合小孩的遊樂設施', color: 'pink', imageUrl: 'https://images.unsplash.com/photo-1524368535817-af9576a6e110?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8YW11c2VtZW50JTIwcGFya3xlbnwwfHx8fDE3MTgyNTkyNjF8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '16:00', type: 'activity', title: '搭纜車下山', location: '', color: 'green', imageUrl: 'https://images.unsplash.com/photo-1596706019323-c90a169b1610?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8QmElMjBOYSUyMEhpbGxzfGVufDB8fHx8MTcxODI1OTE5MHww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '18:00', type: 'meal', title: '晚餐', location: '返回市區', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1546069901-dcd136d8fce2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fHZpZXRuYW1lc2UlMjBzZWFmb29kJTIwcmVzdGF1cmFudHxlbnwwfHx8fDE3MTgyNTkwNjh8MA&ixlib=rb-4.0.3&q=80&w=400' }
    ]
  },
  { 
    day: 4, date: '05/29 (五)', title: '前進會安', summary: '移動至會安並享受古鎮夜景。', icon: 'ph-car',
    activities: [
      { time: '10:00', type: 'activity', title: '包車前往會安', location: '車程約 45 分鐘', color: 'green', imageUrl: 'https://images.unsplash.com/photo-1544465595-5807c4270e5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8Y2FyJTIwdHJhdmVsfGVufDB8fHx8MTcxODI1OTMyOHww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '11:00', type: 'hotel', title: '抵達會安渡假村 Check-in', location: '會安', color: 'indigo', imageUrl: 'https://images.unsplash.com/photo-1564501049429-c07a04467c69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Nnx8aG9pJTIwYW4lMjByZXNvcnR8ZW58MHx8fHwxNzE4MjU5Mzg1fDA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '12:30', type: 'meal', title: '午餐', location: '會安特色美食', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1521783988732-c67d669c28e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTB8fGhvaSUyMGFuJTIwZm9vZHxlbnwwfHx8fDE3MTgyNTkzNjl8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '14:00', type: 'hotel', title: '飯店午休 / 泳池玩水', location: '飯店內', color: 'indigo', imageUrl: 'https://images.unsplash.com/photo-1564501049429-c07a04467c69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Nnx8aG9pJTIwYW4lMjByZXNvcnR8ZW58MHx8fHwxNzE4MjU5Mzg1fDA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '16:30', type: 'activity', title: '漫步會安古鎮', location: 'Hoi An Ancient Town', color: 'green', imageUrl: 'https://images.unsplash.com/photo-1559795090-3b6d0d2b6b1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTR8fGhvaSUyMGFuJTIwYW5jaWVudCUyMHRvd258ZW58MHx8fHwxNzE4MjU5NDEyfDA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '18:30', type: 'activity', title: '欣賞夜間燈籠與晚餐', location: '秋盆河畔', color: 'pink', imageUrl: 'https://images.unsplash.com/photo-1563212674-32e650b81467?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MXx8aG9pJTIwYW4lMjBsYW50ZXJuc3xlbnwwfHx8fDE3MTgyNTk0MzB8MA&ixlib=rb-4.0.3&q=80&w=400' }
    ]
  },
  { 
    day: 5, date: '05/30 (六)', title: '椰林竹籃船', summary: '有趣的生態體驗，非常適合小孩。', icon: 'ph-boat',
    activities: [
      { time: '09:00', type: 'meal', title: '飯店早餐', location: '飯店內', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1505576189958-8549646487e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fGhvdGVsJTIwYnJlYWtmYXN0fGVufDB8fHx8MTcxODI1OTA4OXww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '10:00', type: 'activity', title: '迦南島椰林竹籃船', location: 'Cam Thanh (約 1 小時)', color: 'blue', imageUrl: 'https://images.unsplash.com/photo-1627993081822-0d61845bb07f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8Y29jb251tCUyMGJhc2tldCUyMGJvYXR8ZW58MHx8fHwxNzE4MjU5NDY5fDA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '12:00', type: 'meal', title: '當地午餐', location: '迦南島周邊', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1521783988732-c67d669c28e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTB8fGhvaSUyMGFuJTIwZm9vZHxlbnwwfHx8fDE3MTgyNTkzNjl8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '14:00', type: 'hotel', title: '返回飯店休息', location: '避免午後高溫', color: 'indigo', imageUrl: 'https://images.unsplash.com/photo-1564501049429-c07a04467c69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Nnx8aG9pJTIwYW4lMjByZXNvcnR8ZW58MHx8fHwxNzE4MjU5Mzg1fDA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '16:30', type: 'activity', title: '自由活動', location: '可再次逛古鎮或在飯店休息', color: 'green', imageUrl: 'https://images.unsplash.com/photo-1559795090-3b6d0d2b6b1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTR8fGhvaSUyMGFuJTIwYW5jaWVudCUyMHRvd258ZW58MHx8fHwxNzE4MjU5NDEyfDA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '18:30', type: 'meal', title: '晚餐', location: '會安', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1563212674-32e650b81467?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MXx8aG9pJTIwYW4lMjBsYW50ZXJuc3xlbnwwfHx8fDE3MTgyNTk0MzB8MA&ixlib=rb-4.0.3&q=80&w=400' }
    ]
  },
  { 
    day: 6, date: '05/31 (日)', title: '文化體驗', summary: '體驗當地文化並返回峴港海景飯店。', icon: 'ph-lantern',
    activities: [
      { time: '09:30', type: 'activity', title: '傳統燈籠製作體驗 (簡單版)', location: '會安古鎮內', color: 'pink', imageUrl: 'https://images.unsplash.com/photo-1567117565972-2435e76d3338?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MXx8aG9pJTIwYW4lMjBsYW50ZXJuJTIwbWFraW5nfGVufDB8fHx8MTcxODI1OTUxMHww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '12:00', type: 'meal', title: '午餐', location: '古鎮咖啡廳', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1561081546-24e0b027c442?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8aG9pJTIwYW4lMjBjYWZlcmVzdGF1cmFudHxlbnwwfHx8fDE3MTgyNTk2MTZ8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '14:00', type: 'activity', title: '包車返回峴港', location: '', color: 'green', imageUrl: 'https://images.unsplash.com/photo-1544465595-5807c4270e5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8Y2FyJTIwdHJhdmVsfGVufDB8fHx8MTcxODI1OTMyOHww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '15:00', type: 'hotel', title: '入住海景渡假村', location: '峴港海灘區', color: 'indigo', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8NHx8c2VhJTIwdmlldyUyMHJlc29ydHxlbnwwfHx8fDE3MTgyNTk2NzB8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '16:00', type: 'hotel', title: '享受飯店設施', location: '親子遊戲室或泳池', color: 'blue', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8NHx8c2VhJTIwdmlldyUyMHJlc29ydHxlbnwwfHx8fDE3MTgyNTk2NzB8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '18:30', type: 'meal', title: '晚餐', location: '飯店內或周邊', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1546069901-dcd136d8fce2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fHZpZXRuYW1lc2UlMjBzZWFmb29kJTIwcmVzdGF1cmFudHxlbnwwfHx8fDE3MTgyNTkwNjh8MA&ixlib=rb-4.0.3&q=80&w=400' }
    ]
  },
  { 
    day: 7, date: '06/01 (一)', title: '渡假村放鬆', summary: '全日享受高級飯店設施與海灘。', icon: 'ph-swimming-pool',
    activities: [
      { time: '09:00', type: 'meal', title: '飯店豐盛早餐', location: '飯店內', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1505576189958-8549646487e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fGhvdGVsJTIwYnJlYWtmYXN0fGVufDB8fHx8MTcxODI1OTA4OXww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '10:30', type: 'hotel', title: '玩水 / 兒童俱樂部', location: '飯店內', color: 'blue', imageUrl: 'https://images.unsplash.com/photo-1564501049429-c07a04467c69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Nnx8aG90ZWwlMjBwb29sfGVufDB8fHx8MTcxODI1OTczOXww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '12:30', type: 'meal', title: '午餐', location: '飯店內或叫外送', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a42322?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8YnVmZmV0JTIwZm9vZHxlbnwwfHx8fDE3MTgyNTkyMzV8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '14:00', type: 'hotel', title: '午休', location: '飯店內', color: 'indigo', imageUrl: 'https://images.unsplash.com/photo-1618773959807-bb2b86062ac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTB8fGhvdGVsJTIwY2hlY2tpbnxlbnwwfHx8fDE3MTgyNTg5NjJ8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '16:30', type: 'activity', title: '海邊散步看夕陽', location: '私人海灘', color: 'green', imageUrl: 'https://images.unsplash.com/photo-1613545089332-ad185b3b185b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8ZGFuYW5nJTIwYmVhY2glMjBzdW5zZXR8ZW58MHx8fHwxNzE4MjU5Nzc3fDA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '18:30', type: 'meal', title: '晚餐', location: '', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1546069901-dcd136d8fce2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fHZpZXRuYW1lc2UlMjBzZWFmb29kJTIwcmVzdGF1cmFudHxlbnwwfHx8fDE3MTgyNTkwNjh8MA&ixlib=rb-4.0.3&q=80&w=400' }
    ]
  },
  { 
    day: 8, date: '06/02 (二)', title: '亞洲公園', summary: '傍晚前往亞洲公園搭乘摩天輪。', icon: 'ph-ferris-wheel',
    activities: [
      { time: '09:00', type: 'meal', title: '飯店早餐', location: '飯店內', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1505576189958-8549646487e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fGhvdGVsJTIwYnJlYWtmYXN0fGVufDB8fHx8MTcxODI1OTA4OXww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '10:30', type: 'hotel', title: '飯店設施放鬆', location: '', color: 'blue', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8NHx8c2VhJTIwdmlldyUyMHJlc29ydHxlbnwwfHx8fDE3MTgyNTk2NzB8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '12:30', type: 'meal', title: '午餐', location: '', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a42322?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8YnVmZmV0JTIwZm9vZHxlbnwwfHx8fDE3MTgyNTkyMzV8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '14:00', type: 'hotel', title: '午休', location: '', color: 'indigo', imageUrl: 'https://images.unsplash.com/photo-1618773959807-bb2b86062ac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTB8fGhvdGVsJTIwY2hlY2tpbnxlbnwwfHx8fDE3MTgyNTg5NjJ8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '16:00', type: 'activity', title: '前往亞洲公園', location: 'Asia Park', color: 'pink', imageUrl: 'https://images.unsplash.com/photo-1503970003010-8b63e80357d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MXx8QXNpYSUyMFBhcmt8ZW58MHx8fHwxNzE4MjU5ODIxfDA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '17:30', type: 'activity', title: '搭乘太陽摩天輪', location: 'Sun Wheel', color: 'yellow', imageUrl: 'https://images.unsplash.com/photo-1522075591965-ee449646b528?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MXx8U3VuJTIwV2hlZWwlMjBEYW5hbmd8ZW58MHx8fHwxNzE4MjU5ODQxfDA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '19:00', type: 'meal', title: '晚餐', location: '園區或市區', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1546069901-dcd136d8fce2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fHZpZXRuYW1lc2UlMjBzZWFmb29kJTIwcmVzdGF1cmFudHxlbnwwfHx8fDE3MTgyNTkwNjh8MA&ixlib=rb-4.0.3&q=80&w=400' }
    ]
  },
  { 
    day: 9, date: '06/03 (三)', title: '滿載而歸', summary: '採買伴手禮並搭機返回台北。', icon: 'ph-airplane-takeoff',
    activities: [
      { time: '09:00', type: 'meal', title: '飯店早餐', location: '飯店內', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1505576189958-8549646487e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fGhvdGVsJTIwYnJlYWtmYXN0fGVufDB8fHx8MTcxODI1OTA4OXww&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '10:00', type: 'activity', title: '整理行李 & Check-out', location: '飯店內', color: 'indigo', imageUrl: 'https://images.unsplash.com/photo-1618773959807-bb2b86062ac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTB8fGhvdGVsJTIwY2hlY2tpbnxlbnwwfHx8fDE3MTgyNTg5NjJ8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '11:00', type: 'activity', title: '採買伴手禮', location: 'Vincom Plaza 或 Big C', color: 'green', imageUrl: 'https://images.unsplash.com/photo-1542838132-ff45b3a3250b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8dmllbmFtZXNlJTIwc2hvcHBpbmclMjBtYXJrZXR8ZW58MHx8fHwxNzE4MjU5ODczfDA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '12:30', type: 'meal', title: '午餐', location: '市區', color: 'orange', imageUrl: 'https://images.unsplash.com/photo-1521783988732-c67d669c28e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTB8fGhvaSUyMGFuJTIwZm9vZHxlbnwwfHx8fDE3MTgyNTkzNjl8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '14:00', type: 'flight', title: '前往峴港機場', location: 'DAD', color: 'blue', imageUrl: 'https://images.unsplash.com/photo-1581467464195-23c50005b4a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxhbGx8fGZsaWdodHxlbnwwfHx8fDE3MTgyNTg5Mzh8MA&ixlib=rb-4.0.3&q=80&w=400' },
      { time: '16:00', type: 'flight', title: '搭機返回台北', location: 'DAD -> TPE', color: 'blue', imageUrl: 'https://images.unsplash.com/photo-1581467464195-23c50005b4a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxhbGx8fGZsaWdodHxlbnwwfHx8fDE3MTgyNTg5Mzh8MA&ixlib=rb-4.0.3&q=80&w=400' }
    ]
  }
];

// --- AI Models Configuration ---
const AI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash ⚡' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro 🧠' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'ollama/gemma4', label: 'Ollama Gemma4 (本機)' },
];

// --- Global AI Call Helper Function ---
async function callAI(model, prompt, geminiKey) {
    if (model.startsWith('ollama/')) {
      const ollamaModel = model.replace('ollama/', '');
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: ollamaModel, prompt, stream: false })
      });
      if (!res.ok) throw new Error('Ollama 呼叫失敗，請確認 Ollama 正在執行 (port 11434)。');
      const data = await res.json();
      return data.response;
    } else {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Gemini API 失敗: ${errData.error?.message || '未知錯誤'}`);
      }
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }
}


// --- Components ---

function LoginScreen({ onLogin }) {
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    if (!auth) return setError("Firebase 未設定完成！");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (!WHITELIST.includes(result.user.email)) {
        await signOut(auth);
        setError("存取被拒：您的信箱不在白名單內。");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <i className="ph ph-airplane-tilt text-6xl text-blue-500 mb-4 inline-block"></i>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">2026 越南家庭遊</h1>
        <p className="text-gray-500 mb-8 text-sm">請使用授權的 Google 帳號登入</p>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          使用 Google 登入
        </button>
      </div>
    </div>
  );
}

function EditableText({ value, onSave, className, isMultiline = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (tempValue !== value) {
      onSave(tempValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isMultiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(value);
    }
  };

  if (isEditing) {
    return isMultiline ? (
      <textarea
        ref={inputRef}
        value={tempValue}
        onChange={e => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`w-full bg-blue-50/50 border border-blue-200 rounded px-1 outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
        rows={3}
      />
    ) : (
      <input
        ref={inputRef}
        type="text"
        value={tempValue}
        onChange={e => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`w-full bg-blue-50/50 border border-blue-200 rounded px-1 outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
        onClick={e => e.stopPropagation()}
      />
    );
  }

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
      className={`cursor-text hover:bg-yellow-50 rounded px-1 -mx-1 transition-colors border border-transparent hover:border-yellow-200 ${className}`}
      title="點擊以編輯 (Click to edit)"
    >
      {value || <span className="text-gray-300 italic">點此輸入...</span>}
    </div>
  );
}

function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=16.0678&longitude=108.2208&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code")
      .then(res => res.json())
      .then(data => setWeather(data.current))
      .catch(() => setWeather({ temperature_2m: 28, relative_humidity_2m: 80, apparent_temperature: 31, weather_code: 1 }));
  }, []);

  if (!weather) return <div className="h-28 bg-gradient-to-br from-[#2b4c65] to-[#4a7c8e] rounded-xl animate-pulse m-4"></div>;

  return (
    <div className="bg-gradient-to-br from-[#2b4c65] to-[#4a7c8e] rounded-xl p-4 m-4 text-white shadow-md relative overflow-hidden">
       <div className="relative z-10 flex justify-between items-start">
         <div>
           <p className="text-xs text-gray-200 mb-1">越南 峴港</p>
           <h1 className="text-4xl font-bold mb-1">{Math.round(weather.temperature_2m)}°C</h1>
           <p className="text-[10px] text-gray-200 mb-2">體感 {Math.round(weather.apparent_temperature)}°C · 濕度 {weather.relative_humidity_2m}%</p>
           <div className="bg-white/20 text-[10px] px-2 py-1 rounded inline-block backdrop-blur-sm">
             穿搭建議：夏季短袖 + 防曬薄外套
           </div>
         </div>
         <div className="flex flex-col items-center mt-2">
           <i className="ph-fill ph-sun text-4xl text-yellow-300 mb-1 drop-shadow-md"></i>
           <span className="text-[10px]">Clear</span>
         </div>
       </div>
    </div>
  );
}

function Itinerary() {
  const [itineraryData, setItineraryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [mapLocation, setMapLocation] = useState(null);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "itinerary"), orderBy("day", "asc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const item of DEFAULT_ITINERARY) {
            await setDoc(doc(db, "itinerary", `day${item.day}`), item);
          }
        } catch (err) {
          console.error("Error seeding itinerary:", err);
        }
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItineraryData(data);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateDayField = async (docId, field, newValue) => {
    if (!db) return;
    try { await updateDoc(doc(db, "itinerary", docId), { [field]: newValue }); } 
    catch (err) { alert("更新失敗：" + err.message); }
  };

  const updateActivityField = async (docId, dayData, activityIndex, field, newValue) => {
    if (!db) return;
    const newActivities = [...dayData.activities];
    newActivities[activityIndex] = { ...newActivities[activityIndex], [field]: newValue };
    try { await updateDoc(doc(db, "itinerary", docId), { activities: newActivities }); } 
    catch (err) { alert("更新失敗：" + err.message); }
  };

  const getIconForType = (type) => {
    const icons = { flight: 'ph-airplane-tilt', hotel: 'ph-bed', activity: 'ph-camera', meal: 'ph-fork-knife' };
    return icons[type] || 'ph-map-pin';
  };

  if (loading) return <div className="p-10 text-center text-gray-500"><i className="ph ph-spinner-gap animate-spin text-2xl"></i></div>;

  const currentDayData = itineraryData.find(d => d.day === activeDay) || itineraryData[0];
  if (!currentDayData) return null;

  return (
    <div className="pb-24 bg-[#f5f6f8] min-h-screen">
      {/* Header */}
      <div className="bg-[#1E2336] text-white p-4 flex justify-between items-center sticky top-0 z-30">
        <h2 className="text-lg font-bold tracking-wider">越南峴港 2026</h2>
        <button className="bg-white/10 px-3 py-1 rounded text-xs font-bold border border-white/20">EN</button>
      </div>

      <WeatherWidget />

      {/* Horizontal Day Selector */}
      <div className="bg-[#f5f6f8] sticky top-[60px] z-20 px-4 py-2 overflow-x-auto hide-scrollbar flex gap-3 border-b border-gray-200">
        {itineraryData.map(item => {
          const isActive = activeDay === item.day;
          const dateParts = item.date.split(' ');
          const dayNum = dateParts[0].split('/')[1]; 
          const dayWeek = dateParts[1]?.replace('(', '')?.replace(')', '') || '';
          
          return (
            <button 
              key={item.id}
              onClick={() => setActiveDay(item.day)}
              className={`flex-none w-[52px] h-[60px] rounded-xl flex flex-col items-center justify-center transition-all ${isActive ? 'bg-[#1E2336] text-white shadow-md shadow-[#1E2336]/30' : 'bg-white text-[#1E2336] shadow-sm'}`}
            >
              <span className="text-[16px] font-extrabold leading-none mb-1">{dayNum}</span>
              <span className={`text-[10px] font-bold ${isActive ? 'text-[#a5b4fc]' : 'text-[#60a5fa]'}`}>{dayWeek}</span>
            </button>
          )
        })}
      </div>

      <div className="p-4">
        {/* Day Header Info */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-[#1E2336] text-white text-[10px] font-bold px-2 py-1 rounded-md">第 {currentDayData.day} 天</span>
            <span className="text-xs text-gray-500 font-bold">Phase 1 : 峴港都會 & 海灘</span>
          </div>
          <div className="flex items-start gap-2">
            <h2 className="text-lg font-bold text-[#1E2336] mb-1 flex-1">
              {currentDayData.date.split(' ')[0]} <EditableText value={currentDayData.title} onSave={(val) => updateDayField(currentDayData.id, 'title', val)} className="inline-block ml-1"/>
            </h2>
          </div>
          <div className="bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded inline-block mt-2">
            ⚡ 包含 {currentDayData.activities?.length || 0} 個行程
          </div>
        </div>

        {/* Edit Button */}
        <div className="bg-[#1E2336] text-white rounded-xl py-3 text-center text-sm font-bold shadow-sm mb-6 flex items-center justify-center gap-2">
           <i className="ph-fill ph-pencil-simple"></i> 點擊下方文字直接編輯
        </div>

        {/* Vertical Timeline */}
        <div className="space-y-0 relative ml-1">
          {/* Main vertical line */}
          <div className="absolute left-[20px] top-6 bottom-10 w-[2px] bg-gray-200 z-0"></div>
          
          {currentDayData.activities && currentDayData.activities.map((activity, idx) => (
            <div key={idx} className="relative z-10 flex gap-4 pt-2 pb-4">
               {/* Time & Dot */}
               <div className="w-12 pt-3 flex flex-col items-center shrink-0">
                 <EditableText 
                    value={activity.time} 
                    onSave={(newVal) => updateActivityField(currentDayData.id, currentDayData, idx, 'time', newVal)} 
                    className="text-[11px] font-extrabold text-gray-600 mb-2 w-full text-center bg-[#f5f6f8]"
                 />
                 <div className="w-2.5 h-2.5 rounded-full bg-[#4a7c8e] ring-4 ring-[#f5f6f8] z-10 mt-1"></div>
               </div>

               {/* Activity Card */}
               <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                 {activity.imageUrl && (
                   <img 
                     src={activity.imageUrl} 
                     alt={activity.title} 
                     className="w-full h-32 object-cover rounded-lg mb-3 border border-gray-100" 
                     onError={(e) => {e.target.onerror = null; e.target.src="https://via.placeholder.com/200x100?text=No+Image"}} 
                   />
                 )}
                 <div className="flex justify-between items-start mb-2">
                   <span className="bg-blue-50 text-[#4a7c8e] text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                     <i className={`ph-fill ${getIconForType(activity.type)}`}></i> 
                     {activity.type === 'flight' ? '航班' : activity.type === 'hotel' ? '住宿' : activity.type === 'meal' ? '美食' : '景點'}
                   </span>
                 </div>
                 
                 <EditableText 
                   value={activity.title} 
                   onSave={(newVal) => updateActivityField(currentDayData.id, currentDayData, idx, 'title', newVal)} 
                   className="font-extrabold text-[#1E2336] text-base mb-1 block"
                 />
                 
                 <div className="text-xs text-gray-500 mb-3 min-h-[16px]">
                   <EditableText 
                     value={activity.location} 
                     onSave={(newVal) => updateActivityField(currentDayData.id, currentDayData, idx, 'location', newVal)} 
                   />
                 </div>
                 
                 {/* Map Button */}
                 {activity.location && activity.type !== 'flight' && (
                    <button 
                      onClick={() => setMapLocation(activity.location)}
                      className="w-fit bg-[#4a7c8e] text-white text-[10px] font-medium py-1.5 px-3 rounded-md flex items-center justify-center gap-1 shadow-sm mt-2 hover:bg-[#3b6675] transition-colors"
                    >
                      <i className="ph-fill ph-map-pin text-red-300"></i> 地圖
                    </button>
                 )}
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Modal */}
      {mapLocation && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
            <div className="bg-[#1E2336] text-white p-3 flex justify-between items-center">
              <h3 className="font-bold text-sm truncate flex-1 flex items-center gap-2"><i className="ph-fill ph-map-pin text-red-400"></i> {mapLocation}</h3>
              <button onClick={() => setMapLocation(null)} className="text-gray-300 hover:text-white p-1">
                <i className="ph-bold ph-x text-lg"></i>
              </button>
            </div>
            <div className="h-[400px] w-full bg-gray-100">
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                style={{border:0}} 
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapLocation)}&output=embed`} 
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-3 bg-gray-50 flex justify-end">
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapLocation)}`} target="_blank" className="bg-[#4a7c8e] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#3b6675] transition-colors">
                 開啟 Google Maps <i className="ph-bold ph-arrow-square-out"></i>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Souvenirs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorAi, setErrorAi] = useState('');
  const [config, setConfig] = useState({ geminiKey: '', aiModel: 'gemini-2.5-flash' });
  const [isConfiguring, setIsConfiguring] = useState(false); // Flag for config screen if keys are missing

  useEffect(() => {
    if (!db) return;
    const unsubscribeConfig = onSnapshot(doc(db, "system_config", "ai_keys"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig(prev => ({ aiModel: 'gemini-2.5-flash', ...data }));
        if (!data.geminiKey && !data.aiModel?.startsWith('ollama/')) {
          setIsConfiguring(true); // Keys are missing, show config
        } else {
          setIsConfiguring(false); // Keys are present
        }
      } else {
        setIsConfiguring(true); // No config document, show config
      }
    });
    return () => unsubscribeConfig();
  }, []);

  const fetchAiRecommendations = async () => {
    if (!config.geminiKey && !config.aiModel.startsWith('ollama/')) {
      setErrorAi('請先在 AI 工程師頁面設定 Gemini API Key 或選擇 Ollama 模型！');
      // Do not clear recommendations if error is config related, let user fix config
      return;
    }
    if (!searchTerm.trim()) {
      setAiRecommendations([]); // Clear recommendations if search term is empty
      setErrorAi('');
      return;
    }

    setLoadingAi(true);
    setErrorAi('');
    try {
      const prompt = `請根據關鍵字「${searchTerm}」推薦5個越南峴港的伴手禮。以 JSON 陣列格式回傳，每個物件包含 'name'(名稱), 'description'(描述), 'imageUrl'(真實有效的圖片 URL), 'whereToBuy'(哪裡買) 欄位。imageUrl 必須是來自公開網域且真實有效的圖片 URL，例如來自 Pexels、Unsplash 或 Flickr。`;
      let response = await callAI(config.aiModel, prompt, config.geminiKey);
      
      // Attempt to parse JSON. Sometimes LLMs include extra text.
      const jsonMatch = response.match(/json\n([\s\S]*?)\n/);
      if (jsonMatch && jsonMatch[1]) {
        response = jsonMatch[1];
      }
      
      const parsedRecommendations = JSON.parse(response);
      if (Array.isArray(parsedRecommendations)) {
        setAiRecommendations(parsedRecommendations);
      } else {
        throw new Error('AI 回傳的格式不正確，請再試一次。');
      }
    } catch (err) {
      console.error("Error fetching AI recommendations:", err);
      setErrorAi('AI 推薦失敗: ' + err.message);
      setAiRecommendations([]); // Clear previous recommendations on AI error
    } finally {
      setLoadingAi(false);
    }
  };

  const debouncedFetch = useRef(null);
  useEffect(() => {
    if (debouncedFetch.current) {
      clearTimeout(debouncedFetch.current);
    }
    // Only debounce if not initially loading/configuring
    if (!isConfiguring || (config.geminiKey || config.aiModel.startsWith('ollama/'))) {
      debouncedFetch.current = setTimeout(() => {
        fetchAiRecommendations();
      }, 800); // Debounce by 800ms
    }
    return () => clearTimeout(debouncedFetch.current);
  }, [searchTerm, config.aiModel, config.geminiKey, isConfiguring]); // Re-run if config changes

  // If the user hasn't configured AI keys, show a simple message or direct them to AI settings.
  if (isConfiguring && (!config.geminiKey && !config.aiModel.startsWith('ollama/'))) {
    return (
      <div className="pb-24 bg-[#f5f6f8] min-h-screen p-4">
        <div className="bg-[#1E2336] text-white p-6 shadow-sm sticky top-0 z-10">
          <h2 className="text-2xl font-bold">推薦伴手禮</h2>
        </div>
        <div className="bg-red-100 text-red-700 p-4 rounded-xl mt-4 text-center">
          <i className="ph-fill ph-warning text-3xl mb-2"></i>
          <p className="font-bold">AI 服務未設定！</p>
          <p className="text-sm">請前往「AI 工程師」頁面設定 Gemini API Key 或選擇 Ollama 模型。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-[#f5f6f8] min-h-screen">
      <div className="bg-[#1E2336] text-white p-6 shadow-sm sticky top-0 z-10">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <i className="ph-fill ph-shopping-bag"></i> AI 伴手禮推薦
        </h2>
        <p className="text-[10px] text-gray-300 mt-1">即時搜尋越南峴港的伴手禮</p>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="搜尋伴手禮 (例如：咖啡、腰果、衣服)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
          />
        </div>

        {loadingAi && (
          <div className="text-center text-orange-500 py-6">
            <i className="ph ph-spinner-gap animate-spin text-3xl mb-2 block"></i>
            <p>AI 正在努力生成推薦中...</p>
          </div>
        )}

        {errorAi && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
            <i className="ph-bold ph-warning"></i>
            {errorAi}
          </div>
        )}

        {!loadingAi && aiRecommendations.length === 0 && searchTerm.trim() && !errorAi && (
          <div className="text-center text-gray-400 py-10">
            <i className="ph-fill ph-robot text-6xl text-gray-300 mb-2 block"></i>
            沒有找到相關伴手禮，請嘗試其他關鍵字。
          </div>
        )}

        <div className="space-y-4">
          {!loadingAi && aiRecommendations.map((item, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-4">
              {item.imageUrl && (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border border-gray-100" 
                  onError={(e) => {e.target.onerror = null; e.target.src="https://via.placeholder.com/96x96?text=No+Image"}} // Fallback for broken images
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1 text-[#1E2336]">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-2 leading-snug">{item.description}</p>
                {item.whereToBuy && (
                  <div className="bg-blue-50 text-[#4a7c8e] text-xs font-bold px-2 py-1 rounded inline-block mt-1">
                    哪裡買：{item.whereToBuy}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Original hardcoded items - displayed only if no search term and no AI recommendations */}
        {!loadingAi && !searchTerm.trim() && aiRecommendations.length === 0 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-orange-500 flex items-start gap-4">
                <img src="https://images.unsplash.com/photo-1595185966956-f844007d3536?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="帶皮腰果" className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
                <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 text-[#1E2336]">帶皮腰果</h3>
                    <p className="text-sm text-gray-500 mb-2">越南特產，香脆可口，適合長輩。</p>
                    <div className="bg-blue-50 text-[#4a7c8e] text-xs font-bold px-2 py-1 rounded inline-block">哪裡買：Han Market 或 Lotte Mart</div>
                </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-yellow-600 flex items-start gap-4">
                <img src="https://images.unsplash.com/photo-1520624021703-0c464efc96cb?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="G7 咖啡" className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
                <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 text-[#1E2336]">G7 咖啡 / 滴漏咖啡</h3>
                    <p className="text-sm text-gray-500 mb-2">經典越式咖啡，伴手禮首選。</p>
                    <div className="bg-blue-50 text-[#4a7c8e] text-xs font-bold px-2 py-1 rounded inline-block">哪裡買：各大超市均有販售</div>
                </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-green-500 flex items-start gap-4">
                <img src="https://images.unsplash.com/photo-1582239328574-e3fb6b8e39f3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="綠豆糕" className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
                <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 text-[#1E2336]">綠豆糕 / 椰子糖</h3>
                    <p className="text-sm text-gray-500 mb-2">在地傳統甜點，小朋友最愛。</p>
                    <div className="bg-blue-50 text-[#4a7c8e] text-xs font-bold px-2 py-1 rounded inline-block mt-1">哪裡買：漢市場或雜貨店</div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function Transport() {
  return (
    <div className="pb-24 bg-[#f5f6f8] min-h-screen">
      <div className="bg-[#1E2336] text-white p-6 shadow-sm sticky top-0 z-10">
        <h2 className="text-2xl font-bold">交通資訊</h2>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
           <div className="flex items-center gap-3 mb-3">
             <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
               <i className="ph-fill ph-taxi text-2xl text-green-500"></i>
             </div>
             <div>
               <h3 className="font-bold text-lg text-[#1E2336]">Grab 叫車</h3>
               <p className="text-xs text-gray-500">市區移動首選</p>
             </div>
           </div>
           <p className="text-sm text-gray-600 mb-3 leading-relaxed">綁定信用卡後直接叫車，價格透明，不會被坑。適合峴港市區內短程移動。</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
           <div className="flex items-center gap-3 mb-3">
             <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
               <i className="ph-fill ph-car text-2xl text-blue-500"></i>
             </div>
             <div>
               <h3 className="font-bold text-lg text-[#1E2336]">巴拿山 / 會安包車</h3>
               <p className="text-xs text-gray-500">跨區或長程移動</p>
             </div>
           </div>
           <p className="text-sm text-gray-600 leading-relaxed">跨城市移動（如峴港至會安、巴拿山）建議提前在 Klook 或 KKday 預訂專車接送，有冷氣且適合家庭。</p>
        </div>
      </div>
    </div>
  );
}

function Preparation() {
  const [items, setItems] = useState([
    { id: 1, text: "護照 (效期需滿6個月)", checked: false },
    { id: 2, text: "越南電子簽證 (e-Visa)", checked: false },
    { id: 3, text: "網卡 / eSIM", checked: false },
    { id: 4, text: "防曬乳、防蚊液", checked: false },
    { id: 5, text: "常備藥品 (腸胃藥、感冒藥)", checked: false },
    { id: 6, text: "薄外套 (巴拿山上較冷)", checked: false },
    { id: 7, text: "美金 (到當地換越盾)", checked: false }
  ]);

  const toggleItem = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  return (
    <div className="pb-24 bg-[#f5f6f8] min-h-screen">
      <div className="bg-[#1E2336] text-white p-6 shadow-sm sticky top-0 z-10">
        <h2 className="text-2xl font-bold">出發準備清單</h2>
      </div>
      <div className="p-4 space-y-3">
        {items.map(item => (
          <div key={item.id} onClick={() => toggleItem(item.id)} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 cursor-pointer transition-colors active:bg-gray-50">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${item.checked ? 'bg-[#4a7c8e] border-[#4a7c8e]' : 'border-gray-300'}`}>
              {item.checked && <i className="ph-bold ph-check text-white text-sm"></i>}
            </div>
            <span className={`font-bold ${item.checked ? 'text-gray-400 line-through' : 'text-[#1E2336]'}`}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SOS({ onLogout }) {
  return (
    <div className="pb-24 bg-red-50 min-h-screen">
      <div className="bg-red-600 text-white p-6 shadow-sm sticky top-0 z-10">
        <h2 className="text-2xl font-bold flex items-center gap-2"><i className="ph-fill ph-warning"></i> 緊急救援 SOS</h2>
      </div>
      <div className="p-4 mt-2">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <a href="tel:113" className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 text-center active:bg-red-50 transition-colors">
             <i className="ph-fill ph-police-car text-4xl text-red-500 mb-2 block"></i>
             <h3 className="font-bold text-lg text-gray-800">當地警察</h3>
             <p className="text-xs text-gray-500 font-bold bg-gray-100 py-1 rounded mt-1">直撥 113</p>
          </a>
          <a href="tel:115" className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 text-center active:bg-red-50 transition-colors">
             <i className="ph-fill ph-ambulance text-4xl text-red-500 mb-2 block"></i>
             <h3 className="font-bold text-lg text-gray-800">救護車</h3>
             <p className="text-xs text-gray-500 font-bold bg-gray-100 py-1 rounded mt-1">直撥 115</p>
          </a>
        </div>
        
        <a href="tel:+84-24-3833-6996" className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-200 active:bg-gray-50 transition-colors mb-8 flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
             <i className="ph-fill ph-buildings text-2xl text-blue-500"></i>
           </div>
           <div>
             <h3 className="font-bold text-[15px] text-gray-800 leading-tight mb-1">駐越南台北經濟文化辦事處</h3>
             <p className="text-xs text-gray-500">急難救助專線</p>
           </div>
        </a>

        <div className="border-t border-red-200 pt-6">
          <button onClick={onLogout} className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 active:bg-gray-50">
            <i className="ph-bold ph-sign-out text-lg"></i> 登出帳號
          </button>
        </div>
      </div>
    </div>
  );
}

function AiAssistant({ user }) {
  const [requests, setRequests] = useState([]);
  const [newReq, setNewReq] = useState("");
  const [config, setConfig] = useState({ geminiKey: '', githubToken: '', aiModel: 'gemini-2.5-flash' });
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "ai_requests"), orderBy("createdAt", "desc"));
    const unsubscribeReq = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeConfig = onSnapshot(doc(db, "system_config", "ai_keys"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(prev => ({ aiModel: 'gemini-2.5-flash', ...docSnap.data() }));
      } else {
        setIsConfiguring(true);
      }
    });

    return () => { unsubscribeReq(); unsubscribeConfig(); };
  }, []);

  const saveConfig = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "system_config", "ai_keys"), config);
      setIsConfiguring(false);
      alert("金鑰儲存成功！");
    } catch (err) {
      alert("儲存失敗：" + err.message);
    }
  };

  const handleCancelPrompt = async (id) => {
    if (!db) return;
    if (window.confirm("確定要取消此 AI 指令嗎？這將會停止其當前處理狀態並標記為已取消。")) {
      try {
        await updateDoc(doc(db, "ai_requests", id), {
          status: 'cancelled',
          error: '使用者已取消此指令。'
        });
        alert("指令已取消。");
      } catch (err) {
        alert("取消失敗：" + err.message);
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newReq.trim() || !db) return;
    const model = config.aiModel || 'gemini-2.5-flash';
    const isOllama = model.startsWith('ollama/');
    if (!isOllama && !config.geminiKey) { setIsConfiguring(true); return alert('請先設定 Gemini API Key！'); }
    if (!config.githubToken) { setIsConfiguring(true); return alert('請先設定 GitHub Token！'); }

    const requestText = newReq;
    setNewReq("");
    let reqRef;
    try {
      reqRef = await addDoc(collection(db, "ai_requests"), {
        text: requestText, author: user.displayName || user.email,
        model: model, createdAt: serverTimestamp(), status: 'processing'
      });
    } catch(e) { console.error(e); }

    try {
      setLoadingText("正在取得最新原始碼...");
      const repoUrl = "https://api.github.com/repos/willy126534/vietnam-trip-pwa/contents/app.jsx";
      const fileRes = await fetch(repoUrl, { headers: { "Authorization": `token ${config.githubToken.trim()}` } });
      if (!fileRes.ok) throw new Error("取得原始碼失敗 (請確認 GitHub Token 權限)");
      const fileData = await fileRes.json();
      const currentCode = decodeURIComponent(escape(atob(fileData.content)));
      const sha = fileData.sha;

      setLoadingText(`正在呼叫 ${model} 修改程式碼...`);
      const prompt = `You are an expert React developer. Modify the following React single-file code based on the user's request. Return ONLY the raw React code inside a \`\`\`jsx \`\`\` block. Do not use Markdown outside of that block.\nUSER REQUEST: ${requestText}\nCURRENT CODE:\n${currentCode}`;
      let newCode = await callAI(model, prompt, config.geminiKey); // Pass geminiKey here
      // Robustly remove markdown code blocks
      newCode = newCode.replace(/```jsx\n?/g, "").replace(/```javascript\n?/g, "").replace(/```\n?/g, "").trim();

      setLoadingText("正在推送到 GitHub...");
      const encodedCode = btoa(unescape(encodeURIComponent(newCode)));
      const updateRes = await fetch(repoUrl, {
        method: "PUT",
        headers: { "Authorization": `token ${config.githubToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `AI Auto Update (${model}): ${requestText}`, content: encodedCode, sha })
      });
      if (!updateRes.ok) throw new Error("推送到 GitHub 失敗");
      if (reqRef) await updateDoc(doc(db, "ai_requests", reqRef.id), { status: 'completed' });
      setLoadingText("");
      alert("修改成功！PWA 將在 1-2 分鐘後更新，請強制重新整理頁面。");
    } catch (err) {
      setLoadingText("");
      if (reqRef) await updateDoc(doc(db, "ai_requests", reqRef.id), { status: 'error', error: err.message });
      alert("發生錯誤: " + err.message);
    }
  };

  if (isConfiguring) {
    return (
      <div className="pb-24 flex flex-col h-screen bg-[#f5f6f8] p-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-10">
           <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-600"><i className="ph-fill ph-key"></i> 系統金鑰設定</h2>
           <p className="text-xs text-gray-500 mb-6 leading-relaxed">這是讓 PWA 能夠「自我修改」的核心。金鑰會安全儲存在 Firebase 中，不會被推送到公開的 GitHub。</p>
           <form onSubmit={saveConfig} className="space-y-4">
             <div>
               <label className="text-xs font-bold text-gray-700 block mb-1">AI 模型選擇</label>
               <select value={config.aiModel || 'gemini-2.5-flash'} onChange={e => setConfig({...config, aiModel: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                 {AI_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-gray-700 block mb-1">Gemini API Key</label>
               <input type="password" value={config.geminiKey || ''} onChange={e => setConfig({...config, geminiKey: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="AIzaSy..." />
               <p className="text-[10px] text-gray-400 mt-1">使用 Ollama 本機模型時可留空</p>
             </div>
             <div>
               <label className="text-xs font-bold text-gray-700 block mb-1">GitHub Fine-Grained Token</label>
               <input type="password" value={config.githubToken || ''} onChange={e => setConfig({...config, githubToken: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="github_pat_..." required />
             </div>
             <div className="pt-4 flex gap-2">
                {config.githubToken && <button type="button" onClick={() => setIsConfiguring(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold">取消</button>}
                <button type="submit" className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold">儲存設定</button>
             </div>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 flex flex-col h-screen bg-[#f5f6f8]">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 shadow-sm shrink-0">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <i className="ph-fill ph-magic-wand"></i> AI 工程師
            </h2>
            <p className="text-[10px] text-purple-100 mt-1 leading-tight">
              輸入願望，自動呼叫 AI 改寫程式碼並推送到 Git。
            </p>
          </div>
          <button onClick={() => setIsConfiguring(true)} className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors shrink-0 ml-2">
            <i className="ph-fill ph-gear text-xl"></i>
          </button>
        </div>
        <select
          value={config.aiModel || 'gemini-2.5-flash'}
          onChange={e => setConfig({...config, aiModel: e.target.value})}
          className="w-full bg-white/20 border border-white/30 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          {AI_MODELS.map(m => <option key={m.value} value={m.value} className="text-gray-800 bg-white">{m.label}</option>)}
        </select>
      </div>
      
      {loadingText && (
        <div className="bg-yellow-50 p-3 border-b border-yellow-100 flex items-center justify-center gap-2 text-yellow-700 text-sm font-bold">
           <i className="ph ph-spinner-gap animate-spin text-xl"></i> {loadingText}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
        {requests.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <i className="ph-fill ph-robot text-6xl text-gray-300 mb-2 block"></i>
            想要改什麼呢？<br/>例如：「把所有的藍色換成綠色」
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">{req.author}</span>
                  {req.model && <span className="text-[10px] text-gray-400 pl-1">{req.model}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {req.status === 'completed' ? (
                    <span className="text-xs text-green-500 font-bold flex items-center gap-1"><i className="ph-bold ph-check"></i> 已完成</span>
                  ) : req.status === 'error' ? (
                    <span className="text-xs text-red-500 font-bold flex items-center gap-1"><i className="ph-bold ph-warning"></i> 失敗</span>
                  ) : req.status === 'cancelled' ? (
                    <span className="text-xs text-gray-500 font-bold flex items-center gap-1"><i className="ph-bold ph-prohibit"></i> 已取消</span>
                  ) : (
                    <span className="text-xs text-orange-500 font-bold flex items-center gap-1"><i className="ph-bold ph-clock"></i> 處理中</span>
                  )}
                  {req.status === 'processing' && (
                    <button
                      onClick={() => handleCancelPrompt(req.id)}
                      className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-md hover:bg-red-100 hover:text-red-700 transition-colors flex items-center gap-1"
                      title="取消此指令"
                    >
                      <i className="ph-bold ph-x-circle"></i> 取消
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{req.text}</p>
              {req.status === 'error' && req.error && <p className="text-red-400 text-xs mt-2 bg-red-50 px-2 py-1 rounded">{req.error}</p>}
              {req.status === 'cancelled' && req.error && <p className="text-gray-400 text-xs mt-2 bg-gray-50 px-2 py-1 rounded">{req.error}</p>}
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 shrink-0 mb-16">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newReq}
            onChange={(e) => setNewReq(e.target.value)}
            disabled={!!loadingText}
            placeholder="例如：把頂部導覽列改成紅色"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button type="submit" disabled={!!loadingText} className="bg-purple-600 text-white w-12 rounded-xl flex items-center justify-center hover:bg-purple-700 transition-colors disabled:opacity-50">
            <i className="ph-bold ph-paper-plane-right"></i>
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && WHITELIST.includes(u.email)) {
        setUser(u);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><div className="animate-spin text-blue-500"><i className="ph ph-spinner-gap text-4xl"></i></div></div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'itinerary': return <Itinerary />;
      case 'souvenirs': return <Souvenirs />;
      case 'transport': return <Transport />;
      case 'preparation': return <Preparation />;
      case 'ai': return <AiAssistant user={user} />;
      case 'sos': return <SOS onLogout={() => signOut(auth)} />;
      default: return <Itinerary />;
    }
  };

  return (
    <div className="max-w-md mx-auto relative bg-[#f5f6f8] min-h-screen shadow-xl overflow-hidden">
      
      {/* Main Content Area */}
      <div className="h-full overflow-y-auto hide-scrollbar">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#1E2336] px-1 py-2 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] pb-safe overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('itinerary')}
          className={`flex-none w-[60px] flex flex-col items-center gap-1 transition-colors py-1 ${activeTab === 'itinerary' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <i className={`text-2xl ${activeTab === 'itinerary' ? 'ph-fill ph-calendar-check' : 'ph ph-calendar-check'}`}></i>
          <span className="text-[9px] font-bold">行程</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('souvenirs')}
          className={`flex-none w-[60px] flex flex-col items-center gap-1 transition-colors py-1 ${activeTab === 'souvenirs' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <i className={`text-2xl ${activeTab === 'souvenirs' ? 'ph-fill ph-shopping-bag' : 'ph ph-shopping-bag'}`}></i>
          <span className="text-[9px] font-bold">伴手禮</span>
        </button>

        <button 
          onClick={() => setActiveTab('transport')}
          className={`flex-none w-[60px] flex flex-col items-center gap-1 transition-colors py-1 ${activeTab === 'transport' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <i className={`text-2xl ${activeTab === 'transport' ? 'ph-fill ph-train' : 'ph ph-train'}`}></i>
          <span className="text-[9px] font-bold">交通</span>
        </button>

        <button 
          onClick={() => setActiveTab('preparation')}
          className={`flex-none w-[60px] flex flex-col items-center gap-1 transition-colors py-1 ${activeTab === 'preparation' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <i className={`text-2xl ${activeTab === 'preparation' ? 'ph-fill ph-check-square' : 'ph ph-check-square'}`}></i>
          <span className="text-[9px] font-bold">準備</span>
        </button>

        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex-none w-[60px] flex flex-col items-center gap-1 transition-colors py-1 ${activeTab === 'ai' ? 'text-purple-400' : 'text-gray-400 hover:text-purple-400'}`}
        >
          <i className={`text-2xl ${activeTab === 'ai' ? 'ph-fill ph-magic-wand' : 'ph ph-magic-wand'}`}></i>
          <span className="text-[9px] font-bold">AI助理</span>
        </button>

        <button 
          onClick={() => setActiveTab('sos')}
          className={`flex-none w-[60px] flex flex-col items-center gap-1 py-1 transition-colors ${activeTab === 'sos' ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
        >
          <i className={`text-2xl ${activeTab === 'sos' ? 'ph-fill ph-first-aid' : 'ph ph-first-aid'}`}></i>
          <span className="text-[9px] font-bold">SOS</span>
        </button>
      </div>

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);