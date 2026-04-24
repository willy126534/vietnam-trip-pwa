import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const ITINERARY = [
  { day: 1, date: '05/26 (二)', title: '啟程與放鬆', desc: '台北 (TPE) 飛往 峴港 (Da Nang)。抵達後專車接送至飯店，下午於飯店泳池或美溪沙灘玩沙放鬆。', icon: 'ph-airplane-landing' },
  { day: 2, date: '05/27 (三)', title: '市區輕鬆遊', desc: '早上參觀粉紅教堂 (Da Nang Cathedral)，下午逛漢市場 (Han Market) 周邊，品嚐當地越式河粉。', icon: 'ph-buildings' },
  { day: 3, date: '05/28 (四)', title: '巴拿山一日遊', desc: '搭乘世界最長纜車，參觀黃金佛手橋，並在室內遊樂園 (Fantasy Park) 讓小孩玩樂。', icon: 'ph-mountains' },
  { day: 4, date: '05/29 (五)', title: '前進會安', desc: '早上包車前往會安 (Hoi An)。入住會安渡假村，下午在飯店午休，傍晚漫步會安古鎮，欣賞夜間燈籠。', icon: 'ph-car' },
  { day: 5, date: '05/30 (六)', title: '椰林竹籃船', desc: '早上體驗迦南島 (Cam Thanh) 椰林竹籃船 (Basket Boat)，非常適合小孩。下午自由活動。', icon: 'ph-boat' },
  { day: 6, date: '05/31 (日)', title: '文化體驗', desc: '早上參加簡單的傳統燈籠製作課程或在古鎮咖啡廳休息。下午包車返回峴港，入住海景渡假村。', icon: 'ph-lantern' },
  { day: 7, date: '06/01 (一)', title: '渡假村放鬆', desc: '全日享受飯店設施、親子遊戲室，傍晚可至海邊散步看夕陽。', icon: 'ph-swimming-pool' },
  { day: 8, date: '06/02 (二)', title: '亞洲公園', desc: '傍晚前往亞洲公園搭乘巨大的太陽摩天輪 (Sun Wheel)，園區寬廣適合小孩跑跳。', icon: 'ph-ferris-wheel' },
  { day: 9, date: '06/03 (三)', title: '滿載而歸', desc: '早上採買伴手禮，前往峴港機場 (DAD) 搭機返回台北 (TPE)，結束愉快旅程。', icon: 'ph-airplane-takeoff' }
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

function Itinerary() {
  return (
    <div className="pb-24">
      <h2 className="text-2xl font-bold p-6 bg-white shadow-sm sticky top-0 z-10">行程表</h2>
      <div className="p-4 space-y-4">
        {ITINERARY.map((item) => (
          <div key={item.day} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4">
            <div className="flex flex-col items-center min-w-[50px]">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-2">
                <i className={`ph ${item.icon}`}></i>
              </div>
              <span className="text-xs font-bold text-gray-400">Day {item.day}</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                <span className="text-xs text-blue-500 font-medium">{item.date}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
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
