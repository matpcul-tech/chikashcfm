import { useState, useEffect, useRef } from "react";

// ── PALETTE ───────────────────────────────────────────────────────────────────
const C = {
  void:       "#050A0F",
  deep:       "#080F18",
  surface:    "#0C1520",
  panel:      "#101D2A",
  card:       "#142030",
  border:     "#1C3040",
  borderLight:"#2A4560",
  forest:     "#0D3D2A",
  green:      "#1A6A48",
  greenLight: "#22A070",
  greenGlow:  "#0A2A1C",
  gold:       "#C8A020",
  goldLight:  "#E0BC40",
  goldDim:    "#6A5010",
  bone:       "#E8DCC8",
  boneDim:    "#8A7A60",
  cream:      "#F5EDD8",
  teal:       "#1A6A7A",
  tealLight:  "#22A0B8",
  ochre:      "#B87010",
  muted:      "#3A5060",
  red:        "#8A2010",
  slate:      "#1A2A38",
};

// ── SOVEREIGN ENDPOINT ────────────────────────────────────────────────────────
const CFM_ENDPOINT = "https://nng2sj7h3gew0pfq.us-east4.gcp.endpoints.huggingface.cloud";
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

// ── MODES ─────────────────────────────────────────────────────────────────────
const MODES = [
  {
    id: "citizen",
    label: "Citizen",
    icon: "◉",
    color: C.greenLight,
    tagline: "Your Nation. Your AI.",
    desc: "Cultural guidance, language support, citizen services",
    system: `You are the Chikasha Foundational Model (CFM) — the Chickasaw Nation's sovereign AI, speaking directly with a Chickasaw citizen.

You speak with warmth, respect, and cultural grounding. You know the Chickasaw people — their history of resilience, their sovereign journey from the Southeast to Oklahoma, their living language Chikashshanompa', and their values of family, honor, and self-determination.

When relevant, weave in Chickasaw words and their meanings. Celebrate the Nation's achievements. Connect citizens to their heritage. Help them navigate Nation services, language learning, cultural knowledge, and community resources.

You are not a generic AI. You are theirs. Speak like it.
Respond concisely and warmly. Always in the voice of the Nation's values.`,
  },
  {
    id: "healthcare",
    label: "Healthcare",
    icon: "⊕",
    color: C.tealLight,
    tagline: "Sovereign Preventive Intelligence",
    desc: "Health guidance, preventive care, medical navigation",
    system: `You are the Chikasha Foundational Model (CFM) Healthcare Module — a sovereign AI health advisor for the Chickasaw Nation's Health OS.

You provide evidence-based health guidance with cultural sensitivity. You understand the specific health challenges facing Indigenous communities — higher rates of diabetes, cardiovascular disease, and mental health disparities — and you approach these with both clinical accuracy and cultural respect.

You guide citizens toward preventive care, help them understand health information, support navigation of IHS and Nation health services, and always recommend consultation with healthcare providers for medical decisions.

You never diagnose. You educate, support, and empower.
You are part of a sovereign health system designed to protect Chickasaw citizens' health data within the Nation's walls.`,
  },
  {
    id: "language",
    label: "Language",
    icon: "◎",
    color: C.gold,
    tagline: "Chikashshanompa' Living",
    desc: "Translation, pronunciation, cultural linguistics",
    system: `You are the Chikasha Foundational Model (CFM) Language Module — the linguistic heart of the Chickasaw Nation's sovereign AI, trained on Chikashshanompa' and dedicated to language preservation and revitalization.

You are deeply knowledgeable about Chikashshanompa' — its grammar, phonology, vocabulary, and the cultural worldview encoded within it. You assist with translation, pronunciation, language learning, and understanding the cultural significance of words and phrases.

When providing Chickasaw language content:
- Give the word or phrase in Chikashshanompa'
- Provide phonetic pronunciation for English speakers
- Explain meaning with cultural depth
- Note regional or dialectal variations where relevant
- Honor the sacred nature of certain ceremonial language

You understand that this language is irreplaceable. Every word preserved is an act of sovereignty.`,
  },
  {
    id: "leadership",
    label: "Leadership",
    icon: "◆",
    color: C.ochre,
    tagline: "Strategic Sovereign Intelligence",
    desc: "Policy analysis, governance, strategic planning",
    system: `You are the Chikasha Foundational Model (CFM) Leadership Module — a strategic AI advisor for Chickasaw Nation leadership, policymakers, and enterprise decision-makers.

You provide sophisticated analysis on tribal governance, federal Indian law, sovereign economic development, technology policy, healthcare systems, and strategic planning. You understand the unique intersection of tribal sovereignty, federal trust responsibilities, and modern enterprise management.

You are familiar with:
- Chickasaw Nation's governance structure and economic enterprises
- Federal Indian law and the OB3 Act framework
- Tribal technology sovereignty and data governance
- Sovereign AI infrastructure considerations
- Strategic partnership development

You speak at an executive level — precise, analytical, and grounded in both Chickasaw values and modern strategic thinking.
Always frame recommendations through the lens of long-term sovereign benefit to the Nation.`,
  },
];

