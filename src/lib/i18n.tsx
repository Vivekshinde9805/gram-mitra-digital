import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "mr";

const dict = {
  appName: { en: "Gram Panchayat Portal", mr: "ग्रामपंचायत पोर्टल" },
  home: { en: "Home", mr: "मुख्यपृष्ठ" },
  dashboard: { en: "Dashboard", mr: "डॅशबोर्ड" },
  services: { en: "Apply", mr: "अर्ज करा" },
  applications: { en: "My Applications", mr: "माझे अर्ज" },
  taxes: { en: "Taxes & Payments", mr: "कर व भरणा" },
  complaints: { en: "Complaints", mr: "तक्रारी" },
  assistant: { en: "AI Assistant", mr: "AI सहाय्यक" },
  profile: { en: "Profile", mr: "प्रोफाइल" },
  admin: { en: "Admin", mr: "प्रशासन" },
  login: { en: "Sign in", mr: "लॉगिन" },
  logout: { en: "Sign out", mr: "बाहेर पडा" },
  signup: { en: "Create account", mr: "खाते तयार करा" },
  email: { en: "Email", mr: "ईमेल" },
  password: { en: "Password", mr: "पासवर्ड" },
  fullName: { en: "Full name", mr: "पूर्ण नाव" },
  village: { en: "Village", mr: "गाव" },
  mobile: { en: "Mobile number", mr: "मोबाईल क्रमांक" },
  address: { en: "Address", mr: "पत्ता" },
  save: { en: "Save", mr: "जतन करा" },
  submit: { en: "Submit", mr: "सादर करा" },
  status: { en: "Status", mr: "स्थिती" },
  date: { en: "Date", mr: "दिनांक" },
  description: { en: "Description", mr: "वर्णन" },
  documents: { en: "Documents", mr: "कागदपत्रे" },
  notices: { en: "Notices", mr: "सूचना" },
  members: { en: "Panchayat Members", mr: "पंचायत सदस्य" },
  contact: { en: "Contact", mr: "संपर्क" },
  population: { en: "Population", mr: "लोकसंख्या" },
  households: { en: "Households", mr: "कुटुंबे" },
  area: { en: "Area (sq km)", mr: "क्षेत्रफळ (चौ.कि.मी.)" },
  heroTitle: { en: "Village services, now at your doorstep", mr: "गावाच्या सेवा, आता तुमच्या दारी" },
  heroSub: {
    en: "Apply for water and electricity connections, pay taxes, track applications and raise complaints — online, in English or Marathi.",
    mr: "पाणी व वीज जोडणीसाठी अर्ज करा, कर भरा, अर्जाची स्थिती पहा आणि तक्रार नोंदवा — ऑनलाइन, मराठी किंवा इंग्रजीत.",
  },
  getStarted: { en: "Get started", mr: "सुरुवात करा" },
  pending: { en: "Pending", mr: "प्रलंबित" },
  in_review: { en: "In review", mr: "तपासणीत" },
  approved: { en: "Approved", mr: "मंजूर" },
  rejected: { en: "Rejected", mr: "नामंजूर" },
  completed: { en: "Completed", mr: "पूर्ण" },
  paid: { en: "Paid", mr: "भरले" },
  unpaid: { en: "Unpaid", mr: "बाकी" },
  payNow: { en: "Pay now", mr: "आता भरा" },
  water: { en: "Water Connection", mr: "पाणी जोडणी" },
  electricity: { en: "Electricity Connection", mr: "वीज जोडणी" },
  birth: { en: "Birth Certificate", mr: "जन्म दाखला" },
  residence: { en: "Residence Certificate", mr: "रहिवासी दाखला" },
  noRecords: { en: "No records yet.", mr: "अद्याप नोंदी नाहीत." },
  refNo: { en: "Reference no.", mr: "संदर्भ क्र." },
  remark: { en: "Remark", mr: "शेरा" },
  welcome: { en: "Welcome", mr: "स्वागत" },
} as const;

export type TKey = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("gp-lang");
    if (saved === "mr" || saved === "en") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("gp-lang", l);
    document.documentElement.lang = l;
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang] }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
