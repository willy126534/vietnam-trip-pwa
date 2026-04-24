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
      { time: '10:00', type: 'flight', title: '搭機前往峴港', location: 'TPE -> DAD (具體航班待定)', color: 'blue' },
      { time: '14:00', type: 'hotel', title: '抵達飯店 Check-in', location: '峴港市區 (親子友善飯店)', color: 'indigo' },
      { time: '16:00', type: 'activity', title: '美溪沙灘玩沙', location: 'My Khe Beach', color: 'green' },
      { time: '18:30', type: 'meal', title: '晚餐', location: '飯店附近海鮮餐廳', color: 'orange' }
    ]
  },
  { 
    day: 2, date: '05/27 (三)', title: '市區輕鬆遊', summary: '市區觀光與品嚐當地美食。', icon: 'ph-buildings',
    activities: [
      { time: '09:00', type: 'meal', title: '飯店早餐', location: '飯店內', color: 'orange' },
      { time: '10:30', type: 'activity', title: '粉紅教堂拍照', location: 'Da Nang Cathedral', color: 'pink' },
      { time: '12:00', type: 'meal', title: '午餐：越式河粉', location: 'Pho 29 或周邊', color: 'orange' },
      { time: '14:00', type: 'activity', title: '漢市場周邊散步', location: 'Han Market', color: 'green' },
      { time: '16:00', type: 'hotel', title: '回飯店午休', location: '避免小孩太累', color: 'indigo' },
      { time: '18:30', type: 'meal', title: '晚餐', location: '市區餐廳', color: 'orange' }
    ]
  },
  { 
    day: 3, date: '05/28 (四)', title: '巴拿山一日遊', summary: '搭乘世界最長纜車與遊樂園放電。', icon: 'ph-mountains',
    activities: [
      { time: '08:30', type: 'activity', title: '包車前往巴拿山', location: 'Ba Na Hills', color: 'green' },
      { time: '09:30', type: 'activity', title: '搭乘纜車 & 黃金佛手橋', location: 'Golden Bridge', color: 'yellow' },
      { time: '12:00', type: 'meal', title: '午餐：山上自助餐', location: 'Arapang 或其他餐廳', color: 'orange' },
      { time: '13:30', type: 'activity', title: 'Fantasy Park 室內遊樂園', location: '適合小孩的遊樂設施', color: 'pink' },
      { time: '16:00', type: 'activity', title: '搭纜車下山', location: '', color: 'green' },
      { time: '18:00', type: 'meal', title: '晚餐', location: '返回市區', color: 'orange' }
    ]
  },
  { 
    day: 4, date: '05/29 (五)', title: '前進會安', summary: '移動至會安並享受古鎮夜景。', icon: 'ph-car',
    activities: [
      { time: '10:00', type: 'activity', title: '包車前往會安', location: '車程約 45 分鐘', color: 'green' },
      { time: '11:00', type: 'hotel', title: '抵達會安渡假村 Check-in', location: '會安', color: 'indigo' },
      { time: '12:30', type: 'meal', title: '午餐', location: '會安特色美食', color: 'orange' },
      { time: '14:00', type: 'hotel', title: '飯店午休 / 泳池玩水', location: '飯店內', color: 'indigo' },
      { time: '16:30', type: 'activity', title: '漫步會安古鎮', location: 'Hoi An Ancient Town', color: 'green' },
      { time: '18:30', type: 'activity', title: '欣賞夜間燈籠與晚餐', location: '秋盆河畔', color: 'pink' }
    ]
  },
  { 
    day: 5, date: '05/30 (六)', title: '椰林竹籃船', summary: '有趣的生態體驗，非常適合小孩。', icon: 'ph-boat',
    activities: [
      { time: '09:00', type: 'meal', title: '飯店早餐', location: '飯店內', color: 'orange' },
      { time: '10:00', type: 'activity', title: '迦南島椰林竹籃船', location: 'Cam Thanh (約 1 小時)', color: 'blue' },
      { time: '12:00', type: 'meal', title: '當地午餐', location: '迦南島周邊', color: 'orange' },
      { time: '14:00', type: 'hotel', title: '返回飯店休息', location: '避免午後高溫', color: 'indigo' },
      { time: '16:30', type: 'activity', title: '自由活動', location: '可再次逛古鎮或在飯店休息', color: 'green' },
      { time: '18:30', type: 'meal', title: '晚餐', location: '會安', color: 'orange' }
    ]
  },
  { 
    day: 6, date: '05/31 (日)', title: '文化體驗', summary: '體驗當地文化並返回峴港海景飯店。', icon: 'ph-lantern',
    activities: [
      { time: '09:30', type: 'activity', title: '傳統燈籠製作體驗 (簡單版)', location: '會安古鎮內', color: 'pink' },
      { time: '12:00', type: 'meal', title: '午餐', location: '古鎮咖啡廳', color: 'orange' },
      { time: '14:00', type: 'activity', title: '包車返回峴港', location: '', color: 'green' },
      { time: '15:00', type: 'hotel', title: '入住海景渡假村', location: '峴港海灘區', color: 'indigo' },
      { time: '16:00', type: 'hotel', title: '享受飯店設施', location: '親子遊戲室或泳池', color: 'blue' },
      { time: '18:30', type: 'meal', title: '晚餐', location: '飯店內或周邊', color: 'orange' }
    ]
  },
  { 
    day: 7, date: '06/01 (一)', title: '渡假村放鬆', summary: '全日享受高級飯店設施與海灘。', icon: 'ph-swimming-pool',
    activities: [
      { time: '09:00', type: 'meal', title: '飯店豐盛早餐', location: '飯店內', color: 'orange' },
      { time: '10:30', type: 'hotel', title: '玩水 / 兒童俱樂部', location: '飯店內', color: 'blue' },
      { time: '12:30', type: 'meal', title: '午餐', location: '飯店內或叫外送', color: 'orange' },
      { time: '14:00', type: 'hotel', title: '午休', location: '飯店內', color: 'indigo' },
      { time: '16:30', type: 'activity', title: '海邊散步看夕陽', location: '私人海灘', color: 'green' },
      { time: '18:30', type: 'meal', title: '晚餐', location: '', color: 'orange' }
    ]
  },
  { 
    day: 8, date: '06/02 (二)', title: '亞洲公園', summary: '傍晚前往亞洲公園搭乘摩天輪。', icon: 'ph-ferris-wheel',
    activities: [
      { time: '09:00', type: 'meal', title: '飯店早餐', location: '飯店內', color: 'orange' },
      { time: '10:30', type: 'hotel', title: '飯店設施放鬆', location: '', color: 'blue' },
      { time: '12:30', type: 'meal', title: '午餐', location: '', color: 'orange' },
      { time: '14:00', type: 'hotel', title: '午休', location: '', color: 'indigo' },
      { time: '16:00', type: 'activity', title: '前往亞洲公園', location: 'Asia Park', color: 'pink' },
      { time: '17:30', type: 'activity', title: '搭乘太陽摩天輪', location: 'Sun Wheel', color: 'yellow' },
      { time: '19:00', type: 'meal', title: '晚餐', location: '園區或市區', color: 'orange' }
    ]
  },
  { 
    day: 9, date: '06/03 (三)', title: '滿載而歸', summary: '採買伴手禮並搭機返回台北。', icon: 'ph-airplane-takeoff',
    activities: [
      { time: '09:00', type: 'meal', title: '飯店早餐', location: '飯店內', color: 'orange' },
      { time: '10:00', type: 'activity', title: '整理行李 & Check-out', location: '飯店內', color: 'indigo' },
      { time: '11:00', type: 'activity', title: '採買伴手禮', location: 'Vincom Plaza 或 Big C', color: 'green' },
      { time: '12:30', type: 'meal', title: '午餐', location: '市區', color: 'orange' },
      { time: '14:00', type: 'flight', title: '前往峴港機場', location: 'DAD', color: 'blue' },
      { time: '16:00', type: 'flight', title: '搭機返回台北', location: 'DAD -> TPE', color: 'blue' }
    ]
  }
];

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
                 
                 {/* Map Button (Visual) */}
                 {activity.location && activity.type !== 'flight' && (
                    <div className="w-fit bg-[#4a7c8e] text-white text-[10px] font-medium py-1.5 px-3 rounded-md flex items-center justify-center gap-1 shadow-sm mt-2">
                      <i className="ph-fill ph-map-pin text-red-300"></i> 地圖
                    </div>
                 )}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Souvenirs() {
  return (
    <div className="pb-24 bg-[#f5f6f8] min-h-screen">
      <div className="bg-[#1E2336] text-white p-6 shadow-sm sticky top-0 z-10">
        <h2 className="text-2xl font-bold">推薦伴手禮</h2>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-orange-500">
           <h3 className="font-bold text-lg mb-2 text-[#1E2336]">帶皮腰果</h3>
           <p className="text-sm text-gray-500 mb-2">越南特產，香脆可口，適合長輩。</p>
           <div className="bg-blue-50 text-[#4a7c8e] text-xs font-bold px-2 py-1 rounded inline-block">哪裡買：Han Market 或 Lotte Mart</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-yellow-600">
           <h3 className="font-bold text-lg mb-2 text-[#1E2336]">G7 咖啡 / 滴漏咖啡</h3>
           <p className="text-sm text-gray-500 mb-2">經典越式咖啡，伴手禮首選。</p>
           <div className="bg-blue-50 text-[#4a7c8e] text-xs font-bold px-2 py-1 rounded inline-block">哪裡買：各大超市均有販售</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-green-500">
           <h3 className="font-bold text-lg mb-2 text-[#1E2336]">綠豆糕 / 椰子糖</h3>
           <p className="text-sm text-gray-500 mb-2">在地傳統甜點，小朋友最愛。</p>
        </div>
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
      <div className="absolute bottom-0 left-0 right-0 bg-[#1E2336] px-2 py-2 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] pb-safe">
        <button 
          onClick={() => setActiveTab('itinerary')}
          className={`flex-1 flex flex-col items-center gap-1 transition-colors py-1 ${activeTab === 'itinerary' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <i className={`text-2xl ${activeTab === 'itinerary' ? 'ph-fill ph-calendar-check' : 'ph ph-calendar-check'}`}></i>
          <span className="text-[10px] font-bold">行程</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('souvenirs')}
          className={`flex-1 flex flex-col items-center gap-1 transition-colors py-1 ${activeTab === 'souvenirs' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <i className={`text-2xl ${activeTab === 'souvenirs' ? 'ph-fill ph-shopping-bag' : 'ph ph-shopping-bag'}`}></i>
          <span className="text-[10px] font-bold">伴手禮</span>
        </button>

        <button 
          onClick={() => setActiveTab('transport')}
          className={`flex-1 flex flex-col items-center gap-1 transition-colors py-1 ${activeTab === 'transport' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <i className={`text-2xl ${activeTab === 'transport' ? 'ph-fill ph-train' : 'ph ph-train'}`}></i>
          <span className="text-[10px] font-bold">交通</span>
        </button>

        <button 
          onClick={() => setActiveTab('preparation')}
          className={`flex-1 flex flex-col items-center gap-1 transition-colors py-1 ${activeTab === 'preparation' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <i className={`text-2xl ${activeTab === 'preparation' ? 'ph-fill ph-check-square' : 'ph ph-check-square'}`}></i>
          <span className="text-[10px] font-bold">出發準備</span>
        </button>

        <button 
          onClick={() => setActiveTab('sos')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 transition-colors ${activeTab === 'sos' ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
        >
          <i className={`text-2xl ${activeTab === 'sos' ? 'ph-fill ph-first-aid' : 'ph ph-first-aid'}`}></i>
          <span className="text-[10px] font-bold">SOS</span>
        </button>
      </div>

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