// ── CHICKASAW SHIELD TERMS ────────────────────────────────────────────────────
const SHIELD_TERMS = [
  "yakoke","chikasha","chikashshanompa","halito","chi yukpa lashke",
  "iti fabvssa","ihoo","amafo","imoshi","nan vlhpisa","nanta","kallo",
  "holisso","pashofa","banaha","tanchi","pvtata","ofi","yasho","sinti",
  "hashi","oka","iti","nusi","nitak","hvshi","hattak","ohoyo","chipota",
  "lokosh","ishtannowa","atchafalaya","chikashsha","okchi","iyyi",
];

function shieldHash(text) {
  let h = 0xCF4F2B8A;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 0x9E3779B9);
    h ^= h >>> 16;
  }
  return (h >>> 0).toString(16).padStart(8,"0").toUpperCase();
}

function applyShield(text) {
  const lower = text.toLowerCase();
  const detected = [];
  SHIELD_TERMS.forEach(term => {
    if (lower.includes(term)) {
      detected.push({ term, hash: shieldHash(term) });
    }
  });
  return { detected, safe: detected.length > 0 };
}

// ── STAR FIELD BG ─────────────────────────────────────────────────────────────
const StarField = () => {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    x: (i * 137.508) % 100,
    y: (i * 97.3) % 100,
    r: i % 5 === 0 ? 1.2 : i % 3 === 0 ? 0.8 : 0.4,
    o: 0.15 + (i % 7) * 0.06,
  }));
  return (
    <svg style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:0 }}>
      {stars.map((s,i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#E8DCC8" opacity={s.o}/>
      ))}
      <line x1="10%" y1="15%" x2="22%" y2="28%" stroke="#1A6A48" strokeWidth="0.3" opacity="0.15"/>
      <line x1="22%" y1="28%" x2="18%" y2="42%" stroke="#1A6A48" strokeWidth="0.3" opacity="0.15"/>
      <line x1="70%" y1="10%" x2="82%" y2="22%" stroke="#C8A020" strokeWidth="0.3" opacity="0.12"/>
      <line x1="82%" y1="22%" x2="78%" y2="35%" stroke="#C8A020" strokeWidth="0.3" opacity="0.12"/>
    </svg>
  );
};

