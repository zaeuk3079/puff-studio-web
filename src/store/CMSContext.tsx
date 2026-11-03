import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface NukiImageConfig {
  url: string;
  left: number; // 0 ~ 100 (%)
  top: number;  // 0 ~ 100 (%)
  size: number; // width in px (e.g. 50 ~ 300)
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  gallery?: string[];
  videoUrl?: string;
  videoAspectRatio?: '16:9' | '9:16';
  description: string;
  isPinned?: boolean;
  objectPosition?: 'top' | 'center' | 'bottom';
}

export interface ProcessStep {
  id: string;
  stepNumber: string;
  title: string;
  desc1: string;
  desc2: string;
  image: string;
}

export interface ServicePlan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  features: string[];
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
}

export interface ContactPackage {
  id: string;
  name: string;
  price: string;
  duration?: string;
  tagline: string;
  description: string;
  features: string[];
  highlight?: boolean;
  featuresFirst?: boolean;
}

export interface ContactPolicyGroup {
  id: string;
  title: string;
  items: string[];
}

export interface SiteSettings {
  siteName: string;
  logoUrl?: string;
  servicePlans?: ServicePlan[];
  // Home
  heroText: string;
  heroSubText: string;
  heroDescription?: string;
  heroDescriptionFontSize?: number;
  heroDescriptionLetterSpacing?: number;
  heroDescriptionFontFamily?: string;
  heroDescriptionColor?: string;
  heroCtaText?: string;
  heroCtaLink?: string;
  heroCtaTextColor?: string;
  heroImage: string;
  heroImages?: string[];
  heroAspectRatio?: '3:2' | '16:9' | '4:3' | string;
  heroObjectPosition?: 'top' | 'center' | 'bottom' | string;
  heroTextFontSize?: number;
  heroTextLetterSpacing?: number;
  heroTextFontFamily?: string;
  heroTextColor?: string;
  heroTextX?: number;
  heroTextY?: number;
  heroSubTextFontSize?: number;
  heroSubTextLetterSpacing?: number;
  heroSubTextFontFamily?: string;
  heroSubTextColor?: string;
  heroTextAlign?: 'left' | 'center' | 'right' | string;
  heroNukiImages?: string[];
  heroNukiConfigs?: NukiImageConfig[];
  homePortfolioTitle: string;
  homePortfolioTitleLetterSpacing?: number;
  homePortfolioTitleFontSize?: number;
  homePortfolioTitleFontFamily?: string;
  homePortfolioTitleColor?: string;
  homePortfolioSubText?: string;
  homePortfolioSubTextFontSize?: number;
  homePortfolioSubTextLetterSpacing?: number;
  homePortfolioSubTextColor?: string;
  // About
  aboutTitle: string;
  aboutSubText: string;
  aboutText: string;
  aboutText2: string;
  aboutText3: string;
  aboutImage: string;
  aboutTextFontSize?: number;
  aboutTextLetterSpacing?: number;
  aboutTextFontFamily?: string;
  aboutTextAlign?: 'left' | 'center' | 'right' | string;
  aboutTextColor?: string;
  aboutTextX?: number;
  aboutTextY?: number;
  aboutBodyFontSize?: number;
  aboutBodyLetterSpacing?: number;
  aboutBodyTextColor?: string;
  // Service
  serviceTitle: string;
  serviceSubText: string;
  serviceText: string;
  serviceText2: string;
  serviceImage: string;
  serviceTextFontSize?: number;
  serviceTextLetterSpacing?: number;
  serviceTextFontFamily?: string;
  serviceTextAlign?: 'left' | 'center' | 'right' | string;
  serviceTextColor?: string;
  serviceTextX?: number;
  serviceTextY?: number;
  serviceProcessTitle?: string;
  serviceProcessSteps?: ProcessStep[];
  // Philosophy
  showPhilosophy: boolean;
  philosophyTitle: string;
  philosophyItem1: string;
  philosophyItem2: string;
  philosophyItem3: string;
  // Contact
  contactTitle: string;
  contactSubText: string;
  contactMessageTitle: string;
  contactFormTitle?: string;
  contactFormDescription?: string;
  contactFormButtonText?: string;
  contactPackages?: ContactPackage[];
  contactPolicyGroups?: ContactPolicyGroup[];
  contactEmail: string;
  contactPhone: string;
  instagramUrl: string;
  kakaoChannelUrl?: string;
  googleFormUrl: string;
  formDownloadUrl: string;
  web3FormsKey?: string;
  contactTextFontSize?: number;
  contactTextLetterSpacing?: number;
  contactBgColor?: string;
  contactTextFontFamily?: string;
  contactTextAlign?: 'left' | 'center' | 'right' | string;
  contactTextColor?: string;
  contactTextX?: number;
  contactTextY?: number;
  contactMessagePlaceholder?: string;
  // Appearance
  themeColor: string; // 'ivory' or other
  accentColor: string; // 'burgundy' or other
  headingFont: string;
  bodyFont: string;
  // Footer
  footerTitle: string;
  footerText: string;
}

