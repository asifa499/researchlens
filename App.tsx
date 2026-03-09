import { useState, useEffect, useRef } from "react";

/* ─── DESIGN TOKENS (Rork-style: black bg, white text, orange accent) ── */
const G = {
  bg:"#000000", surface:"#0a0a0a", card:"#111111", border:"#222222", borderH:"#333333",
  muted:"#888888", sub:"#444444", text:"#ffffff",
  accent:"#FF9500", accent2:"#FF6B00",
};
const ARCH_COLORS = ["#FF9500","#FF6B00","#FFB340","#FF3B30","#34C759","#007AFF","#AF52DE","#FF2D55"];

/* ─── TIER CONFIG ─── */
const TIERS = {
  1: { id:1, label:"AI Only", icon:"🧠", badge:"Synthetic · AI-generated", badgeColor:"#888888", badgeBg:"rgba(136,136,136,0.1)", badgeBorder:"rgba(136,136,136,0.2)", desc:"Fast internal ideation & brainstorming", time:"~8 sec", dot:"#888888", providers:[] },
  2: { id:2, label:"AI + Web Search", icon:"🌐", badge:"Grounded · Live web data + AI synthesis", badgeColor:"#FF9500", badgeBg:"rgba(255,149,0,0.1)", badgeBorder:"rgba(255,149,0,0.25)", desc:"Market entry research & client-facing reports", time:"~20–35 sec", dot:"#FF9500", providers:[] },
  3: { id:3, label:"AI + Web + Verified APIs", icon:"🏛", badge:"Verified · Third-party data + AI synthesis", badgeColor:"#34C759", badgeBg:"rgba(52,199,89,0.1)", badgeBorder:"rgba(52,199,89,0.25)", desc:"Enterprise & high-stakes investment decisions", time:"~45–90 sec", dot:"#34C759", providers:["World Bank","Google Trends","REST Countries","Open Exchange"] },
};

const PROVIDER_STYLES = {
  "World Bank":    { color:"#007AFF", bg:"rgba(0,122,255,0.1)",  border:"rgba(0,122,255,0.25)",  icon:"🏦" },
  "Google Trends": { color:"#FF9500", bg:"rgba(255,149,0,0.1)",  border:"rgba(255,149,0,0.25)",  icon:"📈" },
  "REST Countries":{ color:"#34C759", bg:"rgba(52,199,89,0.1)", border:"rgba(52,199,89,0.25)", icon:"🌍" },
  "Open Exchange": { color:"#FF2D55", bg:"rgba(255,45,85,0.1)", border:"rgba(255,45,85,0.25)", icon:"💱" },
};

const uid    = () => Math.random().toString(36).slice(2,10);
const nowStr = () => new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const STORAGE_KEY = "rl_v7";
const TAGS_PRESET = [
  "AdTech","Agriculture","AI & ML","Automotive","B2B","B2C","Banking","Beauty & Personal Care",
  "BioTech","Blockchain & Web3","CleanTech","Construction","Cybersecurity","E-commerce",
  "EdTech","Education","Energy & Utilities","Fashion & Apparel","FMCG","FinTech",
  "Food & Beverage","FoodTech","Gaming","Government & Public Sector","Healthcare","HealthTech",
  "Hospitality & Tourism","HR & Recruitment","Insurance","Legal & Compliance","LegalTech",
  "Logistics & Supply Chain","Manufacturing","MarTech","Media & Entertainment","MedTech",
  "Non-Profit","Pharmaceuticals","PropTech","Real Estate","Retail","SaaS","SpaceTech",
  "Sports & Fitness","Telecom","Travel",
].sort((a,b)=>a.localeCompare(b));
const ROLES = ["Viewer","Analyst","Editor","Admin"];
const STATUS = {
  draft:  { color:"#888888", bg:"rgba(136,136,136,0.1)",  label:"Draft" },
  active: { color:"#FF9500", bg:"rgba(255,149,0,0.1)",    label:"Active" },
  done:   { color:"#34C759", bg:"rgba(52,199,89,0.1)",    label:"Done" },
};
const LANGUAGES = [
  {code:"auto",label:"Auto — match geo"},{code:"en",label:"English"},{code:"ar",label:"Arabic"},
  {code:"fr",label:"French"},{code:"de",label:"German"},{code:"es",label:"Spanish"},
  {code:"pt",label:"Portuguese"},{code:"ru",label:"Russian"},{code:"zh",label:"Chinese"},
  {code:"ja",label:"Japanese"},{code:"tr",label:"Turkish"},{code:"hi",label:"Hindi"},
];

const PERSONA_GROUPS = [
  { key:"core", icon:"👤", label:"Core Demographics", fields:[
    {key:"ageMin",label:"Age Min",type:"input",inputType:"number"},{key:"ageMax",label:"Age Max",type:"input",inputType:"number"},
    {key:"gender",label:"Gender",type:"select",options:["All","Male","Female","Non-binary"]},
    {key:"incomeLevel",label:"Income Level",type:"select",options:["Low Income","Lower-Middle","Middle Income","Upper-Middle","High Income"]},
    {key:"education",label:"Education",type:"select",options:["High School","Vocational","Bachelor's Degree","Master's Degree","PhD"]},
    {key:"occupation",label:"Occupation",type:"select",options:["Student","Blue Collar","Professional","Self-Employed","Executive","Retired"]},
    {key:"familySize",label:"Family Size",type:"select",options:["Single","2","2–4","4+","Multi-generational"]},
    {key:"lifestyle",label:"Lifestyle",type:"select",options:["Urban","Suburban","Rural","Nomadic","Mixed"]},
  ]},
  { key:"psych", icon:"🧠", label:"Psychological & Cognitive", fields:[
    {key:"digitalSavviness",label:"Digital Savviness",type:"multi",options:["Low","Medium","High","Tech-native"]},
    {key:"riskTolerance",label:"Risk Tolerance",type:"multi",options:["Averse","Cautious","Moderate","Aggressive"]},
    {key:"decisionMaking",label:"Decision-Making Style",type:"multi",options:["Impulsive","Deliberate","Influence-driven"]},
    {key:"brandLoyalty",label:"Brand Loyalty",type:"multi",options:["Switcher","Moderate","Highly loyal"]},
    {key:"innovationAdoption",label:"Innovation Adoption",type:"multi",options:["Laggard","Early majority","Early adopter","Innovator"]},
    {key:"statusConsciousness",label:"Status Consciousness",type:"multi",options:["Low","Medium","High"]},
    {key:"sustainabilityMind",label:"Sustainability Mindset",type:"multi",options:["Indifferent","Aware","Activist"]},
  ]},
  { key:"finance", icon:"💸", label:"Financial Behavior", fields:[
    {key:"paymentPref",label:"Payment Preference",type:"multi",options:["Cash","Card","Mobile wallet","BNPL"]},
    {key:"savingsBehavior",label:"Savings Behavior",type:"multi",options:["Spender","Balanced","Saver"]},
    {key:"debtAttitude",label:"Debt Attitude",type:"multi",options:["Avoids","Acceptable","Leverage-positive"]},
    {key:"subscriptionTolerance",label:"Subscription Tolerance",type:"multi",options:["None","Few","Many"]},
    {key:"discountResponse",label:"Discount Responsiveness",type:"multi",options:["Ignores","Occasional","Always seeks"]},
  ]},
  { key:"digital", icon:"📱", label:"Digital & Media", fields:[
    {key:"primaryDevice",label:"Primary Device",type:"multi",options:["Mobile-first","Desktop","Mixed"]},
    {key:"socialMediaUsage",label:"Social Media Usage",type:"multi",options:["None","Passive","Active","Creator"]},
    {key:"contentConsumption",label:"Content Consumption",type:"multi",options:["Short-form","Long-form","Video","Audio"]},
    {key:"onlineShopping",label:"Online Shopping Frequency",type:"multi",options:["Never","Monthly","Weekly","Daily"]},
    {key:"appEngagement",label:"App Engagement",type:"multi",options:["Low","Medium","Power user"]},
    {key:"influencerSuscep",label:"Influencer Susceptibility",type:"multi",options:["None","Moderate","High"]},
  ]},
  { key:"cultural", icon:"🌍", label:"Cultural & Social", fields:[
    {key:"religiosity",label:"Religiosity Level",type:"multi",options:["Secular","Moderate","Observant"]},
    {key:"collectivism",label:"Collectivism vs Individualism",type:"multi",options:["Collectivist","Balanced","Individualist"]},
    {key:"languagePref",label:"Language Preference",type:"multi",options:["Local","English","Bilingual"]},
    {key:"communityInvolve",label:"Community Involvement",type:"multi",options:["Isolated","Engaged","Leader"]},
    {key:"politicalLeaning",label:"Political Leaning",type:"multi",options:["Conservative","Moderate","Progressive"]},
    {key:"generationalCohort",label:"Generational Cohort",type:"multi",options:["Gen Z","Millennial","Gen X","Boomer"]},
  ]},
  { key:"purchase", icon:"🛍", label:"Purchase Behavior", fields:[
    {key:"researchDepth",label:"Research Depth Before Purchase",type:"multi",options:["None","Basic","Deep researcher"]},
    {key:"returnTendency",label:"Return Rate Tendency",type:"multi",options:["Never","Occasional","Frequent"]},
    {key:"reviewDependency",label:"Review Dependency",type:"multi",options:["Ignores","Reads","Writes reviews"]},
    {key:"channelPref",label:"Channel Preference",type:"multi",options:["In-store","Online","Omnichannel"]},
    {key:"peerRecommendation",label:"Peer Recommendation Weight",type:"multi",options:["Low","Medium","High"]},
  ]},
];

