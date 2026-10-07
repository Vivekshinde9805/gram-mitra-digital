import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "mr" | "hi";

const dict = {
  appName: { en: "Gram Panchayat Portal", mr: "ग्रामपंचायत पोर्टल" , hi: "ग्राम पंचायत पोर्टल" },
  home: { en: "Home", mr: "मुख्यपृष्ठ" , hi: "होम" },
  dashboard: { en: "Dashboard", mr: "डॅशबोर्ड" , hi: "डैशबोर्ड" },
  services: { en: "Apply", mr: "अर्ज करा" , hi: "आवेदन करें" },
  applications: { en: "My Applications", mr: "माझे अर्ज" , hi: "मेरे आवेदन" },
  taxes: { en: "Taxes & Payments", mr: "कर व भरणा" , hi: "कर और भुगतान" },
  complaints: { en: "Complaints", mr: "तक्रारी" , hi: "शिकायतें" },
  assistant: { en: "AI Assistant", mr: "AI सहाय्यक" , hi: "AI सहायक" },
  profile: { en: "Profile", mr: "प्रोफाइल" , hi: "प्रोफ़ाइल" },
  admin: { en: "Admin", mr: "प्रशासन" , hi: "प्रशासन" },
  login: { en: "Sign in", mr: "लॉगिन" , hi: "लॉगिन" },
  logout: { en: "Sign out", mr: "बाहेर पडा" , hi: "लॉग आउट" },
  signup: { en: "Create account", mr: "खाते तयार करा" , hi: "खाता बनाएं" },
  email: { en: "Email", mr: "ईमेल" , hi: "ईमेल" },
  password: { en: "Password", mr: "पासवर्ड" , hi: "पासवर्ड" },
  fullName: { en: "Full name", mr: "पूर्ण नाव" , hi: "पूरा नाम" },
  village: { en: "Village", mr: "गाव" , hi: "गाँव" },
  mobile: { en: "Mobile number", mr: "मोबाईल क्रमांक" , hi: "मोबाइल नंबर" },
  address: { en: "Address", mr: "पत्ता" , hi: "पता" },
  save: { en: "Save", mr: "जतन करा" , hi: "सहेजें" },
  submit: { en: "Submit", mr: "सादर करा" , hi: "जमा करें" },
  status: { en: "Status", mr: "स्थिती" , hi: "स्थिति" },
  date: { en: "Date", mr: "दिनांक" , hi: "तारीख" },
  description: { en: "Description", mr: "वर्णन" , hi: "विवरण" },
  documents: { en: "Documents", mr: "कागदपत्रे" , hi: "दस्तावेज़" },
  notices: { en: "Notices", mr: "सूचना" , hi: "सूचनाएं" },
  members: { en: "Panchayat Members", mr: "पंचायत सदस्य" , hi: "पंचायत सदस्य" },
  contact: { en: "Contact", mr: "संपर्क" , hi: "संपर्क" },
  population: { en: "Population", mr: "लोकसंख्या" , hi: "जनसंख्या" },
  households: { en: "Households", mr: "कुटुंबे" , hi: "परिवार" },
  area: { en: "Area (sq km)", mr: "क्षेत्रफळ (चौ.कि.मी.)" , hi: "क्षेत्रफल (वर्ग कि.मी.)" },
  heroTitle: { en: "Village services, now at your doorstep", mr: "गावाच्या सेवा, आता तुमच्या दारी" , hi: "गाँव की सेवाएं, अब आपके द्वार" },
  heroSub: {
    en: "Apply for water and electricity connections, pay taxes, track applications and raise complaints — online, in English or Marathi.",
    mr: "पाणी व वीज जोडणीसाठी अर्ज करा, कर भरा, अर्जाची स्थिती पहा आणि तक्रार नोंदवा — ऑनलाइन, मराठी किंवा इंग्रजीत.",
  },
  getStarted: { en: "Get started", mr: "सुरुवात करा" , hi: "शुरू करें" },
  pending: { en: "Pending", mr: "प्रलंबित" , hi: "लंबित" },
  in_review: { en: "In review", mr: "तपासणीत" , hi: "जाँच में" },
  approved: { en: "Approved", mr: "मंजूर" , hi: "स्वीकृत" },
  rejected: { en: "Rejected", mr: "नामंजूर" , hi: "अस्वीकृत" },
  completed: { en: "Completed", mr: "पूर्ण" , hi: "पूर्ण" },
  paid: { en: "Paid", mr: "भरले" , hi: "भुगतान हुआ" },
  unpaid: { en: "Unpaid", mr: "बाकी" , hi: "बकाया" },
  verifying: { en: "Verifying", mr: "पडताळणी सुरू" , hi: "सत्यापन जारी" },
  adminLogin: { en: "Admin login", mr: "प्रशासक लॉगिन" , hi: "प्रशासक लॉगिन" },
  payUpi: { en: "Pay via UPI", mr: "UPI ने भरा" , hi: "UPI से भरें" },
  payNow: { en: "Pay now", mr: "आता भरा" , hi: "अभी भरें" },
  water: { en: "Water Connection", mr: "पाणी जोडणी" , hi: "पानी कनेक्शन" },
  electricity: { en: "Electricity Connection", mr: "वीज जोडणी" , hi: "बिजली कनेक्शन" },
  birth: { en: "Birth Certificate", mr: "जन्म दाखला" , hi: "जन्म प्रमाणपत्र" },
  residence: { en: "Residence Certificate", mr: "रहिवासी दाखला" , hi: "निवास प्रमाणपत्र" },
  noRecords: { en: "No records yet.", mr: "अद्याप नोंदी नाहीत." , hi: "अभी कोई रिकॉर्ड नहीं।" },
  refNo: { en: "Reference no.", mr: "संदर्भ क्र." , hi: "संदर्भ सं." },
  remark: { en: "Remark", mr: "शेरा" , hi: "टिप्पणी" },
  welcome: { en: "Welcome", mr: "स्वागत" , hi: "स्वागत है" },
  citizen: { en: "Citizen Home", mr: "नागरिक मुख्यपृष्ठ", hi: "नागरिक होम" },
  connections: { en: "Connections", mr: "जोडण्या", hi: "कनेक्शन" },
  payments: { en: "Payments", mr: "भरणा", hi: "भुगतान" },
  settings: { en: "Settings", mr: "सेटिंग्ज", hi: "सेटिंग्स" },
  addWater: { en: "Add Water Connection", mr: "पाणी जोडणी जोडा", hi: "पानी कनेक्शन जोड़ें" },
  addElec: { en: "Add Electricity Bill Number", mr: "वीज बिल क्रमांक जोडा", hi: "बिजली बिल नंबर जोड़ें" },
  connNo: { en: "Connection / consumer no.", mr: "जोडणी / ग्राहक क्र.", hi: "कनेक्शन / उपभोक्ता सं." },
  meterNo: { en: "Meter no. (optional)", mr: "मीटर क्र. (ऐच्छिक)", hi: "मीटर सं. (वैकल्पिक)" },
  add: { en: "Add", mr: "जोडा", hi: "जोड़ें" },
  duplicateConn: { en: "This connection number is already registered.", mr: "हा जोडणी क्रमांक आधीच नोंदलेला आहे.", hi: "यह कनेक्शन नंबर पहले से पंजीकृत है।" },
  Pending: { en: "Pending verification", mr: "पडताळणी प्रलंबित", hi: "सत्यापन लंबित" },
  Verified: { en: "Verified", mr: "पडताळलेले", hi: "सत्यापित" },
  Unpaid: { en: "Unpaid", mr: "बाकी", hi: "बकाया" },
  Paid: { en: "Paid", mr: "भरले", hi: "भुगतान हुआ" },
  Overdue: { en: "Overdue", mr: "मुदत संपली", hi: "अतिदेय" },
  currentDue: { en: "Current month due", mr: "चालू महिन्याची थकबाकी", hi: "इस महीने देय" },
  totalPending: { en: "Total pending", mr: "एकूण बाकी", hi: "कुल बकाया" },
  month: { en: "Month", mr: "महिना", hi: "महीना" },
  units: { en: "Units", mr: "युनिट", hi: "यूनिट" },
  amount: { en: "Amount", mr: "रक्कम", hi: "राशि" },
  dueDate: { en: "Due date", mr: "देय दिनांक", hi: "देय तिथि" },
  pay: { en: "Pay", mr: "भरा", hi: "भरें" },
  noConnections: { en: "No connections added yet.", mr: "अद्याप जोडणी जोडलेली नाही.", hi: "अभी कोई कनेक्शन नहीं जोड़ा गया।" },
  noBills: { en: "No bills yet.", mr: "अद्याप बिल नाहीत.", hi: "अभी कोई बिल नहीं।" },
  verify: { en: "Verify", mr: "पडताळा", hi: "सत्यापित करें" },
  approve: { en: "Approve", mr: "मंजूर करा", hi: "स्वीकृत करें" },
  reject: { en: "Reject", mr: "नाकारा", hi: "अस्वीकार करें" },
  exportCsv: { en: "Export CSV", mr: "CSV डाउनलोड", hi: "CSV निर्यात" },
  search: { en: "Search name or mobile", mr: "नाव किंवा मोबाईल शोधा", hi: "नाम या मोबाइल खोजें" },
  all: { en: "All", mr: "सर्व", hi: "सभी" },
  type: { en: "Type", mr: "प्रकार", hi: "प्रकार" },
  addBill: { en: "Add monthly bill", mr: "मासिक बिल जोडा", hi: "मासिक बिल जोड़ें" },
  upiId: { en: "UPI ID", mr: "UPI आयडी", hi: "UPI आईडी" },
  utr: { en: "UPI transaction no.", mr: "UPI व्यवहार क्र.", hi: "UPI लेन-देन सं." },
  notAdmin: { en: "This account does not have admin access.", mr: "या खात्याला प्रशासक प्रवेश नाही.", hi: "इस खाते को प्रशासक पहुँच नहीं है।" },
  saved: { en: "Saved", mr: "जतन झाले", hi: "सहेजा गया" },
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
    if (saved === "mr" || saved === "en" || saved === "hi") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("gp-lang", l);
    document.documentElement.lang = l;
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => (dict[k] as Record<string, string>)[lang] ?? dict[k].en }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