interface CMSContextType {
  portfolio: PortfolioItem[];
  settings: SiteSettings;
  addPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
  updatePortfolioItem: (id: string, item: Partial<PortfolioItem>) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  reorderPortfolio: (newPortfolio: PortfolioItem[]) => Promise<void>;
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  getGalleryImages: (id: string) => Promise<string[]>;
}

const defaultPortfolio: PortfolioItem[] = [
  {
    id: '1',
    title: 'Commercial Product Shot',
    category: 'PRODUCT',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop',
    description: '브랜드의 가치를 높이는 상업 사진.',
  },
  {
    id: '2',
    title: 'Gourmet Food Photography',
    category: 'FOOD&BEVERAGE',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop',
    description: '맛과 향을 시각적으로 담아냅니다.',
  },
  {
    id: '3',
    title: 'Fashion Model Profile',
    category: 'MODEL',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop',
    description: '인물의 고유한 매력을 포착합니다.',
  },
  {
    id: '4',
    title: 'Cinematic Video Work',
    category: 'Video',
    imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: '감각적인 영상미를 선사합니다.',
  }
];

const defaultSettings: SiteSettings = {
  siteName: 'puff studio',
  logoUrl: '',
  // Home
  heroText: 'PUFF STUDIO',
  heroSubText: '상업 포토그래피 & 미디어 영상 제작',
  heroDescription: 'puff studio는 브랜드와 사람의 가장 빛나는 순간을 기록하는 상업 포토그래피 · 영상 제작 스튜디오입니다. 기획부터 촬영, 리터칭까지 하나의 흐름으로 이어지는 원스톱 프로세스로, 시간이 흘러도 변하지 않는 가치를 만들어갑니다.',
  heroDescriptionFontSize: 16,
  heroDescriptionLetterSpacing: 0,
  heroDescriptionFontFamily: 'Pretendard',
  heroDescriptionColor: '#D6D3D1',
  heroCtaText: '문의하기',
  heroCtaLink: '/contact',
  heroCtaTextColor: '#0B0C10',
  heroImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=100&w=2800&auto=format&fit=crop',
  heroImages: [],
  heroAspectRatio: '3:2',
  heroObjectPosition: 'center',
  heroTextFontSize: 42,
  heroTextLetterSpacing: 0,
  heroTextFontFamily: 'Pretendard',
  heroTextColor: '#FFFFFF',
  heroTextX: 6,
  heroTextY: 82,
  heroSubTextFontSize: 14,
  heroSubTextLetterSpacing: 1,
  heroSubTextFontFamily: 'Pretendard',
  heroSubTextColor: '#E7E5E4',
  heroTextAlign: 'left',
  heroNukiImages: [],
  heroNukiConfigs: [],
  homePortfolioTitle: 'Work',
  homePortfolioTitleLetterSpacing: -1,
  homePortfolioTitleFontSize: 48,
  homePortfolioTitleFontFamily: 'Pretendard',
  homePortfolioTitleColor: '#FFFFFF',
  homePortfolioSubText: '에이징스튜디오의 포트폴리오를 소개합니다.',
  homePortfolioSubTextFontSize: 14,
  homePortfolioSubTextLetterSpacing: 1,
  homePortfolioSubTextColor: '#A8A29E',
  // Portfolio
  portfolioTitle: 'Portfolio',
  portfolioSubText: 'Our Selected Works',
  // About
  aboutTitle: 'About Us',
  aboutSubText: 'puff studio는 당신의 가장 빛나는 순간을 기록합니다.',
  aboutText: '퍼프 스튜디오는 단순한 사진 촬영을 넘어, 당신의 이야기와 감정을 프레임 안에 담아냅니다. 수년간의 경험과 독창적인 시선으로 가장 자연스럽고 아름다운 모습을 찾아드립니다.',
  aboutText2: '우리는 모든 사람이 자신만의 고유한 아름다움을 가지고 있다고 믿습니다. 그 아름다움이 가장 자연스럽게 드러나는 찰나를 포착하여, 시간이 흘러도 변하지 않는 가치 있는 결과물로 만들어냅니다.',
  aboutText3: '단순히 셔터를 누르는 것을 넘어, 당신과 소통하고 교감하며 가장 편안한 분위기 속에서 촬영을 진행합니다. 우리의 프레임 안에서 당신의 이야기가 예술이 됩니다.',
  aboutImage: 'https://images.unsplash.com/photo-1554046920-90dcac0536d1?q=80&w=2069&auto=format&fit=crop',
  aboutTextFontSize: 42,
  aboutTextLetterSpacing: 0,
  aboutTextFontFamily: 'Pretendard',
  aboutTextAlign: 'center',
  aboutTextColor: '#1C1917',
  aboutTextX: 50,
  aboutTextY: 30,
  aboutBodyFontSize: 16,
  aboutBodyLetterSpacing: 0,
  // Service
  serviceTitle: 'Our Services',
  serviceSubText: '촬영 진행 과정 및 서비스 안내',
  serviceText: '에이징 스튜디오는 철저한 사전 기획부터 촬영, 정교한 리터칭까지 원스톱 서비스를 제공합니다. 고객의 브랜드 가치를 시각적으로 극대화하기 위해 각 단계마다 최상의 퀄리티를 지향합니다.',
  serviceText2: '진행 과정: 1. 사전 미팅 및 기획 ➡️ 2. 촬영 준비 및 소품 세팅 ➡️ 3. 본 촬영 진행 ➡️ 4. A컷 셀렉 및 전문 보정 ➡️ 5. 최종 완성본 전달',
  serviceImage: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop',
  serviceProcessTitle: 'Process',
  serviceProcessSteps: [
    {
      id: 'step_1',
      stepNumber: '01',
      title: '상담·기획',
      desc1: '24시간 안에 답장합니다.',
      desc2: '목적과 무드를 듣고 레퍼런스·세팅·견적을 제안합니다.',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'step_2',
      stepNumber: '02',
      title: '촬영',
      desc1: '역삼 스튜디오 또는 로케이션.',
      desc2: '현장에서 컷을 함께 확인하며 진행합니다.',
      image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'step_3',
      stepNumber: '03',
      title: '셀렉·리터칭',
      desc1: '정리된 컷에서 고르시면,',
      desc2: '피드백을 반영해 정성껏 보정합니다.',
      image: 'https://images.unsplash.com/photo-1554046920-90dcac0536d1?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'step_4',
      stepNumber: '04',
      title: '전달',
      desc1: '고해상도 완성본을 일정에 맞춰드립니다.',
      desc2: '',
      image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=600&auto=format&fit=crop'
    }
  ],
  serviceTextFontSize: 42,
  serviceTextLetterSpacing: 0,
  serviceTextFontFamily: 'Pretendard',
  serviceTextAlign: 'center',
  serviceTextColor: '#1C1917',
  serviceTextX: 50,
  serviceTextY: 30,
  // Philosophy
  showPhilosophy: true,
  philosophyTitle: 'Our Philosophy',
  philosophyItem1: '자연스러움: 꾸며지지 않은 본연의 모습을 담습니다.',
  philosophyItem2: '시간의 가치: 유행을 타지 않는 클래식한 아름다움을 추구합니다.',
  philosophyItem3: '소통: 고객과의 깊은 교감을 통해 최상의 결과물을 만듭니다.',
  // Contact
  contactTitle: '견적문의',
  contactSubText: '견적 및 촬영 문의',
  contactMessageTitle: "Let's Create Together",
  contactFormTitle: '상담 신청',
  contactFormDescription: '원하시는 촬영 조건과 목적을 기재해 주시면, 검토 후 이메일 또는 연락처로 신속히 안내해 드리겠습니다.',
  contactFormButtonText: '상담 신청하기',
  contactPackages: [
    {
      id: 'starter',
      name: 'AI 패키지',
      price: '390,000',
      duration: '',
      tagline: '빠른 오픈을 준비하는 1인 셀러를 위한 패키지',
      description: '실제 촬영후, 고품질 원본으로 AI 연출 이미지를 제작합니다.\n신제품을 빠르게 런칭하고싶은 분\n브랜드 컨텐츠용 AI 이미지가 필요한 분\n(제품 수령일로부터 +5일 완성)',
      features: [
        '누끼·디테일컷 촬영',
        'AI 연출 이미지 (기획에 맞춰 제작)',
        '누끼 및 AI 이미지 +5일 이내 전달',
      ],
      highlight: false,
    },
    {
      id: 'halfday',
      name: '4시간 촬영',
      price: '590,000',
      duration: '4시간',
      tagline: '4시간 동안 컨셉에 제한 없이 무제한 촬영합니다',
      description: '상세페이지용 이미지가 필요하신 분\n상세페이지는 있고 소량의 SNS컨텐츠 및 광고소재가 필요하신 분',
      features: [
        '원본 JEPG 파일 전체 제공',
      ],
      highlight: false,
    },
    {
      id: 'fullday',
      name: '8시간 촬영',
      price: '890,000',
      duration: '9시간',
      tagline: '9시간 동안 컨셉에 제한 없이 무제한 촬영합니다.\n(점심시간 1시간 포함)',
      description: '상세페이지 및 SNS컨텐츠,  광고소재용 이미지가 필요하신 분\n상세페이지는 있고 대량의 SNS컨텐츠 및 광고소재용 이미지가 필요하신 분',
      features: [
        '원본 JEPG 파일 전체 제공',
      ],
      highlight: false,
    },
    {
      id: 'per-cut',
      name: '컷 당 촬영',
      price: '',
      duration: '',
      tagline: '어디에나 사용하기 좋은 누끼사진 촬영 (보정포함)',
      description: 'AI 합성용 소스 및 디자인 소스로 누끼 이미지가 필요한 경우',
      features: [
        '일반 누끼컷 — 30,000원 (보정포함)',
        '(단상자,무광제품 등)',
        '반사체 누끼컷 — 50,000원 (보정포함)',
        '(거울,은박,유광 뚜껑 등)',
        'GIF 제작 — 50,000원 (편집포함)',
      ],
      highlight: false,
      featuresFirst: true,
    },
  ],
  contactPolicyGroups: [
    {
      id: 'retouch',
      title: '보정 & 납품',
      items: [
        '원본은 촬영 다음 날 전달됩니다',
        '정밀 보정본은 셀렉 완료일로부터 +7일 이내 전달됩니다',
        '리터칭 수정 3회까지 무료, 그 이후 50,000원 (촬영비에 포함되어 있는 리터칭 비용과 별개)',
        '촬영·보정만 제공하며, 텍스트·레이아웃 디자인은 포함되지 않습니다',
      ],
    },
    {
      id: 'booking',
      title: '예약 & 결제',
      items: [
        '계약금 50% 입금 시 예약이 확정됩니다',
        '잔금은 보정본 납품 후 7일 이내 결제해 주시면 됩니다 (세금계산서 발행 가능)',
        '촬영 7일 전까지 일정 변경·취소가 가능합니다',
      ],
    },
    {
      id: 'cost',
      title: '비용 관련',
      items: [
        '출장 촬영: 서울/경기 100,000원, 그 외 지역 협의',
        '소품·재료비는 실비로 청구드립니다 (영수증 첨부)',
        '촬영 연장은 시간당 150,000원입니다.',
        '부가세 별도',
      ],
    },
  ],
  contactEmail: 'contact@puffstudio.com',
  contactPhone: '010-1234-5678',
  instagramUrl: 'https://instagram.com/puffstudio',
  kakaoChannelUrl: '',
  googleFormUrl: 'https://docs.google.com/forms',
  formDownloadUrl: '#',
  web3FormsKey: '2ad41e7e-6c9c-4c9b-b14a-d160b8fc15bf',
  contactTextFontSize: 42,
  contactTextLetterSpacing: 0,
  contactTextFontFamily: 'Pretendard',
  contactTextAlign: 'center',
  contactTextColor: '#FFFFFF',
  contactTextX: 50,
  contactTextY: 20,
  contactMessagePlaceholder: "원하는 컨셉과 무드 필요한 예상 컷 수 또는 영상 갯수를 적어주세요.\n상담희망 하시는 경우 '상담희망'이라고 기입해주세요",
  contactBgColor: '#0B0C10',
  servicePlans: [
    {
      id: 'basic',
      name: 'Basic',
      badge: '기본 플랜',
      description: '브랜드 스타트업을 위한 핵심 상세페이지 제작 플랜',
      features: ['상세페이지']
    },
    {
      id: 'standard',
      name: 'Standard',
      badge: '인기 패키지',
      description: '상세페이지와 SNS 마케팅 브랜드 컨텐츠 종합 패키지',
      features: ['상세페이지', 'SNS컨텐츠']
    },
    {
      id: 'premium',
      name: 'Premium',
      badge: '올인원 프리미엄',
      description: '상세페이지부터 SNS, 퍼포먼스 광고용 컨텐츠까지 완벽 포함',
      features: ['상세페이지', 'SNS컨텐츠', '광고용 컨텐츠']
    },
    {
      id: 'subscription',
      name: '월 단위 구독제',
      badge: 'Monthly 정기구독',
      description: '지속적인 브랜드 마케팅을 위한 월 정기 구독형 컨텐츠 제작',
      features: ['월별 SNS컨텐츠', '월 9개 컨텐츠 (사진/영상 비율 조정가능)']
    },
    {
      id: 'extra',
      name: '그 외 촬영',
      badge: '별도 문의',
      description: '카페, 식당 메뉴, 굿즈, 인테리어 촬영 등 건별 맞춤 촬영',
      features: ['카페 · 식당 메뉴', '굿즈 · 인테리어 촬영 등']
    }
  ],
  // Appearance
  themeColor: 'ivory',
  accentColor: 'burgundy',
  headingFont: 'Pretendard',
  bodyFont: 'Pretendard',
  // Footer
  footerTitle: 'puff studio',
  footerText: '당신의 가장 빛나는 순간을 기록합니다. 시간이 흘러도 변하지 않는 가치를 선사합니다.',
};

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export function CMSProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(defaultPortfolio);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Firebase & listen to real-time changes
  useEffect(() => {
    // 1. Initial local storage check for instant render
    const cachedSettings = localStorage.getItem('ac_studio_settings');
    if (cachedSettings) {
      try {
        setSettings(JSON.parse(cachedSettings));
      } catch (e) {}
    }

    // 2. Real-time Firebase Settings Listener
    // Firestore is the single source of truth for every visitor. localStorage is only used
    // above for an instant first paint before this listener's first callback arrives — once
    // real data is fetched, it must always win, otherwise a device that cached settings once
    // (e.g. a phone that visited before an admin update) would keep showing stale content
    // forever, out of sync with every other visitor and with what the admin just published.
    const unsubscribeSettings = onSnapshot(
      doc(db, 'settings', 'main'),
      (docSnap) => {
        if (docSnap.exists()) {
          const fetched = docSnap.data() as SiteSettings;

          const mergedSteps = (fetched.serviceProcessSteps && fetched.serviceProcessSteps.length > 0)
            ? fetched.serviceProcessSteps
            : defaultSettings.serviceProcessSteps;

          const mergedServicePlans = (fetched.servicePlans && fetched.servicePlans.length >= 5)
            ? fetched.servicePlans
            : defaultSettings.servicePlans;

          const merged: SiteSettings = {
            ...defaultSettings,
            ...fetched,
            serviceProcessSteps: mergedSteps,
            heroImages: [],
            servicePlans: mergedServicePlans
          };
          setSettings(merged);
          localStorage.setItem('ac_studio_settings', JSON.stringify(merged));
        } else {
          // The settings document genuinely doesn't exist yet (brand new project).
          // Render placeholder defaults locally, but never auto-write them to Firestore:
          // onSnapshot can report a false "document does not exist" during a transient
          // network hiccup, and blindly persisting defaultSettings here would silently
          // overwrite real admin-configured content for every visitor on every domain.
          // The admin Settings page is the only path that should ever create this doc.
          setSettings(defaultSettings);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Firebase settings onSnapshot error:", error);
        setIsLoading(false);
      }
    );

    // 3. Load Portfolio
    const loadPortfolio = async () => {
      try {
        const portfolioCollection = collection(db, 'portfolio');
        const portfolioSnapshot = await getDocs(portfolioCollection);
        
        if (!portfolioSnapshot.empty) {
          const loadedPortfolio = portfolioSnapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          })) as PortfolioItem[];
          
          loadedPortfolio.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            const orderA = (a as any).orderIndex ?? 9999;
            const orderB = (b as any).orderIndex ?? 9999;
            return orderA - orderB;
          });
          
          setPortfolio(loadedPortfolio);
        } else {
          // The portfolio collection genuinely has no items yet (brand new project).
          // Render placeholder items locally, but never auto-write them to Firestore:
          // a transient read glitch reporting an empty snapshot must not silently
          // seed (or re-seed) placeholder items into real admin-managed data.
          setPortfolio(defaultPortfolio);
        }
      } catch (error) {
        console.error("Error loading portfolio:", error);
      }
    };

    loadPortfolio();

    return () => {
      unsubscribeSettings();
    };
  }, []);

  const addPortfolioItem = async (item: Omit<PortfolioItem, 'id'>) => {
    const newId = Date.now().toString();
    const { gallery, ...rest } = item;
    const newItem = { ...rest, id: newId, orderIndex: 0 };
    
    setPortfolio(prev => {
      const newPortfolio = [{ ...item, id: newId }, ...prev];
      return newPortfolio.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const orderA = (a as any).orderIndex ?? 9999;
        const orderB = (b as any).orderIndex ?? 9999;
        return orderA - orderB;
      });
    });
    
    try {
      const { writeBatch, collection, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      batch.set(doc(db, 'portfolio', newId), newItem);
      
      if (gallery && gallery.length > 0) {
        gallery.forEach((img, idx) => {
          const galleryDocRef = doc(collection(db, 'portfolio', newId, 'gallery'));
          batch.set(galleryDocRef, { url: img, order: idx });
        });
      }
      
      portfolio.forEach((p, idx) => {
        batch.update(doc(db, 'portfolio', p.id), { orderIndex: idx + 1 });
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error adding portfolio item:", error);
      alert("항목 추가에 실패했습니다.");
      setPortfolio(prev => prev.filter(p => p.id !== newId));
    }
  };

  const updatePortfolioItem = async (id: string, updatedItem: Partial<PortfolioItem>) => {
    const originalPortfolio = [...portfolio];
    const { gallery, ...rest } = updatedItem;

    const existing = portfolio.find(item => item.id === id);
    const preservedIsPinned = updatedItem.isPinned ?? existing?.isPinned ?? false;
    const pinChanged = 'isPinned' in updatedItem && updatedItem.isPinned !== existing?.isPinned;

    // Only reorder when the pin status actually changes (e.g. toggling "메인 상단 고정").
    // A plain field edit (title, description, 대표 이미지 등) must never silently move the
    // item's position — some legacy items lack an explicit orderIndex in Firestore, and
    // falling back to a default there used to bump them to the end of the list on every save.
    const nextPortfolio = portfolio.map(item =>
      item.id === id ? { ...item, ...updatedItem, isPinned: preservedIsPinned } : item
    );
    const sortedPortfolio = pinChanged
      ? [...nextPortfolio].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0; // stable sort keeps relative order within each pinned/unpinned group
        })
      : nextPortfolio;

    const preservedOrderIndex = sortedPortfolio.findIndex(item => item.id === id);

    const updatedDataToSave = {
      ...rest,
      orderIndex: preservedOrderIndex,
      isPinned: preservedIsPinned
    };

    setPortfolio(sortedPortfolio);

    try {
      const { writeBatch, collection, getDocs, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);

      batch.update(doc(db, 'portfolio', id), updatedDataToSave);

      // Normalize orderIndex on every save so items that never had one stop drifting
      // to the bottom of the list on unrelated edits — the whole list is re-pinned to
      // match exactly what's currently on screen.
      sortedPortfolio.forEach((item, idx) => {
        if (item.id !== id) {
          batch.update(doc(db, 'portfolio', item.id), { orderIndex: idx });
        }
      });

      if (gallery) {
        const gallerySnap = await getDocs(collection(db, 'portfolio', id, 'gallery'));
        gallerySnap.forEach((d) => {
          batch.delete(d.ref);
        });
        
        gallery.forEach((img, idx) => {
          const galleryDocRef = doc(collection(db, 'portfolio', id, 'gallery'));
          batch.set(galleryDocRef, { url: img, order: idx });
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      alert("항목 수정에 실패했습니다.");
      setPortfolio(originalPortfolio);
    }
  };

  const getGalleryImages = async (id: string): Promise<string[]> => {
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const galleryRef = collection(db, 'portfolio', id, 'gallery');
      const q = query(galleryRef, orderBy('order'));
      const snap = await getDocs(q);
      
      if (snap.empty) return [];
      return snap.docs.map(doc => doc.data().url);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      return [];
    }
  };

  const deletePortfolioItem = async (id: string) => {
    // Update local state
    setPortfolio(portfolio.filter(item => item.id !== id));
    
    // Save to Firebase (Note: we need deleteDoc for this, adding it to imports)
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'portfolio', id));
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
    }
  };

  const reorderPortfolio = async (newPortfolio: PortfolioItem[]) => {
    // Update local state
    setPortfolio(newPortfolio);
    
    // Save new order to Firebase (This is a simplified approach. 
    // For robust ordering, you'd typically add an 'order' field to each document)
    try {
      // In a real app, you'd update an 'order' field on each document.
      // For this simple version, we'll just rely on the local state 
      // and let the user know reordering might not persist perfectly without an order field.
      // To properly persist order, we would need to batch update all documents with a new index.
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      newPortfolio.forEach((item, index) => {
        const docRef = doc(db, 'portfolio', item.id);
        batch.update(docRef, { orderIndex: index });
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error reordering portfolio:", error);
    }
  };

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = { ...settings, ...newSettings };
    // 1. Instant UI State update
    setSettings(updated);
    
    // 2. Safe LocalStorage Cache with Quota Exceeded Safeguard
    try {
      localStorage.setItem('ac_studio_settings', JSON.stringify(updated));
    } catch (e) {
      console.warn("LocalStorage quota safeguard activated:", e);
    }
    
    // 3. Cloud Firestore Direct Persistence
    try {
      await setDoc(doc(db, 'settings', 'main'), updated, { merge: true });
    } catch (error) {
      console.error("Firebase settings save failed:", error);
      // Re-throw so callers (e.g. the admin Save button) can detect the failure
      // instead of assuming success just because the local/optimistic state updated.
      throw error;
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="w-8 h-8 border-4 border-burgundy-800 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <CMSContext.Provider value={{ portfolio, settings, addPortfolioItem, updatePortfolioItem, deletePortfolioItem, reorderPortfolio, updateSettings, getGalleryImages }}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (context === undefined) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
}