const emptyPersona = () => {
  const p = { ageMin:"25", ageMax:"45", gender:"All", incomeLevel:"Middle Income", education:"Bachelor's Degree", occupation:"Professional", familySize:"2–4", lifestyle:"Urban" };
  PERSONA_GROUPS.forEach(g => g.fields.forEach(f => { if(f.type==="multi") p[f.key]=[]; }));
  return p;
};
const RESEARCH_GOALS = [
  "Market Entry","Market Sizing","Growth Opportunities","Competitor Analysis",
  "Consumer Segmentation","Brand Positioning","Product Validation","Pricing Strategy",
  "Campaign Targeting","Investment Due Diligence","Customer Retention","New Category Discovery",
];

const COUNTRY_CITIES = {
  "Afghanistan":["Kabul","Kandahar","Herat"],"Albania":["Tirana","Durrës","Vlorë"],"Algeria":["Algiers","Oran","Constantine"],"Azerbaijan":["Baku","Ganja","Sumqayıt","Mingəçevir","Nakhchivan","Lənkəran","Şirvan","Yevlax","Xankəndi","Şəki"],"Argentina":["Buenos Aires","Córdoba","Rosario","Mendoza"],"Australia":["Sydney","Melbourne","Brisbane","Perth","Adelaide","Canberra"],"Austria":["Vienna","Graz","Linz","Salzburg"],"Bahrain":["Manama","Riffa","Muharraq"],"Bangladesh":["Dhaka","Chittagong","Sylhet","Rajshahi"],"Belgium":["Brussels","Antwerp","Ghent","Bruges"],"Brazil":["São Paulo","Rio de Janeiro","Brasília","Salvador","Fortaleza","Belo Horizonte","Curitiba"],"Canada":["Toronto","Montreal","Vancouver","Calgary","Edmonton","Ottawa","Winnipeg"],"Chile":["Santiago","Valparaíso","Concepción"],"China":["Beijing","Shanghai","Guangzhou","Shenzhen","Chengdu","Wuhan","Hangzhou","Nanjing"],"Colombia":["Bogotá","Medellín","Cali","Barranquilla"],"Egypt":["Cairo","Alexandria","Giza","Port Said","Luxor","Aswan","Hurghada"],"France":["Paris","Marseille","Lyon","Toulouse","Nice","Nantes","Bordeaux"],"Germany":["Berlin","Hamburg","Munich","Cologne","Frankfurt","Stuttgart","Leipzig"],"Ghana":["Accra","Kumasi","Tamale"],"India":["Mumbai","Delhi","Bengaluru","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Jaipur","Lucknow"],"Indonesia":["Jakarta","Surabaya","Bandung","Medan","Makassar","Denpasar","Yogyakarta"],"Iran":["Tehran","Mashhad","Isfahan","Tabriz","Shiraz"],"Iraq":["Baghdad","Basra","Mosul","Erbil"],"Italy":["Rome","Milan","Naples","Turin","Florence","Venice"],"Japan":["Tokyo","Osaka","Nagoya","Sapporo","Fukuoka","Kyoto"],"Jordan":["Amman","Zarqa","Irbid","Aqaba"],"Kenya":["Nairobi","Mombasa","Kisumu","Nakuru"],"Kuwait":["Kuwait City","Salmiya","Hawalli"],"Lebanon":["Beirut","Tripoli","Sidon"],"Malaysia":["Kuala Lumpur","George Town","Ipoh","Johor Bahru","Kota Kinabalu"],"Mexico":["Mexico City","Guadalajara","Monterrey","Puebla","Tijuana","Cancún"],"Morocco":["Casablanca","Rabat","Fes","Marrakech","Agadir","Tangier"],"Netherlands":["Amsterdam","Rotterdam","The Hague","Utrecht","Eindhoven"],"Nigeria":["Lagos","Abuja","Kano","Ibadan","Port Harcourt","Kaduna"],"Norway":["Oslo","Bergen","Trondheim","Stavanger"],"Oman":["Muscat","Salalah","Sohar"],"Pakistan":["Karachi","Lahore","Faisalabad","Rawalpindi","Islamabad","Peshawar","Multan"],"Philippines":["Manila","Quezon City","Davao","Cebu City","Taguig"],"Poland":["Warsaw","Kraków","Łódź","Wrocław","Gdańsk"],"Portugal":["Lisbon","Porto","Braga","Coimbra"],"Qatar":["Doha","Al Rayyan","Al Wakrah","Lusail"],"Romania":["Bucharest","Cluj-Napoca","Timișoara","Iași"],"Russia":["Moscow","Saint Petersburg","Novosibirsk","Yekaterinburg","Kazan"],"Saudi Arabia":["Riyadh","Jeddah","Mecca","Medina","Dammam","Khobar","Abha"],"Singapore":["Singapore"],"South Africa":["Johannesburg","Cape Town","Durban","Pretoria"],"South Korea":["Seoul","Busan","Incheon","Daegu","Daejeon"],"Spain":["Madrid","Barcelona","Valencia","Seville","Zaragoza","Málaga"],"Sweden":["Stockholm","Gothenburg","Malmö","Uppsala"],"Switzerland":["Zurich","Geneva","Basel","Bern"],"Taiwan":["Taipei","Kaohsiung","Taichung","Tainan"],"Thailand":["Bangkok","Chiang Mai","Phuket","Pattaya"],"Tunisia":["Tunis","Sfax","Sousse"],"Turkey":["Istanbul","Ankara","Izmir","Bursa","Antalya","Adana","Gaziantep"],"UAE":["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Al Ain"],"UK":["London","Birmingham","Manchester","Leeds","Glasgow","Liverpool","Bristol","Edinburgh"],"USA":["New York","Los Angeles","Chicago","Houston","Phoenix","San Antonio","San Diego","Dallas","San Jose","Austin","San Francisco","Seattle","Denver","Washington DC","Miami","Atlanta","Boston"],"Ukraine":["Kyiv","Kharkiv","Odessa","Dnipro","Lviv"],"Vietnam":["Ho Chi Minh City","Hanoi","Da Nang","Hai Phong"],"Zimbabwe":["Harare","Bulawayo","Chitungwiza"],
};
const ALL_COUNTRIES = Object.keys(COUNTRY_CITIES).sort((a,b)=>a.localeCompare(b));

const emptyRForm = () => ({ name:"", geo:{country:"",cities:[]}, industry:"", productService:"", researchGoal:"", numberOfPeople:"", language:"auto", tier:2, persona:emptyPersona() });

/* ─── STORAGE ─── */
const loadP = async () => { try { const r=await window.storage.get(STORAGE_KEY); return r?JSON.parse(r.value):[]; } catch(_){return [];} };
const saveP = async (list) => { try { await window.storage.set(STORAGE_KEY,JSON.stringify(list)); } catch(_){} };

/* ─── TIER 3 DATA FETCHER ─── */
const fetchVerifiedData = async (form, onProgress) => {
  const country = form.geo.country.trim();
  const results = { worldBank:{}, restCountries:{}, exchangeRate:{}, fetchedAt: new Date().toISOString() };
  try {
    onProgress("Fetching country profile…");
    const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=false&fields=name,capital,region,subregion,population,area,languages,currencies,cca2,cca3`);
    if (res.ok) { const data=await res.json(); const c=data[0]; results.restCountries={name:c.name?.common,capital:c.capital?.[0],region:c.region,subregion:c.subregion,population:c.population,area:c.area,languages:Object.values(c.languages||{}),currencies:Object.entries(c.currencies||{}).map(([k,v])=>`${v.name} (${v.symbol||k})`),cca2:c.cca2,cca3:c.cca3}; }
  } catch(e) { results.restCountries.error=e.message; }
  const ISO = results.restCountries?.cca3 || country.slice(0,3).toUpperCase();
  const WB_INDICATORS = [["NY.GDP.MKTP.CD","GDP (current USD)"],["NY.GDP.PCAP.CD","GDP per capita (USD)"],["FP.CPI.TOTL.ZG","Inflation rate (%)"],["SP.URB.TOTL.IN.ZS","Urban population (%)"],["IT.NET.USER.ZS","Internet users (%)"],["SP.POP.TOTL","Total population"],["SL.UEM.TOTL.ZS","Unemployment rate (%)"]];
  try {
    onProgress("Fetching World Bank indicators…");
    const wbResults = await Promise.all(WB_INDICATORS.map(([code])=>fetch(`https://api.worldbank.org/v2/country/${ISO}/indicator/${code}?format=json&mrv=3&per_page=3`).then(r=>r.ok?r.json():null).catch(()=>null)));
    const wb={};
    wbResults.forEach((data,i)=>{ if(!data||!data[1])return; const[code,label]=WB_INDICATORS[i]; const entries=data[1].filter(d=>d.value!==null); if(entries.length>0)wb[code]={label,value:entries[0].value,year:entries[0].date}; });
    results.worldBank=wb;
  } catch(e) { results.worldBank.error=e.message; }
  try {
    onProgress("Fetching exchange rates…");
    const fxRes=await fetch(`https://open.er-api.com/v6/latest/USD`);
    if(fxRes.ok){const fx=await fxRes.json();results.exchangeRate={base:"USD",rate:fx.rates?.["USD"],lastUpdate:fx.time_last_update_utc};}
  } catch(e) { results.exchangeRate.error=e.message; }
  onProgress("Structuring verified context…");
  return results;
};

