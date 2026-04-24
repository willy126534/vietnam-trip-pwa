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
    try {
      await updateDoc(doc(db, "itinerary", docId), { [field]: newValue });
    } catch (err) {
      alert("更新失敗：" + err.message);
    }
  };

  const updateActivityField = async (docId, dayData, activityIndex, field, newValue) => {
    if (!db) return;
    const newActivities = [...dayData.activities];
    newActivities[activityIndex] = { ...newActivities[activityIndex], [field]: newValue };
    try {
      await updateDoc(doc(db, "itinerary", docId), { activities: newActivities });
    } catch (err) {
      alert("更新失敗：" + err.message);
    }
  };

  const getColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600', indigo: 'bg-indigo-100 text-indigo-600',
      green: 'bg-emerald-100 text-emerald-600', orange: 'bg-orange-100 text-orange-600',
      pink: 'bg-pink-100 text-pink-600', yellow: 'bg-yellow-100 text-yellow-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  const getIconForType = (type) => {
    const icons = { flight: 'ph-airplane-tilt', hotel: 'ph-bed', activity: 'ph-camera', meal: 'ph-fork-knife' };
    return icons[type] || 'ph-map-pin';
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500"><i className="ph ph-spinner-gap animate-spin text-2xl"></i></div>;
  }

  const currentDayData = itineraryData.find(d => d.day === activeDay) || itineraryData[0];

  if (!currentDayData) return null;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Hero Image */}
      <div className="h-56 bg-gray-300 relative">
        <img 
          src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
          alt="Danang" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <div className="absolute bottom-6 left-5 text-white z-10">
          <h2 className="text-2xl font-bold mb-1">✨ 2026 越南家庭遊</h2>
          <p className="text-sm opacity-90 flex items-center gap-1">
            <i className="ph-fill ph-map-pin"></i> 峴港 • 會安 • 巴拿山
          </p>
        </div>
      </div>

      {/* Horizontal Day Selector */}
      <div className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100 overflow-x-auto hide-scrollbar flex">
        {itineraryData.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveDay(item.day)}
            className={`flex-none px-5 py-3 flex flex-col items-center min-w-[80px] transition-colors relative ${activeDay === item.day ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <span className="text-[10px] mb-1">{item.date.split(' ')[0]}</span>
            <span className="text-sm font-bold whitespace-nowrap">第 {item.day} 天</span>
            {activeDay === item.day && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        ))}
      </div>

      {/* Day Content */}
      <div className="p-4">
        {/* Quick Actions */}
        <div className="flex justify-between items-center bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
           <div className="flex flex-col items-center gap-1">
             <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600"><i className="ph-fill ph-airplane-tilt text-lg"></i></div>
             <span className="text-[10px] text-gray-500 font-medium">找機票</span>
           </div>
           <div className="flex flex-col items-center gap-1">
             <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600"><i className="ph-fill ph-buildings text-lg"></i></div>
             <span className="text-[10px] text-gray-500 font-medium">飯店住宿</span>
           </div>
           <div className="flex flex-col items-center gap-1">
             <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600"><i className="ph-fill ph-car text-lg"></i></div>
             <span className="text-[10px] text-gray-500 font-medium">租車包車</span>
           </div>
           <div className="flex flex-col items-center gap-1">
             <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600"><i className="ph-fill ph-ticket text-lg"></i></div>
             <span className="text-[10px] text-gray-500 font-medium">景點門票</span>
           </div>
        </div>

        {/* Day Header Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
          <div className="absolute right-[-20px] top-[-20px] text-gray-50 opacity-50">
            <i className={`ph-fill ${currentDayData.icon} text-[120px]`}></i>
          </div>
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-xl shrink-0 mt-1">
              <i className={`ph-fill ${currentDayData.icon}`}></i>
            </div>
            <div className="flex-1">
              <EditableText 
                value={currentDayData.title} 
                onSave={(newVal) => updateDayField(currentDayData.id, 'title', newVal)} 
                className="text-lg font-bold text-gray-800"
              />
              <EditableText 
                value={currentDayData.summary} 
                onSave={(newVal) => updateDayField(currentDayData.id, 'summary', newVal)} 
                className="text-gray-500 text-xs mt-1" 
                isMultiline={true}
              />
            </div>
          </div>
        </div>

        {/* Timeline Activities */}
        <div className="space-y-4">
          {currentDayData.activities && currentDayData.activities.map((activity, idx) => (
            <div key={idx} className="flex gap-3">
               {/* Time column */}
               <div className="w-12 pt-3 flex flex-col items-center shrink-0">
                 <EditableText 
                    value={activity.time} 
                    onSave={(newVal) => updateActivityField(currentDayData.id, currentDayData, idx, 'time', newVal)} 
                    className="text-[10px] font-bold text-gray-500 text-center w-full"
                 />
               </div>

               {/* Activity Card */}
               <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3 items-start">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getColorClass(activity.color)}`}>
                    <i className={`ph-fill ${getIconForType(activity.type)} text-xl`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <EditableText 
                      value={activity.title} 
                      onSave={(newVal) => updateActivityField(currentDayData.id, currentDayData, idx, 'title', newVal)} 
                      className="font-bold text-gray-800 text-sm mb-1"
                    />
                    <div className="flex items-start gap-1 text-xs text-gray-500">
                      <i className="ph-fill ph-map-pin mt-0.5 shrink-0 text-red-400"></i> 
                      <EditableText 
                        value={activity.location} 
                        onSave={(newVal) => updateActivityField(currentDayData.id, currentDayData, idx, 'location', newVal)} 
                        className="flex-1"
                      />
                    </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlightHotel() {
  return (
    <div className="pb-24">
      <h2 className="text-2xl font-bold p-6 bg-white shadow-sm sticky top-0 z-10">航班與住宿</h2>
      <div className="p-4 space-y-6">
        
        <section>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-800">
            <i className="ph-fill ph-airplane text-blue-500"></i> 航班資訊
          </h3>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">TPE</div>
                <div className="text-xs text-gray-500">台北</div>
              </div>
              <div className="flex-1 px-4 relative flex items-center justify-center">
                <div className="h-px bg-gray-300 w-full absolute"></div>
                <i className="ph-fill ph-airplane-right text-gray-400 bg-white px-2 relative z-10"></i>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">DAD</div>
                <div className="text-xs text-gray-500">峴港</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">去程: 05/26 (二) 待定</p>
            <p className="text-sm text-gray-600">回程: 06/03 (三) 待定</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-800">
            <i className="ph-fill ph-buildings text-indigo-500"></i> 住宿資訊 (2大1小)
          </h3>
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-indigo-500">
              <h4 className="font-bold text-gray-800">峴港市區飯店 (前段)</h4>
              <p className="text-xs text-gray-500 mb-2">05/26 - 05/29 (3晚)</p>
              <p className="text-sm text-gray-600">尋找親子友善，靠近海灘或市區的飯店。</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
              <h4 className="font-bold text-gray-800">會安渡假村</h4>
              <p className="text-xs text-gray-500 mb-2">05/29 - 05/31 (2晚)</p>
              <p className="text-sm text-gray-600">享受古鎮氛圍與泳池設施。</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
              <h4 className="font-bold text-gray-800">峴港高級海景渡假村 (後段)</h4>
              <p className="text-xs text-gray-500 mb-2">05/31 - 06/03 (3晚)</p>
              <p className="text-sm text-gray-600">旅程結尾的高級享受，含豐富兒童設施。</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function Notes({ user }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(notesData);
    });
    return () => unsubscribe();
  }, []);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !db) return;
    try {
      await addDoc(collection(db, "notes"), {
        text: newNote,
        author: user.displayName || user.email,
        createdAt: serverTimestamp()
      });
      setNewNote("");
    } catch (err) {
      alert("Error adding note: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if(!db) return;
    await deleteDoc(doc(db, "notes", id));
  }

  return (
    <div className="pb-24 flex flex-col h-screen">
      <h2 className="text-2xl font-bold p-6 bg-white shadow-sm shrink-0">共用筆記</h2>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
        {notes.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">尚無筆記，來新增一些餐廳或景點想法吧！</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{note.author}</span>
                <button onClick={() => handleDelete(note.id)} className="text-gray-400 hover:text-red-500">
                  <i className="ph ph-trash"></i>
                </button>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 shrink-0 mb-16">
        <form onSubmit={handleAddNote} className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="新增餐廳或景點想法..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-500 text-white w-12 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors">
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
      case 'flight': return <FlightHotel />;
      case 'notes': return <Notes user={user} />;
      default: return <Itinerary />;
    }
  };

  return (
    <div className="max-w-md mx-auto relative bg-gray-50 min-h-screen shadow-xl overflow-hidden">
      
      {/* Main Content Area */}
      <div className="h-full overflow-y-auto hide-scrollbar">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe">
        <button 
          onClick={() => setActiveTab('itinerary')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'itinerary' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <i className={`text-2xl ${activeTab === 'itinerary' ? 'ph-fill ph-calendar-check' : 'ph ph-calendar-check'}`}></i>
          <span className="text-[10px] font-medium">行程</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('flight')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'flight' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <i className={`text-2xl ${activeTab === 'flight' ? 'ph-fill ph-airplane-tilt' : 'ph ph-airplane-tilt'}`}></i>
          <span className="text-[10px] font-medium">航班住宿</span>
        </button>

        <button 
          onClick={() => setActiveTab('notes')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'notes' ? 'text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <i className={`text-2xl ${activeTab === 'notes' ? 'ph-fill ph-notebook' : 'ph ph-notebook'}`}></i>
          <span className="text-[10px] font-medium">筆記</span>
        </button>

        <button 
          onClick={() => signOut(auth)}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <i className="text-2xl ph ph-sign-out"></i>
          <span className="text-[10px] font-medium">登出</span>
        </button>
      </div>

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