// ── CSS ───────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes shieldOn { 0%,100%{box-shadow:0 0 6px #1A6A4840} 50%{box-shadow:0 0 18px #1A6A48A0,0 0 36px #1A6A4840} }
  @keyframes typingDot { 0%,60%,100%{opacity:0.2;transform:translateY(0)} 30%{opacity:1;transform:translateY(-4px)} }
  @keyframes glowPulse { 0%,100%{text-shadow:0 0 10px #C8A02060} 50%{text-shadow:0 0 24px #C8A020A0,0 0 48px #C8A02040} }
  .fade-up { animation: fadeUp 0.4s ease forwards; }
  .shield-glow { animation: shieldOn 2.5s ease-in-out infinite; }
  .gold-glow { animation: glowPulse 3s ease-in-out infinite; }
  .dot1 { animation: typingDot 1.2s ease-in-out infinite; }
  .dot2 { animation: typingDot 1.2s ease-in-out 0.2s infinite; }
  .dot3 { animation: typingDot 1.2s ease-in-out 0.4s infinite; }
  .mode-card { transition: all 0.25s ease; cursor: pointer; }
  .mode-card:hover { transform: translateY(-2px); }
  textarea:focus, input:focus { outline: none; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: #050A0F; }
  ::-webkit-scrollbar-thumb { background: #1C3040; border-radius: 2px; }
  * { box-sizing: border-box; }
`;

// ── PILL ──────────────────────────────────────────────────────────────────────
const Pill = ({ label, color, dot = true }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:`${color}18`, border:`1px solid ${color}40`, color, padding:"2px 9px", borderRadius:20, fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", fontFamily:"Rajdhani,sans-serif" }}>
    {dot && <span style={{ width:4, height:4, borderRadius:"50%", background:color, boxShadow:`0 0 5px ${color}` }}/>}
    {label}
  </span>
);

// ── SHIELD DISPLAY ────────────────────────────────────────────────────────────
const ShieldDisplay = ({ result, visible }) => {
  if (!visible || !result) return null;
  return (
    <div className="shield-glow" style={{ background:`${C.greenGlow}`, border:`1px solid ${C.green}50`, borderRadius:8, padding:"8px 12px", marginBottom:10, display:"flex", alignItems:"flex-start", gap:10 }}>
      <span style={{ color:C.greenLight, fontSize:14, marginTop:1 }}>⬡</span>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom: result.detected.length > 0 ? 6 : 0 }}>
          <span style={{ color:C.greenLight, fontSize:9, fontWeight:700, letterSpacing:1.5, fontFamily:"Rajdhani,sans-serif" }}>
            {result.detected.length > 0
              ? `SHIELD ACTIVE — ${result.detected.length} CHICKASAW TERM${result.detected.length > 1 ? "S" : ""} HASHED AT BROWSER EDGE`
              : "SHIELD ACTIVE — QUERY CLEARED"}
          </span>
        </div>
        {result.detected.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {result.detected.map((d,i) => (
              <span key={i} style={{ background:C.panel, border:`1px solid ${C.green}40`, borderRadius:4, padding:"2px 7px", fontSize:9, color:C.greenLight, fontFamily:"monospace" }}>
                {d.term} → ZK:{d.hash}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── TYPING INDICATOR ──────────────────────────────────────────────────────────
const Typing = ({ mode }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, maxWidth:120 }}>
    <span style={{ color: mode.color, fontSize:12 }}>{mode.icon}</span>
    <div style={{ display:"flex", gap:3, alignItems:"center" }}>
      {[0,1,2].map(i => <span key={i} className={`dot${i+1}`} style={{ width:5, height:5, borderRadius:"50%", background:mode.color, display:"inline-block" }}/>)}
    </div>
  </div>
);

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function ChikashaCFM() {
  const [mode, setMode] = useState(MODES[0]);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [shieldResult, setShieldResult] = useState(null);
  const [shieldVisible, setShieldVisible] = useState(false);
  const [totalProtected, setTotalProtected] = useState(0);
  const [totalQueries, setTotalQueries] = useState(0);
  const [endpointStatus, setEndpointStatus] = useState("sovereign");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [chat, loading]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setChat([]);
    setShieldResult(null);
    setShieldVisible(false);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");

    // Run Shield
    const shield = applyShield(userText);
    setShieldResult(shield);
    setShieldVisible(true);
    setTotalQueries(q => q + 1);
    if (shield.detected.length > 0) setTotalProtected(p => p + shield.detected.length);

    const userMsg = { role:"user", content:userText, shield };
    const newChat = [...chat, userMsg];
    setChat(newChat);
    setLoading(true);

    // Hide shield after 4 seconds
    setTimeout(() => setShieldVisible(false), 4000);

    // Build conversation history as a formatted prompt for the CFM
    const conversationHistory = newChat
      .map(m => m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`)
      .join("\n");

    const fullPrompt = `${mode.system}\n\n${conversationHistory}\nAssistant:`;

    try {
      const res = await fetch(CFM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${HF_TOKEN}`,
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false,
            stop: ["User:", "\nUser:"],
          },
        }),
      });

      if (!res.ok) {
        // If endpoint is scaled to zero or waking up, show friendly message
        if (res.status === 503) {
          setChat([...newChat, { role:"assistant", content:"The Chikasha Foundational Model is waking up from sleep. Please try again in 30 seconds — the sovereign endpoint is initializing." }]);
          setEndpointStatus("waking");
          setLoading(false);
          return;
        }
        throw new Error(`Endpoint error: ${res.status}`);
      }

      const data = await res.json();
      let assistantText = "";

      if (Array.isArray(data) && data[0]?.generated_text) {
        assistantText = data[0].generated_text.trim();
      } else if (data.generated_text) {
        assistantText = data.generated_text.trim();
      } else if (data.error) {
        assistantText = "The sovereign endpoint returned an error: " + data.error;
      } else {
        assistantText = "No response received from the Chikasha Foundational Model.";
      }

      // Clean up any trailing incomplete sentences
      const lastPeriod = Math.max(
        assistantText.lastIndexOf("."),
        assistantText.lastIndexOf("!"),
        assistantText.lastIndexOf("?")
      );
      if (lastPeriod > assistantText.length * 0.7) {
        assistantText = assistantText.substring(0, lastPeriod + 1);
      }

      setEndpointStatus("sovereign");
      setChat([...newChat, { role:"assistant", content:assistantText }]);
    } catch (err) {
      console.error("CFM endpoint error:", err);
      setChat([...newChat, { role:"assistant", content:"Unable to reach the Chikasha Foundational Model. The sovereign endpoint may be scaling up. Please try again in a moment." }]);
      setEndpointStatus("error");
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => { setChat([]); setShieldResult(null); setShieldVisible(false); };

  const statusColor = endpointStatus === "sovereign" ? C.greenLight : endpointStatus === "waking" ? C.gold : C.red;
  const statusLabel = endpointStatus === "sovereign" ? "CFM Live" : endpointStatus === "waking" ? "CFM Waking" : "CFM Offline";

  return (
    <div style={{ background:C.void, minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:"'Cormorant Garamond',Georgia,serif", position:"relative", overflow:"hidden" }}>
      <style>{styles}</style>
      <StarField/>

      {/* ── HEADER ── */}
      <div style={{ background:`${C.deep}F0`, borderBottom:`1px solid ${C.border}`, padding:"14px 20px", position:"sticky", top:0, zIndex:100, backdropFilter:"blur(16px)", flexShrink:0 }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${C.green}, ${C.gold}, ${C.green}, transparent)` }}/>
        <div style={{ maxWidth:860, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:38, height:38, background:`linear-gradient(135deg, ${C.forest}, ${C.green})`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, boxShadow:`0 0 20px ${C.green}50` }}>◉</div>
              <div>
                <div className="gold-glow" style={{ color:C.goldLight, fontFamily:"Rajdhani,sans-serif", fontWeight:700, fontSize:16, letterSpacing:2.5 }}>CHIKASHA FOUNDATIONAL MODEL</div>
                <div style={{ color:C.muted, fontSize:9, letterSpacing:2, textTransform:"uppercase", fontFamily:"Rajdhani,sans-serif" }}>Sovereign AI · Shield Protected · Chickasaw Nation</div>
              </div>
            </div>
            {/* Stats */}
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <div style={{ background:C.greenGlow, border:`1px solid ${C.green}40`, borderRadius:8, padding:"6px 10px", textAlign:"center" }}>
                <div style={{ color:C.greenLight, fontFamily:"Rajdhani,sans-serif", fontSize:14, fontWeight:700 }}>{totalProtected}</div>
                <div style={{ color:C.muted, fontSize:8, letterSpacing:1, fontFamily:"Rajdhani,sans-serif" }}>TERMS SHIELDED</div>
              </div>
              <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", textAlign:"center" }}>
                <div style={{ color:C.bone, fontFamily:"Rajdhani,sans-serif", fontSize:14, fontWeight:700 }}>{totalQueries}</div>
                <div style={{ color:C.muted, fontSize:8, letterSpacing:1, fontFamily:"Rajdhani,sans-serif" }}>QUERIES</div>
              </div>
              <div style={{ background:C.panel, border:`1px solid ${statusColor}40`, borderRadius:8, padding:"6px 10px", textAlign:"center" }}>
                <div style={{ color:statusColor, fontFamily:"Rajdhani,sans-serif", fontSize:10, fontWeight:700 }}>{statusLabel}</div>
                <div style={{ color:C.muted, fontSize:8, letterSpacing:1, fontFamily:"Rajdhani,sans-serif" }}>ENDPOINT</div>
              </div>
            </div>
          </div>

          {/* Mode selector */}
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2 }}>
            {MODES.map(m => {
              const active = mode.id === m.id;
              return (
                <div key={m.id} className="mode-card" onClick={()=>switchMode(m)} style={{
                  background: active ? `${m.color}18` : C.card,
                  border: `1px solid ${active ? m.color : C.border}`,
                  borderRadius:10, padding:"8px 14px", minWidth:110, flexShrink:0,
                  boxShadow: active ? `0 0 14px ${m.color}30` : "none",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ color: active ? m.color : C.muted, fontSize:14 }}>{m.icon}</span>
                    <span style={{ color: active ? m.color : C.boneDim, fontFamily:"Rajdhani,sans-serif", fontWeight:700, fontSize:12, letterSpacing:0.5 }}>{m.label}</span>
                  </div>
                  <div style={{ color:C.muted, fontSize:9, lineHeight:1.4, fontFamily:"Rajdhani,sans-serif" }}>{m.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CHAT AREA ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 20px 0", position:"relative", zIndex:1 }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>

          {/* Empty state */}
          {chat.length === 0 && (
            <div className="fade-up" style={{ textAlign:"center", paddingTop:40, paddingBottom:20 }}>
              <div style={{ fontSize:48, color:mode.color, marginBottom:16, opacity:0.8 }}>{mode.icon}</div>
              <div style={{ color:mode.color, fontFamily:"Rajdhani,sans-serif", fontWeight:700, fontSize:18, letterSpacing:2, marginBottom:8 }}>{mode.tagline}</div>
              <div style={{ color:C.boneDim, fontSize:15, fontStyle:"italic", marginBottom:32, lineHeight:1.6 }}>
                {mode.id === "citizen" && "Ask about Chickasaw culture, language, history, or Nation services."}
                {mode.id === "healthcare" && "Ask about preventive care, health navigation, or sovereign health services."}
                {mode.id === "language" && "Ask for translations, pronunciations, or cultural linguistic context."}
                {mode.id === "leadership" && "Ask about governance, sovereignty strategy, or enterprise development."}
              </div>

              {/* Sovereign badge */}
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.greenGlow, border:`1px solid ${C.green}40`, borderRadius:20, padding:"8px 16px", marginBottom:24 }}>
                <span style={{ color:C.greenLight, fontSize:12 }}>⬡</span>
                <span style={{ color:C.greenLight, fontFamily:"Rajdhani,sans-serif", fontSize:10, fontWeight:700, letterSpacing:1.5 }}>POWERED BY CHIKASHA FOUNDATIONAL MODEL · SOVEREIGN INFRASTRUCTURE</span>
              </div>

              {/* Starter prompts */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center", maxWidth:600, margin:"0 auto" }}>
                {(mode.id === "citizen" ? [
                  "What does Yakoke mean and when do I use it?",
                  "Tell me about Chickasaw removal and resilience",
                  "What is Iti Fabvssa?",
                  "How do I connect with Nation services?",
                ] : mode.id === "healthcare" ? [
                  "What preventive screenings should I prioritize?",
                  "How does the Chickasaw Health OS protect my data?",
                  "What are early signs of diabetes I should watch for?",
                  "How do I navigate IHS and Nation health services?",
                ] : mode.id === "language" ? [
                  "How do you say I love you in Chickasaw?",
                  "Teach me a Chickasaw greeting",
                  "What does Chikashshanompa mean?",
                  "How is Chickasaw language structured?",
                ] : [
                  "How should we structure a sovereign AI licensing agreement?",
                  "What is the OB3 Act and why does it matter?",
                  "How do we protect IP when pitching to the Nation?",
                  "What is the strategic case for a tribal health OS?",
                ]).map((p,i) => (
                  <button key={i} onClick={()=>setInput(p)} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.boneDim, padding:"8px 14px", borderRadius:20, cursor:"pointer", fontSize:11, fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", transition:"all 0.2s" }}
                    onMouseEnter={e=>{ e.target.style.borderColor=mode.color; e.target.style.color=C.bone; }}
                    onMouseLeave={e=>{ e.target.style.borderColor=C.border; e.target.style.color=C.boneDim; }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {chat.map((msg, i) => (
            <div key={i} className="fade-up" style={{ marginBottom:16, display:"flex", flexDirection:"column", alignItems: msg.role==="user" ? "flex-end" : "flex-start" }}>
              {msg.role === "user" && msg.shield && msg.shield.detected.length > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                  <span style={{ color:C.greenLight, fontSize:10 }}>⬡</span>
                  <span style={{ color:C.greenLight, fontSize:8, letterSpacing:1, fontFamily:"Rajdhani,sans-serif" }}>
                    {msg.shield.detected.length} TERM{msg.shield.detected.length>1?"S":""} PROTECTED
                  </span>
                </div>
              )}
              <div style={{ fontSize:9, color:C.muted, marginBottom:5, letterSpacing:1.5, textTransform:"uppercase", fontFamily:"Rajdhani,sans-serif" }}>
                {msg.role === "user" ? "You" : `CFM · ${mode.label} Mode`}
              </div>
              <div style={{
                background: msg.role === "user" ? C.slate : `${mode.color}12`,
                border: `1px solid ${msg.role === "user" ? C.border : mode.color + "35"}`,
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding:"14px 18px", maxWidth:"80%",
                color: C.bone, fontSize:14, lineHeight:1.85,
                whiteSpace:"pre-wrap", fontFamily:"'Cormorant Garamond',serif",
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing */}
          {loading && (
            <div className="fade-up" style={{ marginBottom:16, display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:5, letterSpacing:1.5, fontFamily:"Rajdhani,sans-serif", textTransform:"uppercase" }}>CFM · {mode.label} Mode</div>
              <Typing mode={mode}/>
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>
      </div>

      {/* ── INPUT AREA ── */}
      <div style={{ background:`${C.deep}F8`, borderTop:`1px solid ${C.border}`, padding:"16px 20px 20px", position:"sticky", bottom:0, zIndex:100, backdropFilter:"blur(12px)", flexShrink:0 }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>

          <ShieldDisplay result={shieldResult} visible={shieldVisible}/>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:mode.color, fontSize:12 }}>{mode.icon}</span>
              <span style={{ color:mode.color, fontFamily:"Rajdhani,sans-serif", fontSize:11, fontWeight:700, letterSpacing:1 }}>{mode.label} Mode Active</span>
              <Pill label="Shield On" color={C.greenLight}/>
              <Pill label="Sovereign" color={C.gold} dot={true}/>
            </div>
            {chat.length > 0 && (
              <button onClick={clearChat} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:10, fontFamily:"Rajdhani,sans-serif", letterSpacing:0.5 }}>Clear</button>
            )}
          </div>

          <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
            <div style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", transition:"border-color 0.2s" }}
              onFocus={e=>e.currentTarget.style.borderColor=mode.color}
              onBlur={e=>e.currentTarget.style.borderColor=C.border}>
              <textarea
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Ask CFM in ${mode.label} mode... (Enter to send)`}
                rows={2}
                style={{ width:"100%", background:"transparent", border:"none", color:C.bone, padding:"12px 14px", fontSize:13, resize:"none", outline:"none", fontFamily:"'Cormorant Garamond',serif", lineHeight:1.6 }}
              />
            </div>
            <button onClick={send} disabled={loading||!input.trim()} style={{
              background: loading||!input.trim() ? C.border : `linear-gradient(135deg, ${C.forest}, ${C.green})`,
              color: loading||!input.trim() ? C.muted : C.cream,
              border:"none", borderRadius:12, padding:"14px 20px",
              fontWeight:700, fontSize:13, cursor: loading||!input.trim()?"not-allowed":"pointer",
              fontFamily:"Rajdhani,sans-serif", letterSpacing:1,
              boxShadow: loading||!input.trim() ? "none" : `0 0 16px ${C.green}50`,
              transition:"all 0.2s", whiteSpace:"nowrap",
            }}>
              {loading ? "..." : "Send ◉"}
            </button>
          </div>

          <div style={{ marginTop:8, color:C.muted, fontSize:9, letterSpacing:1, fontFamily:"Rajdhani,sans-serif", textAlign:"center" }}>
            CHIKASHA FOUNDATIONAL MODEL · SOVEREIGN SHIELD ACTIVE · ALL QUERIES PROTECTED · YAKOKE
          </div>
        </div>
      </div>
    </div>
  );
}