/* ─── BUILD PROMPT ─── */
const buildPrompt = (f, verifiedData=null) => {
  const lang = f.language==="auto" ? `Detect the primary local language of ${f.geo.country} and write ALL prose in that language. Keep JSON keys in English.` : f.language==="en" ? "Write all prose in English." : `Write ALL prose in language code "${f.language}". Keep JSON keys in English.`;
  const p = f.persona;
  const geoStr = `${f.geo.country}${f.geo.cities?.length?", "+f.geo.cities.join(" / "):""}`;
  const multiLines = PERSONA_GROUPS.filter(g=>g.key!=="core").flatMap(g=>g.fields.map(field=>{ const vals=(p[field.key]||[]); return vals.length>0?`${field.label}: ${vals.join(", ")}`:null; })).filter(Boolean).join(" | ");

  if(f.tier===1) return { prompt:`You are a world-class consumer & market research analyst. Using your trained knowledge base, generate a comprehensive synthetic consumer research report.\n${lang}\nSchema (return ONLY this JSON, no markdown fences):\n{"tier":1,"language":"<language name>","searchedSources":[],"dataProviders":[],"archetypes":[{"name":"string","description":"3-4 rich sentences","traits":["4-6 labels"],"sharePercent":<int>}],"insights":"400-500 word prose","opportunities":"300-400 word prose","solutions":"350-450 word prose"}\nRules: archetypes min 2, sharePercent sums to 100, no bullet lists.\nInputs:\nRun: ${f.name||"Unnamed"} | Geo: ${geoStr} | Goal: ${f.researchGoal||"Market discovery"} | Audience: ${f.numberOfPeople||"unspecified"}\nCore Persona: Age ${p.ageMin}–${p.ageMax} | ${p.gender} | ${p.incomeLevel} | ${p.education} | ${p.occupation} | Family: ${p.familySize} | ${p.lifestyle}\nExtended: ${multiLines||"None"}`, useWebSearch:false };

  if(f.tier===2) return { prompt:`You are a world-class consumer & market research analyst with access to live web search. You MUST use the web_search tool multiple times before writing the report.\nREQUIRED SEARCHES:\n1. "${f.geo.country} consumer market size 2024 2025"\n2. "${geoStr} consumer behavior trends 2024"\n3. "${f.geo.country} market competitors landscape 2024"\n4. "${f.geo.country} economic indicators GDP income consumer spending 2024 2025"\n5. "${p.ageMin}–${p.ageMax} age ${f.geo.country} ${f.researchGoal||"consumer"} trends"\nAfter searching, cite real data points, company names, and statistics naturally in prose.\n${lang}\nSchema (return ONLY this JSON, no markdown fences):\n{"tier":2,"language":"<language name>","searchedSources":["<up to 8 real sources found>"],"dataProviders":[],"archetypes":[{"name":"string","description":"3-4 rich sentences with real data refs","traits":["4-6 labels"],"sharePercent":<int>}],"insights":"450-550 word prose grounded in real searched data","opportunities":"350-450 word prose","solutions":"400-500 word prose"}\nRules: archetypes min 2, sharePercent sums to 100, no bullet lists.\nInputs:\nRun: ${f.name||"Unnamed"} | Geo: ${geoStr} | Goal: ${f.researchGoal||"Market discovery"} | Audience: ${f.numberOfPeople||"unspecified"}\nCore Persona: Age ${p.ageMin}–${p.ageMax} | ${p.gender} | ${p.incomeLevel} | ${p.education} | ${p.occupation} | Family: ${p.familySize} | ${p.lifestyle}\nExtended: ${multiLines||"None"}`, useWebSearch:true };

  const buildVC = (vd) => {
    if(!vd) return "";
    const lines=[]; const rc=vd.restCountries||{};
    if(rc.name) lines.push(`Country: ${rc.name} | Capital: ${rc.capital} | Region: ${rc.region}`);
    if(rc.population) lines.push(`Population: ${Number(rc.population).toLocaleString()}`);
    const wb=vd.worldBank||{}; const wbF=Object.values(wb).filter(v=>v&&v.value!=null).map(v=>`${v.label}: ${typeof v.value==="number"?v.value.toLocaleString(undefined,{maximumFractionDigits:2}):v.value} (${v.year})`);
    if(wbF.length) lines.push("World Bank:\n  "+wbF.join("\n  "));
    return lines.join("\n");
  };

  return { prompt:`You are a world-class consumer & market research analyst. You have VERIFIED data from authoritative sources. Also use web_search tool for current intelligence.\n═══ VERIFIED DATA ═══\n${buildVC(verifiedData)}\n═══════════════════\nREQUIRED WEB SEARCHES:\n1. "${f.geo.country} ${f.industry||"consumer market"} market size revenue 2024 2025"\n2. "${f.geo.country} top companies market share 2024"\n3. "${f.geo.country} consumer spending patterns latest report"\n4. "${f.geo.country} investment opportunities growth forecast"\n${lang}\nSchema (return ONLY this JSON, no markdown fences):\n{"tier":3,"language":"<language name>","searchedSources":["<up to 10 sources>"],"dataProviders":["World Bank","REST Countries","Open Exchange"],"verifiedStats":[{"label":"<stat name>","value":"<formatted value>","source":"<provider>","year":"<year>"}],"archetypes":[{"name":"string","description":"4-5 rich sentences citing verified data","traits":["5-7 labels"],"sharePercent":<int>}],"insights":"550-650 word prose weaving verified stats + web intelligence","opportunities":"400-500 word prose backed by real data","solutions":"450-550 word prose with real benchmarks"}\nRules: archetypes min 3, sharePercent sums to 100, no bullet lists.\nInputs:\nRun: ${f.name||"Unnamed"} | Geo: ${geoStr} | Goal: ${f.researchGoal||"Market discovery"} | Audience: ${f.numberOfPeople||"unspecified"}\nCore Persona: Age ${p.ageMin}–${p.ageMax} | ${p.gender} | ${p.incomeLevel} | ${p.education} | ${p.occupation} | Family: ${p.familySize} | ${p.lifestyle}\nExtended: ${multiLines||"None"}`, useWebSearch:true };
};

/* ─── PDF ─── */
const triggerPDF = (run, proj) => {
  const r=run.results, geo=`${run.geo.country}${run.geo.cities?.length?", "+run.geo.cities[0]:""}`, tier=TIERS[run.tier||2];
  const archHTML=(r.archetypes||[]).map((a,i)=>{ const c=ARCH_COLORS[i%8],pct=a.sharePercent||0; return `<div style="background:#111;border-radius:12px;padding:18px;border-left:4px solid ${c};margin-bottom:14px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><strong style="font-size:13px;color:#fff;flex:1">${a.name}</strong><span style="font-size:12px;font-weight:700;color:${c}">${pct}%</span></div><p style="font-size:12px;color:#888;line-height:1.6;margin-bottom:10px">${a.description}</p><div style="display:flex;flex-wrap:wrap;gap:4px">${(a.traits||[]).map(t=>`<span style="font-size:10px;background:#222;border:1px solid #333;border-radius:10px;padding:2px 8px;color:#ccc">${t}</span>`).join("")}</div></div>`; }).join("");
  const prose=t=>(t||"").replace(/\n\n/g,"</p><p style='margin-top:12px'>").replace(/\n/g," ");
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;background:#000;color:#fff}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div style="padding:64px;background:#000;min-height:100vh;page-break-after:always"><div style="font-size:14px;font-weight:800;color:#FF9500;margin-bottom:40px">● ResearchLens</div><div style="font-size:60px;font-weight:900;line-height:1.0;letter-spacing:-2px;margin-bottom:20px">${run.name||"Research Report"}<br><span style="color:#FF9500">${geo}.</span></div><div style="font-size:18px;color:#888;margin-bottom:40px">${run.industry||"Market"} · ${run.persona.ageMin}–${run.persona.ageMax} yrs · ${run.persona.incomeLevel}</div><div style="display:flex;gap:40px">${[["Project",proj?.name||"—"],["Geography",geo],["Date",run.createdAt],["Tier",`Tier ${run.tier||2} — ${tier.label}`]].map(([l,v])=>`<div><div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${l}</div><div style="font-size:14px;color:#fff;font-weight:600">${v}</div></div>`).join("")}</div></div>${[["🎭","Archetypes",archHTML],["🔍","Insights",`<p style="font-size:13.5px;line-height:1.8;color:#aaa">${prose(r.insights)}</p>`],["🚀","Opportunities",`<p style="font-size:13.5px;line-height:1.8;color:#aaa">${prose(r.opportunities)}</p>`],["💡","Solutions",`<p style="font-size:13.5px;line-height:1.8;color:#aaa">${prose(r.solutions)}</p>`]].map(([icon,title,body])=>`<div style="padding:52px 64px;background:#000;page-break-after:always"><div style="font-size:28px;font-weight:900;margin-bottom:32px;color:#fff">${icon} ${title}</div>${body}</div>`).join("")}</body></html>`;
  const w=window.open("","_blank"); w.document.write(html); w.document.close(); w.onload=()=>{w.focus();w.print();};
};

/* ─── BASE UI ─── */
const css = {
  page:  {minHeight:"100vh",background:"#000000",color:"#ffffff",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text',system-ui,sans-serif"},
  card:  {background:"#111111",border:"1px solid #222222",borderRadius:16},
  input: {width:"100%",background:"#111111",border:"1px solid #222222",borderRadius:10,padding:"11px 14px",fontSize:14,color:"#ffffff",outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
  label: {display:"block",fontSize:12,color:"#666666",marginBottom:6,fontWeight:500},
};

function Input({label,value,onChange,placeholder,type="text",min,rows,onKeyDown}) {
  const [f,setF]=useState(false);
  const s={...css.input,borderColor:f?"#FF9500":"#222222",boxShadow:f?"0 0 0 3px rgba(255,149,0,0.15)":"none",resize:rows?"none":undefined};
  if(rows) return <div>{label&&<label style={css.label}>{label}</label>}<textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={s} onFocus={()=>setF(true)} onBlur={()=>setF(false)}/></div>;
  return <div>{label&&<label style={css.label}>{label}</label>}<input type={type} min={min} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} style={s} onFocus={()=>setF(true)} onBlur={()=>setF(false)}/></div>;
}
function Select({label,value,onChange,children}) {
  const [f,setF]=useState(false);
  return <div>{label&&<label style={css.label}>{label}</label>}<select value={value} onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{...css.input,appearance:"none",cursor:"pointer",borderColor:f?"#FF9500":"#222222",boxShadow:f?"0 0 0 3px rgba(255,149,0,0.15)":"none"}}>{children}</select></div>;
}
function PrimaryBtn({onClick,children,disabled,style={}}) {
  const [hov,setHov]=useState(false);
  return <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:hov&&!disabled?"#FFB340":"#FF9500",border:"none",borderRadius:10,padding:"11px 22px",fontSize:14,fontWeight:700,color:"#000000",cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,fontFamily:"inherit",letterSpacing:"-0.2px",transition:"all .15s",...style}}>{children}</button>;
}
function GhostBtn({onClick,children,style={}}) {
  const [hov,setHov]=useState(false);
  return <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:"transparent",border:`1px solid ${hov?"#444444":"#222222"}`,borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:500,color:hov?"#ffffff":"#888888",cursor:"pointer",fontFamily:"inherit",transition:"all .15s",...style}}>{children}</button>;
}
function Pill({label,value,onRemove}) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"#111111",border:"1px solid #222222",borderRadius:20,padding:"3px 10px",fontSize:11,color:"#888888"}}>
    {value?<><span style={{color:"#FF9500",fontWeight:600}}>{label}:</span>{value}</>:label}
    {onRemove&&<button onClick={onRemove} style={{background:"none",border:"none",color:"#444444",cursor:"pointer",fontSize:13,lineHeight:1,padding:"0 0 0 2px",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.color="#FF3B30"} onMouseLeave={e=>e.currentTarget.style.color="#444444"}>×</button>}
  </span>;
}
function StatusBadge({status}) {
  const s=STATUS[status]||STATUS.draft;
  return <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,background:s.bg,color:s.color,border:`1px solid ${s.color}30`,textTransform:"capitalize"}}>{s.label}</span>;
}
function LoadDots() {
  return <span style={{display:"inline-flex",gap:3,marginLeft:6}}>{[0,1,2].map(i=><span key={i} style={{width:5,height:5,borderRadius:"50%",background:"#FF9500",display:"inline-block",animation:"rl-bounce .8s infinite",animationDelay:`${i*0.15}s`}}/>)}</span>;
}
function Divider({style={}}) { return <div style={{height:1,background:"#1a1a1a",...style}}/>; }
function FormCard({icon,title,children}) {
  return <div style={{...css.card,padding:24,marginBottom:14}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}><span style={{fontSize:15}}>{icon}</span><span style={{fontSize:13,fontWeight:700,color:"#ffffff"}}>{title}</span></div>{children}</div>;
}
function Row({cols=2,gap=12,mb=14,children}) {
  return <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap,marginBottom:mb}}>{children}</div>;
}
function CollapsibleSection({icon,title,badge,children,defaultOpen=true}) {
  const [open,setOpen]=useState(defaultOpen);
  return <div style={{...css.card,overflow:"hidden",marginBottom:14}}>
    <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",background:"transparent",border:"none",cursor:"pointer",color:"#ffffff",fontFamily:"inherit"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:15}}>{icon}</span><span style={{fontSize:13,fontWeight:600}}>{title}</span>{badge&&<span style={{fontSize:10,background:"rgba(255,149,0,0.12)",color:"#FF9500",border:"1px solid rgba(255,149,0,0.2)",borderRadius:10,padding:"2px 8px",fontWeight:600}}>{badge}</span>}</div>
      <span style={{fontSize:10,color:"#444444",transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▼</span>
    </button>
    {open&&<><Divider/><div style={{padding:20}}>{children}</div></>}
  </div>;
}
function Toast({toast}) {
  if(!toast) return null;
  return <div style={{position:"fixed",top:16,right:16,zIndex:999,background:"#111111",border:`1px solid ${toast.type==="warn"?"rgba(255,59,48,0.4)":"rgba(255,149,0,0.4)"}`,borderRadius:12,padding:"12px 18px",fontSize:13,color:"#ffffff",boxShadow:"0 8px 32px rgba(0,0,0,0.8)",fontWeight:500}}>{toast.msg}</div>;
}

/* ─── LOGO ─── */
function LogoMark({size=32}) {
  return <div style={{width:size,height:size,borderRadius:"50%",background:"#FF9500",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
    <span style={{color:"#000",fontWeight:900,fontSize:size*0.45,lineHeight:1}}>●</span>
  </div>;
}

/* ─── APP HEADER ─── */
function AppHeader({back,backLabel,title,right}) {
  const [hov,setHov]=useState(false);
  return <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(20px)",borderBottom:"1px solid #1a1a1a",padding:"0 28px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:14,minWidth:0}}>
      {back ? <button onClick={back} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:`1px solid ${hov?"#333":"#1a1a1a"}`,borderRadius:10,padding:"6px 14px",fontSize:12,fontWeight:600,color:hov?"#ffffff":"#888888",cursor:"pointer",fontFamily:"inherit",flexShrink:0,transition:"all .15s"}}>← {backLabel}</button>
      : <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <LogoMark size={28}/>
          <span style={{fontSize:15,fontWeight:800,letterSpacing:"-0.5px",color:"#ffffff"}}>ResearchLens</span>
        </div>}
      {title&&<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:3,borderRadius:"50%",background:"#333",flexShrink:0}}/><span style={{fontSize:13,color:"#666666",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</span></div>}
    </div>
    {right&&<div style={{display:"flex",gap:8,flexShrink:0}}>{right}</div>}
  </div>;
}

/* ─── TIER SELECTOR ─── */
function TierSelector({value,onChange}) {
  return <div style={{...css.card,padding:20,marginBottom:14}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><span style={{fontSize:14}}>⚡</span><span style={{fontSize:13,fontWeight:700,color:"#ffffff"}}>Research Tier</span></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
      {Object.values(TIERS).map(t=>{
        const active=value===t.id;
        return <button key={t.id} onClick={()=>onChange(t.id)} style={{background:active?"#1a1a1a":"transparent",border:`1.5px solid ${active?t.badgeColor:"#222222"}`,borderRadius:12,padding:"14px 12px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s"}}>
          <div style={{fontSize:18,marginBottom:6}}>{t.icon}</div>
          <div style={{fontSize:11,fontWeight:700,color:active?t.badgeColor:"#ffffff",marginBottom:4}}>Tier {t.id}</div>
          <div style={{fontSize:11,fontWeight:600,color:active?t.badgeColor:"#888888",marginBottom:6,lineHeight:1.3}}>{t.label}</div>
          <div style={{fontSize:10,color:"#444444",lineHeight:1.4,marginBottom:4}}>{t.desc}</div>
          <div style={{fontSize:10,color:active?t.badgeColor:"#444444",fontWeight:600}}>{t.time}</div>
          {t.providers.length>0&&<div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:3}}>{t.providers.map(p=><span key={p} style={{fontSize:9,background:"rgba(52,199,89,0.1)",color:"#34C759",border:"1px solid rgba(52,199,89,0.2)",borderRadius:6,padding:"1px 5px"}}>{p}</span>)}</div>}
        </button>;
      })}
    </div>
  </div>;
}

/* ─── TAG DROPDOWN ─── */
function TagDropdown({tags,setTags,tagInput,setTagInput}) {
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const toggle=t=>setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);
  const addCustom=()=>{const v=tagInput.trim();if(v&&!tags.includes(v))setTags(p=>[...p,v]);setTagInput("");};
  const filtered=TAGS_PRESET.filter(t=>t.toLowerCase().includes(tagInput.toLowerCase())&&!tags.includes(t));
  const exactMatch=TAGS_PRESET.some(t=>t.toLowerCase()===tagInput.toLowerCase().trim());
  return <div ref={ref} style={{position:"relative"}}>
    {tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{tags.map(t=><Pill key={t} label={t} onRemove={()=>toggle(t)}/>)}</div>}
    <div style={{position:"relative"}} onClick={()=>setOpen(true)}>
      <input value={tagInput} onChange={e=>{setTagInput(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();if(tagInput.trim()&&!exactMatch)addCustom();else if(filtered.length>0)toggle(filtered[0]);}if(e.key==="Escape")setOpen(false);}} placeholder={tags.length>0?"Add more industries…":"Search or select industries…"} style={{...css.input,paddingRight:36,borderColor:open?"#FF9500":"#222222",boxShadow:open?"0 0 0 3px rgba(255,149,0,0.15)":"none"}}/>
      <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:10,color:"#444444",pointerEvents:"none"}}>▼</span>
    </div>
    {open&&<div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#111111",border:"1px solid #222222",borderRadius:12,zIndex:50,boxShadow:"0 16px 48px rgba(0,0,0,0.8)",overflow:"hidden",maxHeight:260,display:"flex",flexDirection:"column"}}>
      <div style={{overflowY:"auto",flex:1}}>
        {tagInput.trim()&&!exactMatch&&<button onClick={()=>{addCustom();setOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"transparent",border:"none",borderBottom:"1px solid #1a1a1a",cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}><span style={{fontSize:11,color:"#FF9500",background:"rgba(255,149,0,0.1)",border:"1px solid rgba(255,149,0,0.2)",borderRadius:6,padding:"2px 7px",fontWeight:700,flexShrink:0}}>+ Custom</span><span style={{fontSize:12,color:"#ffffff"}}>"{tagInput.trim()}"</span></button>}
        {filtered.map(t=><button key={t} onClick={()=>{toggle(t);setTagInput("");}} style={{width:"100%",display:"flex",alignItems:"center",padding:"9px 14px",background:"transparent",border:"none",borderBottom:"1px solid #1a1a1a",cursor:"pointer",fontFamily:"inherit",textAlign:"left",fontSize:12,color:"#ffffff",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,149,0,0.06)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{t}</button>)}
        {tags.filter(t=>t.toLowerCase().includes(tagInput.toLowerCase())).map(t=><button key={t+"_sel"} onClick={()=>toggle(t)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",background:"rgba(255,149,0,0.06)",border:"none",borderBottom:"1px solid #1a1a1a",cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}><span style={{fontSize:12,color:"#FF9500"}}>{t}</span><span style={{fontSize:10,color:"#FF9500",fontWeight:700}}>✓</span></button>)}
      </div>
      {tags.length>0&&<div style={{padding:"8px 14px",borderTop:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:10,color:"#444444"}}>{tags.length} selected</span><button onClick={()=>{setTags([]);setOpen(false);}} style={{fontSize:10,color:"#FF3B30",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Clear all</button></div>}
    </div>}
  </div>;
}

/* ─── PROJECT FORM ─── */
function ProjectForm({initial,onSave,onCancel,onDelete,isEdit}) {
  const [name,setName]=useState(initial.name);
  const [description,setDescription]=useState(initial.description);
  const [tags,setTags]=useState(initial.tags||[]);
  const [tagInput,setTagInput]=useState("");
  const [error,setError]=useState(null);
  const handleSave=()=>{if(!name.trim()){setError("Project name is required.");return;}onSave({name,description,status:initial.status||"draft",tags,members:initial.members||[]});};
  return <div style={{maxWidth:560,margin:"0 auto",padding:"32px 24px"}}>
    <FormCard icon="📋" title="Project Details">
      <Input label="Project Name *" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. MENA Retail Expansion 2025"/>
      <div style={{marginTop:14}}><Input label="Description" value={description} onChange={e=>setDescription(e.target.value)} placeholder="What is this project about?" rows={3}/></div>
    </FormCard>
    <FormCard icon="🏷" title="Industries / Tags">
      <TagDropdown tags={tags} setTags={setTags} tagInput={tagInput} setTagInput={setTagInput}/>
    </FormCard>
    {error&&<div style={{background:"rgba(255,59,48,0.1)",border:"1px solid rgba(255,59,48,0.3)",borderRadius:10,padding:"12px 16px",fontSize:12,color:"#FF3B30",marginBottom:16}}>{error}</div>}
    <div style={{display:"flex",gap:10}}><GhostBtn onClick={onCancel}>Cancel</GhostBtn><div style={{flex:1}}><PrimaryBtn onClick={handleSave} style={{width:"100%",padding:12}}>{isEdit?"Save Changes":"Create Project"}</PrimaryBtn></div></div>
    {isEdit&&<div style={{marginTop:24,paddingTop:20,borderTop:"1px solid #1a1a1a"}}><button onClick={onDelete} style={{background:"transparent",border:"1px solid rgba(255,59,48,0.25)",borderRadius:10,padding:"8px 16px",fontSize:12,color:"#FF3B30",cursor:"pointer",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,59,48,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>🗑 Delete Project</button></div>}
  </div>;
}

function MultiChips({label,options,value=[],onChange}) {
  const toggle=opt=>onChange(value.includes(opt)?value.filter(v=>v!==opt):[...value,opt]);
  return <div><label style={css.label}>{label}</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{options.map(opt=>{const active=value.includes(opt);return <button key={opt} onClick={()=>toggle(opt)} style={{fontSize:11,fontWeight:active?700:400,padding:"5px 12px",borderRadius:20,border:`1px solid ${active?"#FF9500":"#222222"}`,background:active?"rgba(255,149,0,0.12)":"transparent",color:active?"#FF9500":"#888888",cursor:"pointer",fontFamily:"inherit",transition:"all .12s"}}>{opt}</button>;})}</div></div>;
}

function PersonaSection({persona,onChange}) {
  const set=(k,v)=>onChange({...persona,[k]:v});
  const [openGroups,setOpenGroups]=useState({core:true});
  const toggleGroup=key=>setOpenGroups(p=>({...p,[key]:!p[key]}));
  return <div>{PERSONA_GROUPS.map(group=>{
    const isOpen=!!openGroups[group.key];
    const multiActive=group.fields.filter(f=>f.type==="multi").reduce((s,f)=>s+(persona[f.key]||[]).length,0);
    return <div key={group.key} style={{...css.card,overflow:"hidden",marginBottom:10}}>
      <button onClick={()=>toggleGroup(group.key)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 18px",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14}}>{group.icon}</span><span style={{fontSize:13,fontWeight:600,color:"#ffffff"}}>{group.label}</span>{group.key!=="core"&&multiActive>0&&<span style={{fontSize:10,background:"rgba(255,149,0,0.12)",color:"#FF9500",border:"1px solid rgba(255,149,0,0.2)",borderRadius:10,padding:"1px 8px",fontWeight:700}}>{multiActive}</span>}</div>
        <span style={{fontSize:10,color:"#444444",transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▼</span>
      </button>
      {isOpen&&<><Divider/><div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:16}}>
        {group.key==="core"?<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}><Input label="Age Min" type="number" value={persona.ageMin} onChange={e=>set("ageMin",e.target.value)}/><Input label="Age Max" type="number" value={persona.ageMax} onChange={e=>set("ageMax",e.target.value)}/><Select label="Gender" value={persona.gender} onChange={e=>set("gender",e.target.value)}>{["All","Male","Female","Non-binary"].map(o=><option key={o}>{o}</option>)}</Select></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}><Select label="Income Level" value={persona.incomeLevel} onChange={e=>set("incomeLevel",e.target.value)}>{["Low Income","Lower-Middle","Middle Income","Upper-Middle","High Income"].map(o=><option key={o}>{o}</option>)}</Select><Select label="Education" value={persona.education} onChange={e=>set("education",e.target.value)}>{["High School","Vocational","Bachelor's Degree","Master's Degree","PhD"].map(o=><option key={o}>{o}</option>)}</Select><Select label="Occupation" value={persona.occupation} onChange={e=>set("occupation",e.target.value)}>{["Student","Blue Collar","Professional","Self-Employed","Executive","Retired"].map(o=><option key={o}>{o}</option>)}</Select></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Select label="Family Size" value={persona.familySize} onChange={e=>set("familySize",e.target.value)}>{["Single","2","2–4","4+","Multi-generational"].map(o=><option key={o}>{o}</option>)}</Select><Select label="Lifestyle" value={persona.lifestyle} onChange={e=>set("lifestyle",e.target.value)}>{["Urban","Suburban","Rural","Nomadic","Mixed"].map(o=><option key={o}>{o}</option>)}</Select></div>
        </>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>{group.fields.map(f=><MultiChips key={f.key} label={f.label} options={f.options} value={persona[f.key]||[]} onChange={v=>set(f.key,v)}/>)}</div>}
      </div></>}
    </div>;
  })}</div>;
}

/* ─── COUNTRY DROPDOWN ─── */
function CountryDropdown({value,onChange}) {
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState("");
  const ref=useRef(null);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const filtered=ALL_COUNTRIES.filter(c=>c.toLowerCase().includes(search.toLowerCase()));
  return <div ref={ref} style={{position:"relative"}}>
    <label style={css.label}>Country *</label>
    <div onClick={()=>setOpen(o=>!o)} style={{...css.input,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",borderColor:open?"#FF9500":"#222222",boxShadow:open?"0 0 0 3px rgba(255,149,0,0.15)":"none"}}>
      <span style={{color:value?"#ffffff":"#444444"}}>{value||"Select country…"}</span>
      <span style={{fontSize:10,color:"#444444"}}>▼</span>
    </div>
    {open&&<div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#111111",border:"1px solid #222222",borderRadius:12,zIndex:60,boxShadow:"0 16px 48px rgba(0,0,0,0.8)",overflow:"hidden",display:"flex",flexDirection:"column",maxHeight:280}}>
      <div style={{padding:"8px 10px",borderBottom:"1px solid #1a1a1a"}}><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search country…" style={{...css.input,padding:"7px 10px",fontSize:12}}/></div>
      <div style={{overflowY:"auto",flex:1}}>{filtered.map(c=><button key={c} onClick={()=>{onChange(c);setSearch("");setOpen(false);}} style={{width:"100%",padding:"9px 14px",background:c===value?"rgba(255,149,0,0.08)":"transparent",border:"none",borderBottom:"1px solid #1a1a1a",cursor:"pointer",fontFamily:"inherit",textAlign:"left",fontSize:13,color:c===value?"#FF9500":"#ffffff",fontWeight:c===value?700:400}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,149,0,0.06)"} onMouseLeave={e=>e.currentTarget.style.background=c===value?"rgba(255,149,0,0.08)":"transparent"}>{c}</button>)}
        {filtered.length===0&&<div style={{padding:14,fontSize:12,color:"#444444",textAlign:"center"}}>No results</div>}
      </div>
    </div>}
  </div>;
}

/* ─── CITY MULTI-SELECT ─── */
function CityMultiSelect({country,value=[],onChange}) {
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState("");
  const ref=useRef(null);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const cities=COUNTRY_CITIES[country]||[];
  const filtered=cities.filter(c=>c.toLowerCase().includes(search.toLowerCase())&&!value.includes(c));
  const toggle=c=>onChange(value.includes(c)?value.filter(x=>x!==c):[...value,c]);
  if(!country) return <div><label style={css.label}>Cities</label><div style={{...css.input,color:"#333333",cursor:"not-allowed"}}>Select a country first…</div></div>;
  return <div ref={ref} style={{position:"relative"}}>
    <label style={css.label}>Cities <span style={{color:"#444444",fontWeight:400}}>(multi)</span></label>
    <div onClick={()=>setOpen(o=>!o)} style={{...css.input,minHeight:44,height:"auto",display:"flex",flexWrap:"wrap",gap:4,alignItems:"center",cursor:"pointer",borderColor:open?"#FF9500":"#222222",boxShadow:open?"0 0 0 3px rgba(255,149,0,0.15)":"none",padding:"6px 10px"}}>
      {value.length>0?value.map(c=><span key={c} style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(255,149,0,0.12)",border:"1px solid rgba(255,149,0,0.25)",borderRadius:20,padding:"2px 8px",fontSize:11,color:"#FF9500",fontWeight:600}} onClick={e=>{e.stopPropagation();toggle(c);}}>{c}<span style={{fontSize:11,cursor:"pointer",opacity:0.6}}>×</span></span>)
      :<span style={{fontSize:13,color:"#444444"}}>Select cities…</span>}
      <span style={{marginLeft:"auto",fontSize:10,color:"#444444",flexShrink:0}}>▼</span>
    </div>
    {open&&<div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#111111",border:"1px solid #222222",borderRadius:12,zIndex:60,boxShadow:"0 16px 48px rgba(0,0,0,0.8)",overflow:"hidden",display:"flex",flexDirection:"column",maxHeight:240}}>
      <div style={{padding:"8px 10px",borderBottom:"1px solid #1a1a1a"}}><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search city…" style={{...css.input,padding:"7px 10px",fontSize:12}}/></div>
      <div style={{overflowY:"auto",flex:1}}>{filtered.map(c=><button key={c} onClick={()=>toggle(c)} style={{width:"100%",padding:"9px 14px",background:"transparent",border:"none",borderBottom:"1px solid #1a1a1a",cursor:"pointer",fontFamily:"inherit",textAlign:"left",fontSize:13,color:"#ffffff"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,149,0,0.06)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{c}</button>)}
        {filtered.length===0&&<div style={{padding:14,fontSize:12,color:"#444444",textAlign:"center"}}>{search?"No results":"All cities selected"}</div>}
      </div>
      {value.length>0&&<div style={{padding:"7px 14px",borderTop:"1px solid #1a1a1a",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:10,color:"#444444"}}>{value.length} selected</span><button onClick={()=>onChange([])} style={{fontSize:10,color:"#FF3B30",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Clear</button></div>}
    </div>}
  </div>;
}

/* ─── RESEARCH FORM ─── */
function ResearchForm({onRun}) {
  const [form,setForm]=useState(emptyRForm());
  const [loading,setLoading]=useState(false);
  const [loadMsg,setLoadMsg]=useState("");
  const [loadSteps,setLoadSteps]=useState([]);
  const [error,setError]=useState(null);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const setCountry=v=>setForm(f=>({...f,geo:{country:v,cities:[]}}));
  const setCities=v=>setForm(f=>({...f,geo:{...f.geo,cities:v}}));

  const run=async()=>{
    if(!form.geo.country){setError("Please select a country.");return;}
    if(!form.researchGoal){setError("Please select a research goal.");return;}
    setError(null);setLoading(true);setLoadSteps([]);
    const timers=[];
    if(form.tier===1){setLoadMsg("Generating archetypes…");timers.push(setTimeout(()=>setLoadMsg("Building insights…"),2000));timers.push(setTimeout(()=>setLoadMsg("Finalising report…"),4000));}
    else if(form.tier===2){setLoadMsg("Searching live web data…");timers.push(setTimeout(()=>setLoadMsg("Analysing signals…"),4000));timers.push(setTimeout(()=>setLoadMsg("Generating insights…"),10000));timers.push(setTimeout(()=>setLoadMsg("Building report…"),18000));}
    else{setLoadMsg("Fetching verified APIs…");}
    try {
      let verifiedData=null;
      if(form.tier===3){
        verifiedData=await fetchVerifiedData(form,(msg)=>{setLoadMsg(msg);setLoadSteps(p=>[...p,{msg,ok:true}]);});
        setLoadSteps(p=>[...p,{msg:"✓ Verified data collected",ok:true}]);
        setLoadMsg("Running AI synthesis…");
      }
      const {prompt,useWebSearch}=buildPrompt(form,verifiedData);
      const body={model:"claude-sonnet-4-20250514",max_tokens:6000,messages:[{role:"user",content:prompt}]};
      if(useWebSearch) body.tools=[{"type":"web_search_20250305","name":"web_search"}];
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data=await res.json();
      const raw=(data.content||[]).filter(b=>b.type==="text").map(b=>b.text||"").join("")||"";
      const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
      timers.forEach(clearTimeout);
      onRun({id:uid(),name:form.name||`Run — ${nowStr()}`,createdAt:nowStr(),geo:{...form.geo},industry:form.industry,productService:form.productService,researchGoal:form.researchGoal,numberOfPeople:form.numberOfPeople,language:form.language,tier:form.tier,persona:{...form.persona},verifiedData,results:parsed});
    } catch(e){timers.forEach(clearTimeout);setError("Generation failed. Please try again.");setLoading(false);}
  };

  const tierCfg=TIERS[form.tier];
  return <div style={{maxWidth:660,margin:"0 auto",padding:"32px 24px"}}>
    <TierSelector value={form.tier} onChange={v=>set("tier",v)}/>
    <FormCard icon="🏷" title="Run Name"><Input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Cairo Urban Millennials — Q2 2025"/></FormCard>
    <FormCard icon="🌍" title="Geography">
      <Row cols={2} mb={12}><CountryDropdown value={form.geo.country} onChange={setCountry}/><CityMultiSelect country={form.geo.country} value={form.geo.cities} onChange={setCities}/></Row>
    </FormCard>
    <FormCard icon="🏢" title="Research Context">
      <div style={{marginBottom:16}}>
        <label style={css.label}>Research Goal</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {RESEARCH_GOALS.map(g=>{
            const active=form.researchGoal===g;
            return <button key={g} onClick={()=>set("researchGoal",active?"":g)} style={{padding:"9px 12px",borderRadius:10,border:`1px solid ${active?"#FF9500":"#222222"}`,background:active?"rgba(255,149,0,0.12)":"transparent",color:active?"#FF9500":"#888888",fontSize:12,fontWeight:active?700:400,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all .12s"}}>{g}</button>;
          })}
        </div>
      </div>
      <Row mb={0}>
        <Input label="Target Audience Size" type="number" value={form.numberOfPeople} onChange={e=>set("numberOfPeople",e.target.value)} placeholder="e.g. 50000"/>
        <Select label="Report Language" value={form.language} onChange={e=>set("language",e.target.value)}>{LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}</Select>
      </Row>
    </FormCard>
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"0 2px"}}><span style={{fontSize:14}}>👤</span><span style={{fontSize:13,fontWeight:700,color:"#ffffff"}}>Target Persona</span></div>
      <PersonaSection persona={form.persona} onChange={p=>setForm(f=>({...f,persona:p}))}/>
    </div>
    {error&&<div style={{background:"rgba(255,59,48,0.08)",border:"1px solid rgba(255,59,48,0.2)",borderRadius:10,padding:"12px 16px",fontSize:12,color:"#FF3B30",marginBottom:16}}>{error}</div>}
    {loading&&form.tier===3&&loadSteps.length>0&&<div style={{...css.card,padding:16,marginBottom:16}}>{loadSteps.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:"#34C759",marginBottom:4}}><span>✓</span><span>{s.msg}</span></div>)}</div>}
    <button onClick={run} disabled={loading} style={{width:"100%",background:loading?"#111111":"#FF9500",border:loading?"1px solid #222222":"none",borderRadius:12,padding:14,fontSize:15,fontWeight:700,color:loading?"#666666":"#000000",cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s",letterSpacing:"-0.3px"}}>
      {loading?<>{loadMsg}<LoadDots/></>:`${tierCfg.icon} Run Tier ${form.tier} Research`}
    </button>
    <div style={{textAlign:"center",marginTop:8,fontSize:11,color:"#444444"}}>{tierCfg.desc} · {tierCfg.time}</div>
  </div>;
}

/* ─── RESULT COMPONENTS ─── */
function TierBadge({tier}) {
  const t=TIERS[tier||2];
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:10,fontWeight:600,padding:"4px 12px",borderRadius:20,background:t.badgeBg,color:t.badgeColor,border:`1px solid ${t.badgeBorder}`}}>{t.icon} {t.badge}</span>;
}
function ProviderBadges({providers=[]}) {
  if(!providers.length) return null;
  return <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}><span style={{fontSize:10,color:"#444444",alignSelf:"center",marginRight:4}}>Data:</span>{providers.map(p=>{const s=PROVIDER_STYLES[p]||{color:"#888",bg:"rgba(136,136,136,0.1)",border:"rgba(136,136,136,0.2)",icon:"📊"};return <span key={p} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{s.icon} {p}</span>;})}</div>;
}
function VerifiedStatsPanel({stats=[],worldBankRaw}) {
  const displayStats=stats.length>0?stats:Object.values(worldBankRaw||{}).filter(v=>v&&v.value!=null).slice(0,8).map(v=>({label:v.label,value:typeof v.value==="number"?v.value.toLocaleString(undefined,{maximumFractionDigits:2}):v.value,source:"World Bank",year:v.year}));
  if(!displayStats.length) return null;
  return <div style={{background:"rgba(52,199,89,0.06)",border:"1px solid rgba(52,199,89,0.15)",borderRadius:14,padding:20,marginBottom:16}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span>✅</span><span style={{fontSize:12,fontWeight:700,color:"#34C759"}}>Verified Data Points</span><span style={{fontSize:10,color:"#444444",background:"rgba(52,199,89,0.08)",border:"1px solid rgba(52,199,89,0.15)",borderRadius:8,padding:"1px 7px"}}>{displayStats.length}</span></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>{displayStats.map((s,i)=><div key={i} style={{background:"#111111",border:"1px solid rgba(52,199,89,0.12)",borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:"#444444",marginBottom:3,display:"flex",justifyContent:"space-between"}}><span>{s.source}</span><span>{s.year}</span></div><div style={{fontSize:14,fontWeight:700,color:"#34C759",marginBottom:2}}>{s.value}</div><div style={{fontSize:10,color:"#888888",lineHeight:1.3}}>{s.label}</div></div>)}</div>
  </div>;
}
function SourcesStrip({sources=[]}) {
  if(!sources.length) return null;
  return <div style={{...css.card,padding:"12px 16px",marginBottom:16}}><div style={{fontSize:10,fontWeight:700,color:"#444444",letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Sources</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{sources.map((s,i)=><span key={i} style={{fontSize:10,background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:8,padding:"3px 9px",color:"#666666"}}>{s}</span>)}</div></div>;
}

/* ─── MAIN APP ─── */
export default function App() {
  const [view,setView]=useState("projects");
  const [projects,setProjects]=useState([]);
  const [ready,setReady]=useState(false);
  const [activeProj,setActiveProj]=useState(null);
  const [activeRun,setActiveRun]=useState(null);
  const [editingProj,setEditingProj]=useState(null);
  const [toast,setToast]=useState(null);

  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};
  useEffect(()=>{loadP().then(p=>{setProjects(p);setReady(true);});},[]);
  const persist=async list=>{setProjects(list);await saveP(list);};
  const handleCreateProject=async data=>{const proj={id:uid(),...data,createdAt:nowStr(),runs:[]};const list=[proj,...projects];await persist(list);setActiveProj(proj);showToast("Project created ✓");setView("project");};
  const handleUpdateProject=async data=>{const list=projects.map(p=>p.id===activeProj.id?{...p,...data}:p);await persist(list);setActiveProj(list.find(p=>p.id===activeProj.id));showToast("Saved ✓");setView("project");};
  const handleDeleteProject=async()=>{await persist(projects.filter(p=>p.id!==activeProj.id));showToast("Deleted","warn");setView("projects");};
  const handleRunComplete=async run=>{const updProj={...activeProj,runs:[run,...(activeProj.runs||[])]};const list=projects.map(p=>p.id===activeProj.id?updProj:p);await persist(list);setActiveProj(updProj);setActiveRun(run);showToast("Report ready ✓");setView("research");};

  const STYLE = `
    @keyframes rl-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
    select option{background:#111111;color:#ffffff}
    *{-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:#000}
    ::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
  `;

  if(!ready) return <div style={{...css.page,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}><style>{STYLE}</style><LogoMark size={40}/><LoadDots/></div>;

  /* ── PROJECTS LIST ── */
  if(view==="projects") return <div style={css.page}><style>{STYLE}</style><Toast toast={toast}/>
    <AppHeader right={<PrimaryBtn onClick={()=>setView("newProject")} style={{padding:"8px 18px",fontSize:13}}>+ New Project</PrimaryBtn>}/>
    {/* Hero — Rork-style */}
    <div style={{padding:"80px 32px 72px",borderBottom:"1px solid #111111",position:"relative",overflow:"hidden"}}>
      {/* subtle dot grid */}
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,#1a1a1a 1px,transparent 1px)",backgroundSize:"32px 32px",opacity:0.4,pointerEvents:"none"}}/>
      <div style={{position:"relative",maxWidth:680,margin:"0 auto",textAlign:"center"}}>
        {/* eyebrow */}
        <div style={{display:"inline-flex",alignItems:"center",gap:7,marginBottom:28}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#FF9500",display:"inline-block"}}/>
          <span style={{fontSize:13,fontWeight:600,color:"#888888",letterSpacing:"-0.2px"}}>Synthetic Discovery Platform</span>
        </div>
        {/* headline */}
        <h1 style={{margin:"0 0 16px",fontSize:56,fontWeight:900,lineHeight:1.0,letterSpacing:"-2.5px",color:"#ffffff"}}>
          Make almost any <br/>market research with{" "}
          <span style={{color:"#FF9500"}}>ResearchLens.</span>
        </h1>
        <p style={{margin:"0 0 40px",fontSize:16,color:"#666666",lineHeight:1.6,maxWidth:480,marginLeft:"auto",marginRight:"auto"}}>The most advanced AI for consumer insights. Better data, new capabilities, incredible depth.</p>
        {/* CTA */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
          <PrimaryBtn onClick={()=>setView("newProject")} style={{padding:"13px 28px",fontSize:15,borderRadius:12}}>Get started for free</PrimaryBtn>
          <GhostBtn style={{padding:"12px 24px",fontSize:14,borderRadius:12}}>Learn more</GhostBtn>
        </div>
        {/* stats row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginTop:56,borderTop:"1px solid #111111",paddingTop:40}}>
          {[["3","Research Tiers"],["100+","Markets"],["Live","Web + API Data"]].map(([val,lbl],i)=>(
            <div key={i} style={{flex:1,textAlign:"center",borderRight:i<2?"1px solid #111111":"none"}}>
              <div style={{fontSize:28,fontWeight:900,color:i===0?"#FF9500":"#ffffff",letterSpacing:"-1px",lineHeight:1}}>{val}</div>
              <div style={{fontSize:11,color:"#444444",fontWeight:500,marginTop:4,letterSpacing:"0.2px"}}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{maxWidth:680,margin:"0 auto",padding:"40px 24px"}}>
      {/* New project card */}
      <button onClick={()=>setView("newProject")} style={{width:"100%",display:"flex",alignItems:"center",gap:16,background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:16,padding:"20px 24px",cursor:"pointer",marginBottom:28,textAlign:"left",fontFamily:"inherit",transition:"all .15s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="#FF9500";e.currentTarget.style.background="#0f0f0f";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="#1a1a1a";e.currentTarget.style.background="#0a0a0a";}}>
        <div style={{width:44,height:44,background:"#FF9500",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#000",flexShrink:0}}>+</div>
        <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#ffffff",marginBottom:2}}>Create New Project</div><div style={{fontSize:12,color:"#444444"}}>Configure geography, persona depth, and research tier</div></div>
        <span style={{fontSize:18,color:"#333333"}}>→</span>
      </button>

      {/* Projects */}
      {projects.length===0 ? <div style={{...css.card,padding:64,textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:16}}>🗂</div>
        <div style={{fontSize:16,fontWeight:700,color:"#ffffff",marginBottom:6}}>No projects yet</div>
        <div style={{fontSize:13,color:"#444444",marginBottom:24}}>Create your first project to get started</div>
        <PrimaryBtn onClick={()=>setView("newProject")}>Create Project</PrimaryBtn>
      </div> : <>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <span style={{fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"#444444"}}>Your Projects</span>
          <span style={{fontSize:11,color:"#333333",background:"#111111",border:"1px solid #1a1a1a",borderRadius:10,padding:"1px 8px"}}>{projects.length}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {projects.map(p=><button key={p.id} onClick={()=>{setActiveProj(p);setView("project");}} style={{...css.card,padding:22,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#333333";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#222222";}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:15,fontWeight:700,color:"#ffffff"}}>{p.name}</span><StatusBadge status={p.status}/></div>
              <span style={{fontSize:11,color:"#444444",flexShrink:0,marginLeft:8}}>{p.createdAt}</span>
            </div>
            {p.description&&<p style={{fontSize:12,color:"#666666",marginBottom:10,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",lineHeight:1.5}}>{p.description}</p>}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{(p.tags||[]).map(t=><Pill key={t} label={t}/>)}</div>
              <div style={{display:"flex",gap:16,flexShrink:0}}><span style={{fontSize:11,color:"#444444"}}>🔬 {(p.runs||[]).length} run{(p.runs||[]).length!==1?"s":""}</span></div>
            </div>
          </button>)}
        </div>
      </>}
    </div>
  </div>;

  if(view==="newProject") return <div style={css.page}><style>{STYLE}</style><AppHeader back={()=>setView("projects")} backLabel="Projects" title="New Project"/><ProjectForm initial={{name:"",description:"",status:"draft",tags:[],members:[]}} isEdit={false} onSave={handleCreateProject} onCancel={()=>setView("projects")}/></div>;
  if(view==="editProject") return <div style={css.page}><style>{STYLE}</style><AppHeader back={()=>setView("project")} backLabel="Project" title="Edit Project"/><ProjectForm initial={editingProj||activeProj} isEdit={true} onSave={handleUpdateProject} onCancel={()=>setView("project")} onDelete={handleDeleteProject}/></div>;

  /* ── PROJECT DETAIL ── */
  if(view==="project") {
    const proj=projects.find(p=>p.id===activeProj?.id)||activeProj;
    return <div style={css.page}><style>{STYLE}</style><Toast toast={toast}/>
      <AppHeader back={()=>setView("projects")} backLabel="Projects" title={proj.name} right={<><GhostBtn onClick={()=>{setEditingProj(proj);setView("editProject");}}>Edit</GhostBtn><PrimaryBtn onClick={()=>setView("newResearch")} style={{padding:"8px 18px",fontSize:13}}>+ New Research</PrimaryBtn></>}/>
      <div style={{maxWidth:680,margin:"0 auto",padding:"32px 24px"}}>
        {/* Project header */}
        <div style={{marginBottom:28}}>
          <h2 style={{fontSize:32,fontWeight:900,letterSpacing:"-1px",color:"#ffffff",marginBottom:8,lineHeight:1}}>{proj.name}<span style={{color:"#FF9500"}}>.</span></h2>
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,marginBottom:12}}><StatusBadge status={proj.status}/>{(proj.tags||[]).map(t=><Pill key={t} label={t}/>)}</div>
          {proj.description&&<p style={{fontSize:13,color:"#666666",lineHeight:1.7,margin:0}}>{proj.description}</p>}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"#444444"}}>Research Runs</span><span style={{fontSize:11,color:"#333333",background:"#111111",border:"1px solid #1a1a1a",borderRadius:10,padding:"1px 8px"}}>{(proj.runs||[]).length}</span></div>
        </div>
        {(proj.runs||[]).length===0 ? <div style={{...css.card,padding:64,textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:16}}>🔬</div>
          <div style={{fontSize:16,fontWeight:700,color:"#ffffff",marginBottom:6}}>No runs yet</div>
          <div style={{fontSize:13,color:"#444444",marginBottom:24}}>Run your first synthetic research to generate insights</div>
          <PrimaryBtn onClick={()=>setView("newResearch")}>+ New Research Run</PrimaryBtn>
        </div> : <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {proj.runs.map(run=>{
            const t=TIERS[run.tier||2];
            return <button key={run.id} onClick={()=>{setActiveRun(run);setView("research");}} style={{...css.card,padding:20,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#333333"} onMouseLeave={e=>e.currentTarget.style.borderColor="#222222"}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14,fontWeight:700,color:"#ffffff"}}>{run.name}</span><span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:10,background:t.badgeBg,color:t.badgeColor,border:`1px solid ${t.badgeBorder}`}}>T{run.tier||2}</span></div>
                <span style={{fontSize:11,color:"#444444",flexShrink:0,marginLeft:8}}>{run.createdAt}</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}><Pill label="Geo" value={`${run.geo.country}${run.geo.cities?.length?", "+run.geo.cities[0]:""}`}/>{run.industry&&<Pill label="Industry" value={run.industry}/>}<Pill label="Age" value={`${run.persona.ageMin}–${run.persona.ageMax}`}/>{run.results?.archetypes&&<Pill label="Archetypes" value={`${run.results.archetypes.length}`}/>}</div>
            </button>;
          })}
        </div>}
      </div>
    </div>;
  }

  if(view==="newResearch") return <div style={css.page}><style>{STYLE}</style><AppHeader back={()=>setView("project")} backLabel="Project" title="New Research Run"/><ResearchForm onRun={handleRunComplete}/></div>;

  /* ── RESEARCH RESULTS ── */
  if(view==="research"&&activeRun) {
    const r=activeRun.results, tierCfg=TIERS[activeRun.tier||2];
    return <div style={css.page}><style>{STYLE}</style><Toast toast={toast}/>
      <AppHeader back={()=>setView("project")} backLabel="Project" title={activeRun.name} right={<><GhostBtn onClick={()=>triggerPDF(activeRun,activeProj)}>🖨 PDF</GhostBtn><PrimaryBtn onClick={()=>setView("newResearch")} style={{padding:"8px 18px",fontSize:13}}>+ New Run</PrimaryBtn></>}/>
      <div style={{maxWidth:680,margin:"0 auto",padding:"32px 24px"}}>
        {/* Run header */}
        <div style={{marginBottom:24}}>
          <h2 style={{fontSize:28,fontWeight:900,letterSpacing:"-1px",color:"#ffffff",marginBottom:8,lineHeight:1.1}}>{activeRun.name}<span style={{color:"#FF9500"}}>.</span></h2>
          <div style={{marginBottom:10}}><TierBadge tier={activeRun.tier}/></div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}><Pill label="Geo" value={`${activeRun.geo.country}${activeRun.geo.cities?.length?", "+activeRun.geo.cities[0]:""}`}/>{activeRun.industry&&<Pill label="Industry" value={activeRun.industry}/>}<Pill label="Age" value={`${activeRun.persona.ageMin}–${activeRun.persona.ageMax}`}/><Pill label="Income" value={activeRun.persona.incomeLevel}/>{activeRun.numberOfPeople&&<Pill label="Audience" value={Number(activeRun.numberOfPeople).toLocaleString()}/>}</div>
        </div>
        <ProviderBadges providers={r.dataProviders||[]}/>
        {activeRun.tier===3&&<VerifiedStatsPanel stats={r.verifiedStats||[]} worldBankRaw={activeRun.verifiedData?.worldBank}/>}
        {activeRun.tier>=2&&<SourcesStrip sources={r.searchedSources||[]}/>}
        <CollapsibleSection icon="🎭" title="Consumer Archetypes" badge={`${(r.archetypes||[]).length} detected`}>
          {(r.archetypes||[]).map((a,i)=>{const c=ARCH_COLORS[i%8],pct=a.sharePercent||0;return <div key={i} style={{background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:14,padding:20,marginBottom:12,borderLeft:`3px solid ${c}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{width:28,height:28,background:c,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#000",flexShrink:0}}>{i+1}</div><span style={{fontSize:14,fontWeight:700,color:"#ffffff",flex:1}}>{a.name}</span><span style={{fontSize:13,fontWeight:700,color:c}}>{pct}%</span></div>
            <div style={{height:3,background:"#1a1a1a",borderRadius:2,marginBottom:12}}><div style={{height:3,background:c,borderRadius:2,width:`${pct}%`}}/></div>
            <p style={{fontSize:13,color:"#888888",lineHeight:1.7,marginBottom:12}}>{a.description}</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(a.traits||[]).map((t,j)=><span key={j} style={{fontSize:10,background:`${c}15`,border:`1px solid ${c}30`,borderRadius:10,padding:"2px 10px",color:c,fontWeight:500}}>{t}</span>)}</div>
          </div>;})}
        </CollapsibleSection>
        <CollapsibleSection icon="🔍" title="Insights"><p style={{fontSize:13,color:"#888888",lineHeight:1.85}}>{r.insights}</p></CollapsibleSection>
        <CollapsibleSection icon="🚀" title="Opportunities"><p style={{fontSize:13,color:"#888888",lineHeight:1.85}}>{r.opportunities}</p></CollapsibleSection>
        <CollapsibleSection icon="💡" title="Solutions"><p style={{fontSize:13,color:"#888888",lineHeight:1.85}}>{r.solutions}</p></CollapsibleSection>
        <button onClick={()=>triggerPDF(activeRun,activeProj)} style={{width:"100%",background:"#FF9500",border:"none",borderRadius:12,padding:14,fontSize:15,fontWeight:700,color:"#000000",cursor:"pointer",fontFamily:"inherit",marginTop:8,letterSpacing:"-0.3px"}}>
          🖨 Export as PDF Presentation
        </button>
      </div>
    </div>;
  }

  return null;
}
