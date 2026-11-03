import React, { useState, useRef, useEffect } from 'react';
import { useCMS, SiteSettings, ContactPackage, ContactPolicyGroup } from '../../store/CMSContext';
import { motion } from 'motion/react';
import { Save, Home, Image as ImageIcon, Phone, Palette, Download, Globe, Move, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { compressImage, compressBase64String, uploadImageToCloudCDN } from '../../utils/imageUtils';

const DEFAULT_CONTACT_PACKAGES: ContactPackage[] = [
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
];

const DEFAULT_POLICY_GROUPS: ContactPolicyGroup[] = [
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
];

export default function Settings() {
  const { settings, updateSettings } = useCMS();
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const getByteSizeKB = (str?: string) => {
    if (!str) return '0 KB';
    const bytes = new Blob([str]).size;
    const kb = Math.round(bytes / 1024);
    if (kb > 500) {
      return `${kb} KB (⚠️ 용량 큼)`;
    }
    return `${kb} KB (안전)`;
  };
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const bannerContainerRef = useRef<HTMLDivElement>(null);
  const aboutCanvasRef = useRef<HTMLDivElement>(null);
  const serviceCanvasRef = useRef<HTMLDivElement>(null);
  const contactCanvasRef = useRef<HTMLDivElement>(null);
  
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [activeSnapX, setActiveSnapX] = useState(false);
  const [activeSnapY, setActiveSnapY] = useState(false);

  const applySnap = (valPct: number) => {
    // Magnetic Snap Tolerance (snaps to 50% if within 47.5% ~ 52.5%)
    if (Math.abs(valPct - 50) < 3.2) {
      return { val: 50, snapped: true };
    }
    return { val: valPct, snapped: false };
  };

  const handleBannerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingText(true);
    updateDragPosition(e.clientX, e.clientY);
  };

  const handleBannerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingText) return;
    updateDragPosition(e.clientX, e.clientY);
  };

  const handleBannerMouseUp = () => {
    setIsDraggingText(false);
    setActiveSnapX(false);
    setActiveSnapY(false);
  };

  const updateDragPosition = (clientX: number, clientY: number) => {
    if (!bannerContainerRef.current) return;
    const rect = bannerContainerRef.current.getBoundingClientRect();
    const rawX = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const rawY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    const snapX = applySnap(rawX);
    const snapY = applySnap(rawY);

    setActiveSnapX(snapX.snapped);
    setActiveSnapY(snapY.snapped);

    setFormData(prev => ({
      ...prev,
      heroTextX: Math.round(snapX.val),
      heroTextY: Math.round(snapY.val)
    }));
  };

  // Helper for About, Service, Contact drag canvas with magnetic snap to 50%
  const createDragHandlers = (ref: React.RefObject<HTMLDivElement>, fieldX: string, fieldY: string) => {
    return (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return;
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const rawX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const rawY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      const snapX = applySnap(rawX);
      const snapY = applySnap(rawY);

      setActiveSnapX(snapX.snapped);
      setActiveSnapY(snapY.snapped);

      setFormData(prev => ({
        ...prev,
        [fieldX]: Math.round(snapX.val),
        [fieldY]: Math.round(snapY.val)
      }));
    };
  };

  const ensureCloudUrl = async (val?: string): Promise<string> => {
    if (!val) return '';
    if (val.startsWith('data:image')) {
      try {
        const res = await fetch(val);
        const blob = await res.blob();
        const file = new File([blob], 'migrated_image.png', { type: blob.type || 'image/png' });
        const cdnUrl = await uploadImageToCloudCDN(file);
        return cdnUrl;
      } catch (err) {
        console.warn('Failed to auto-migrate base64 to Cloud CDN:', err);
        return await compressBase64String(val, 350, 0.6);
      }
    }
    return val;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Auto migrate single image fields to Cloud CDN URLs
      const logoUrlConverted = await ensureCloudUrl(formData.logoUrl);
      const heroImageConverted = await ensureCloudUrl(formData.heroImage);
      const aboutImageConverted = await ensureCloudUrl(formData.aboutImage);
      const serviceImageConverted = await ensureCloudUrl(formData.serviceImage);

      const cleanedData = {
        ...formData,
        logoUrl: logoUrlConverted,
        heroImage: heroImageConverted,
        aboutImage: aboutImageConverted,
        serviceImage: serviceImageConverted,
        // 예전 슬라이드 캐러셀 기능은 완전히 폐지 — 메인 배너는 항상 heroImage 한 장만 사용.
        // 배열을 계속 비워서 저장해 과거에 남아있던 값이 되살아나지 않도록 함.
        heroImages: [],
        heroNukiImages: [],
        heroNukiConfigs: []
      };
      
      // Sanitize object to remove undefined properties and guarantee 100% Firestore write success
      const sanitizedData = JSON.parse(JSON.stringify(cleanedData));
      
      await updateSettings(sanitizedData);
      setFormData(sanitizedData);
      alert('설정이 성공적으로 저장되었습니다! 메인 화면 및 모든 탭에 즉시 반영되었습니다.');
    } catch (error: any) {
      console.error('Settings save error:', error);
      const isTooLarge = error?.code === 'invalid-argument' || /longer than|exceeds|too large/i.test(error?.message || '');
      alert(
        isTooLarge
          ? '저장에 실패했습니다: 이미지 용량이 너무 큽니다. 다른 이미지로 다시 시도해주세요.'
          : `저장에 실패했습니다: ${error?.message || '알 수 없는 오류'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingField(fieldName);
      try {
        // High-Speed Unlimited Cloud CDN Upload
        // The header logo only ever renders at ~96px tall, so uploading it at the default
        // 2000px cap wastes bandwidth on every page load — cap it much smaller here.
        const isLogo = fieldName === 'logoUrl';
        const cdnUrl = isLogo ? await uploadImageToCloudCDN(file, 400, 0.9) : await uploadImageToCloudCDN(file);
        setFormData(prev => ({ ...prev, [fieldName]: cdnUrl }));
      } catch (error) {
        console.error('Error uploading image to cloud CDN:', error);
        const isLogo = fieldName === 'logoUrl';
        const maxDim = isLogo ? 400 : 1280;
        const compressedBase64 = await compressImage(file, maxDim, maxDim, 0.65, !isLogo);
        setFormData(prev => ({ ...prev, [fieldName]: compressedBase64 }));
      } finally {
        setUploadingField(null);
        e.target.value = '';
      }
    }
  };

  const handleNukiImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const newConfigs: any[] = [];
        const newImages: string[] = [];
        const currentConfigs = formData.heroNukiConfigs || [];
        const currentImages = formData.heroNukiImages || [];
        
        for (let i = 0; i < files.length; i++) {
          const compressed = await compressImage(files[i], 800, 800, 0.5);
          newImages.push(compressed);
          
          // Spread positions evenly based on index
          const baseIndex = currentConfigs.length + i;
          const leftVal = baseIndex % 2 === 0 ? 10 + (Math.floor(baseIndex / 2) * 15) : 75 - (Math.floor(baseIndex / 2) * 15);
          const topVal = baseIndex % 2 === 0 ? 25 + (Math.floor(baseIndex / 2) * 10) : 55 - (Math.floor(baseIndex / 2) * 10);
          
          newConfigs.push({
            url: compressed,
            left: Math.max(5, Math.min(95, leftVal)),
            top: Math.max(5, Math.min(95, topVal)),
            size: 120
          });
        }
        
        setFormData({
          ...formData,
          heroNukiImages: [...currentImages, ...newImages],
          heroNukiConfigs: [...currentConfigs, ...newConfigs]
        });
      } catch (error) {
        console.error('Error compressing nuki images:', error);
        alert('누끼 이미지 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const handleRemoveNukiImage = (indexToRemove: number) => {
    const currentConfigs = formData.heroNukiConfigs || [];
    const currentImages = formData.heroNukiImages || [];
    setFormData({
      ...formData,
      heroNukiImages: currentImages.filter((_, idx) => idx !== indexToRemove),
      heroNukiConfigs: currentConfigs.filter((_, idx) => idx !== indexToRemove)
    });
  };

  const handleRestoreFullText = async () => {
    if (window.confirm('기존 완성 텍스트(Work, About 스토리, Process 4단계, Contact 문구)를 100% 원상복구 하시겠습니까?')) {
      const restored = {
        ...formData,
        homePortfolioTitle: 'Work',
        homePortfolioTitleLetterSpacing: -1,
        homePortfolioSubText: 'puff studio의 포트폴리오를 소개합니다.',
        aboutTitle: 'About Us',
        aboutSubText: 'puff studio는 당신의 가장 빛나는 순간을 기록합니다.',
        aboutText: '퍼프 스튜디오는 단순한 사진 촬영을 넘어, 당신의 이야기와 감정을 프레임 안에 담아냅니다.\n수년간의 경험과 독창적인 시선으로 가장 자연스럽고 아름다운 모습을 찾아드립니다.',
        aboutText2: '우리는 모든 사람이 자신만의 고유한 아름다움을 가지고 있다고 믿습니다.\n그 아름다움이 가장 자연스럽게 드러나는 찰나를 포착하여, 시간이 흘러도 변하지 않는 가치 있는 결과물로 만들어냅니다.',
        aboutText3: '단순히 셔터를 누르는 것을 넘어, 당신과 소통하고 교감하며 가장 편안한 분위기 속에서 촬영을 진행합니다.\n우리의 프레임 안에서 당신의 이야기가 예술이 됩니다.',
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
        contactMessagePlaceholder: "원하는 컨셉과 무드 필요한 예상 컷 수 또는 영상 갯수를 적어주세요.\n상담희망 하시는 경우 '상담희망'이라고 기입해주세요",
        address: '서울특별시 강남구 역삼동 스튜디오',
        contactEmail: 'contact@puffstudio.com',
        contactPhone: '010-1234-5678'
      };
      setFormData(restored);
      await updateSettings(restored);
      alert('모든 텍스트가 100% 성공적으로 원상복구 되었습니다!');
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Use direct navigation for the most robust download experience
      // The browser will handle the file download natively without leaving the page
      window.location.href = '/api/download-source';
      
      // Reset downloading state after a short delay
      setTimeout(() => {
        setIsDownloading(false);
      }, 2000);
    } catch (error) {
      console.error('Download failed:', error);
      alert('다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setIsDownloading(false);
    }
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'contact', label: '견적문의', icon: Phone },
    { id: 'deployment', label: 'Deployment', icon: Globe },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Site Settings</h2>
          <p className="text-stone-500 text-sm mt-1">사이트 전체 디자인, 텍스트, Process 4단계 타임라인을 편집 관리합니다.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleRestoreFullText}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border border-stone-300 cursor-pointer shadow-sm"
          >
            ✨ 기존 완성 텍스트 1초 복원
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-burgundy-800 hover:bg-burgundy-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            <Save size={16} />
            <span>{isSaving ? '저장 중...' : '설정 저장하기'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-stone-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-burgundy-600 text-burgundy-700'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Site Name (사이트 이름)</label>
              <input
                type="text"
                name="siteName"
                value={formData.siteName}
                onChange={handleChange}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-stone-700">Site Logo (로고 이미지)</label>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                  {getByteSizeKB(formData.logoUrl)}
                </span>
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  name="logoUrl"
                  value={formData.logoUrl || ''}
                  onChange={handleChange}
                  className="flex-1 border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors"
                  placeholder="https://example.com/logo.png"
                />
                <div className="relative overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logoUrl')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <button type="button" className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-4 py-2.5 rounded-lg font-medium transition-colors h-full whitespace-nowrap">
                    {uploadingField === 'logoUrl' ? '업로드 중...' : 'PC에서 찾기'}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-stone-400 mt-2">* 팁: 배경이 투명한 PNG 형식의 로고를 권장하며, 업로드 시 투명도가 보존됩니다.</p>
              {formData.logoUrl && (
                <div className="mt-4 p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] bg-stone-100 rounded-xl border border-stone-200 flex justify-center items-center">
                  <img src={formData.logoUrl} alt="Logo Preview" className="max-h-20 w-auto object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>

            {/* Footer (사이트 전체 하단 영역) */}
            <div className="pt-6 border-t border-stone-200 space-y-4">
              <h3 className="text-base font-bold text-stone-900">Footer (모든 페이지 하단 영역)</h3>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Footer 제목 (비워두면 Site Name 사용) — Enter로 줄바꿈 가능</label>
                <textarea
                  name="footerTitle"
                  value={formData.footerTitle || ''}
                  onChange={handleChange}
                  placeholder="예: puff studio"
                  rows={2}
                  className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Footer 설명 문구 — Enter로 줄바꿈 가능</label>
                <textarea
                  name="footerText"
                  value={formData.footerText || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors resize-y"
                />
              </div>
            </div>

            {/* Main Banner (Hero Visual) Settings */}
            {/* Single Main Hero Image Settings */}
            <div className="pt-6 border-t border-stone-200 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-stone-900">Main Banner (메인 비주얼 배너 이미지 1장)</h3>
                <span className="text-xs text-stone-500 font-mono">
                  {getByteSizeKB(formData.heroImage)}
                </span>
              </div>
              
              <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    name="heroImage"
                    value={formData.heroImage || ''}
                    onChange={handleChange}
                    placeholder="https://... 이미지 URL 주소 또는 [PC에서 찾기]"
                    className="flex-1 border border-stone-300 rounded-xl px-4 py-2.5 text-xs bg-white text-stone-900 focus:ring-2 focus:ring-burgundy-500/20"
                  />
                  <div className="relative overflow-hidden shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'heroImage')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <button type="button" className="w-full sm:w-auto bg-burgundy-800 hover:bg-burgundy-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm">
                      {uploadingField === 'heroImage' ? '업로드 중...' : '📷 [PC에서 찾기]'}
                    </button>
                  </div>
                  {formData.heroImage && (
                    <button
                      type="button"
                      onClick={async () => {
                        const updatedData = { ...formData, heroImage: '', heroImages: [] };
                        setFormData(updatedData);
                        await updateSettings(updatedData);
                      }}
                      className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-red-200 shrink-0"
                    >
                      🗑️ 사진 삭제
                    </button>
                  )}
                </div>
              </div>
                {formData.heroImage && (
                  <div className="mt-4 space-y-3">
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider">
                      <span className="flex items-center space-x-1.5 text-stone-800">
                        <Move size={14} className="text-burgundy-600" />
                        <span>실제 사이트 미리보기 (텍스트는 항상 좌하단 고정)</span>
                      </span>
                    </label>

                    <div
                      className="w-full rounded-lg overflow-hidden border border-stone-300 relative shadow-lg"
                      style={{
                        aspectRatio: formData.heroAspectRatio === '16:9' ? '16/9' : formData.heroAspectRatio === '4:3' ? '4/3' : '3/2'
                      }}
                    >
                      <img
                        src={formData.heroImage}
                        alt="Banner Preview"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{ objectPosition: formData.heroObjectPosition || 'center' }}
                        referrerPolicy="no-referrer"
                      />
                      {/* Dark fade matching the real hero */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/25 to-black/5 pointer-events-none" />

                      {/* Fixed Bottom-Left Text Block (matches live layout) */}
                      <div className="absolute inset-0 flex flex-col justify-end items-start text-left p-4 sm:p-6 pointer-events-none">
                        <div className="max-w-[85%] flex flex-col items-start">
                          {formData.heroSubText && (
                            <div
                              style={{
                                fontSize: `${Math.max(9, Math.round((formData.heroSubTextFontSize || 14) * 0.45))}px`,
                                letterSpacing: `${formData.heroSubTextLetterSpacing ?? 1}px`,
                                fontFamily: formData.heroSubTextFontFamily || 'Pretendard',
                              }}
                              className="font-bold uppercase mb-1 gradient-accent-text"
                            >
                              {formData.heroSubText}
                            </div>
                          )}
                          {formData.heroText && (
                            <div
                              style={{
                                fontSize: `${Math.max(14, Math.round((formData.heroTextFontSize || 42) * 0.45))}px`,
                                letterSpacing: `${formData.heroTextLetterSpacing ?? 0}px`,
                                fontFamily: formData.heroTextFontFamily || 'Pretendard',
                                color: formData.heroTextColor || '#FFFFFF',
                              }}
                              className="font-black drop-shadow-md leading-tight"
                            >
                              {formData.heroText}
                            </div>
                          )}
                          {formData.heroDescription && (
                            <div
                              style={{
                                fontSize: `${Math.max(9, Math.round((formData.heroDescriptionFontSize || 16) * 0.55))}px`,
                                letterSpacing: `${formData.heroDescriptionLetterSpacing ?? 0}px`,
                                fontFamily: formData.heroDescriptionFontFamily || 'Pretendard',
                                color: formData.heroDescriptionColor || '#D6D3D1',
                              }}
                              className="mt-1.5 leading-snug line-clamp-2"
                            >
                              {formData.heroDescription}
                            </div>
                          )}
                          {formData.heroCtaText && (
                            <div
                              style={{ color: formData.heroCtaTextColor || '#0B0C10' }}
                              className="mt-2 gradient-accent-bg font-bold text-[10px] px-3 py-1.5 rounded-lg"
                            >
                              {formData.heroCtaText}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded pointer-events-none">
                        비율: {formData.heroAspectRatio || '3:2'} | 초점: {formData.heroObjectPosition || 'center'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Main Banner Aspect Ratio (배너 이미지 비율 선택)</label>
                  <select
                    name="heroAspectRatio"
                    value={formData.heroAspectRatio || '3:2'}
                    onChange={handleChange as any}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors bg-white font-medium text-stone-800"
                  >
                    <option value="3:2">3:2 (카메라 가로 촬영 원본 표준 - 추천)</option>
                    <option value="16:9">16:9 (와이드 비디오 스크린)</option>
                    <option value="4:3">4:3 (클래식 포토)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Main Banner Position (배너 사진 초점/위치 이동 조정)</label>
                  <select
                    name="heroObjectPosition"
                    value={formData.heroObjectPosition || 'center'}
                    onChange={handleChange as any}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors bg-white font-medium text-stone-800"
                  >
                    <option value="center">중앙 (Center - 기본값)</option>
                    <option value="top">상단 (Top - 위쪽 인물/얼굴 초점)</option>
                    <option value="bottom">하단 (Bottom - 아래쪽 초점)</option>
                    <option value="50% 25%">상단 25% (약간 위쪽)</option>
                    <option value="50% 75%">하단 75% (약간 아래쪽)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Main Copy (메인 카피 문구) — Enter로 줄바꿈 가능</label>
                  <textarea
                    name="heroText"
                    value={formData.heroText || ''}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors font-medium text-stone-800 resize-y"
                    placeholder="예: CRAFTING VISUAL STORIES"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Sub Copy (서브 카피 문구) — Enter로 줄바꿈 가능</label>
                  <textarea
                    name="heroSubText"
                    value={formData.heroSubText || ''}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors font-medium text-stone-800 resize-y"
                    placeholder="예: 감각적인 순간을 담는 브랜드 포토그라피 & 비디오 스튜디오"
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-700 mb-2">Description (스튜디오 소개 문구 · 메인 카피 아래 문단)</label>
                  <textarea
                    name="heroDescription"
                    rows={3}
                    value={formData.heroDescription || ''}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors text-sm text-stone-800 resize-none"
                    placeholder="예: puff studio는 브랜드와 사람의 가장 빛나는 순간을 기록하는 상업 포토그래피 · 영상 제작 스튜디오입니다."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">CTA 버튼 문구</label>
                  <input
                    type="text"
                    name="heroCtaText"
                    value={formData.heroCtaText || ''}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors text-sm text-stone-800"
                    placeholder="예: 문의하기"
                  />
                  <label className="block text-xs font-medium text-stone-500 mt-3 mb-1">버튼 클릭 시 이동 경로</label>
                  <input
                    type="text"
                    name="heroCtaLink"
                    value={formData.heroCtaLink || ''}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors text-sm text-stone-600"
                    placeholder="/contact"
                  />
                </div>
              </div>

              {/* Typography Controllers (텍스트는 항상 좌하단 고정 배치) */}
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-6">
                <h4 className="font-semibold text-stone-900 text-sm flex items-center justify-between">
                  <span>🎨 히어로 카피 디테일 편집기 (글자 크기 / 자간 / 폰트 / 색상)</span>
                  <span className="text-xs text-stone-500 font-normal">텍스트 위치는 실제 화면과 동일하게 좌하단 고정</span>
                </h4>

                {/* Main Copy Controls */}
                <div className="space-y-4 pt-3 border-t border-stone-200/80">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">메인 카피 디테일 (Main Copy)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">글자 크기 ({formData.heroTextFontSize || 42}px)</label>
                      <input
                        type="range"
                        min="18"
                        max="80"
                        name="heroTextFontSize"
                        value={formData.heroTextFontSize || 42}
                        onChange={(e) => setFormData({ ...formData, heroTextFontSize: Number(e.target.value) })}
                        className="w-full accent-stone-800 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">자간 조절 ({formData.heroTextLetterSpacing ?? 0}px)</label>
                      <input
                        type="range"
                        min="-4"
                        max="16"
                        name="heroTextLetterSpacing"
                        value={formData.heroTextLetterSpacing ?? 0}
                        onChange={(e) => setFormData({ ...formData, heroTextLetterSpacing: Number(e.target.value) })}
                        className="w-full accent-stone-800 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">폰트 종류 (Font Family)</label>
                      <select
                        name="heroTextFontFamily"
                        value={formData.heroTextFontFamily || 'Pretendard'}
                        onChange={handleChange as any}
                        className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-xs bg-white font-medium"
                      >
                        <option value="Pretendard">Pretendard (Regular 400)</option>
                        <option value="Pretendard-Medium">Pretendard (Medium 500)</option>
                        <option value="Pretendard-SemiBold">Pretendard (SemiBold 600)</option>
                        <option value="Pretendard-Bold">Pretendard (Bold 700)</option>
                        <option value="Pretendard-Black">Pretendard (Black 900)</option>
                        <option value="Pretendard-Light">Pretendard (Light 300)</option>
                        <option value="Moneygraphy-Rounded">Moneygraphy Rounded (머니그라피 둥근체)</option>
                        <option value="Moneygraphy-Pixel">Moneygraphy Pixel (머니그라피 픽셀체)</option>
                        <option value="Playfair Display">Playfair Display (고급 Serif)</option>
                        <option value="Cormorant Garamond">Cormorant Garamond (클래식 Serif)</option>
                        <option value="Cinzel">Cinzel (명품 비주얼)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">글자 색상 (Color Palette)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.heroTextColor || '#FFFFFF'}
                          onChange={(e) => setFormData({ ...formData, heroTextColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 p-0.5 bg-white shrink-0"
                        />
                        <div className="flex items-center space-x-1 overflow-x-auto py-1">
                          {['#FFFFFF', '#F5F5F0', '#D4AF37', '#E2E8F0', '#18181B', '#800020', '#3B82F6'].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setFormData({ ...formData, heroTextColor: color })}
                              className={`w-5 h-5 rounded-full border border-stone-300 transition-transform cursor-pointer ${formData.heroTextColor === color ? 'scale-125 ring-2 ring-stone-900 z-10' : 'hover:scale-110'}`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub Copy Controls */}
                <div className="space-y-4 pt-4 border-t border-stone-200/80">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">서브 카피 디테일 (Sub Copy)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">글자 크기 ({formData.heroSubTextFontSize || 14}px)</label>
                      <input
                        type="range"
                        min="10"
                        max="30"
                        name="heroSubTextFontSize"
                        value={formData.heroSubTextFontSize || 14}
                        onChange={(e) => setFormData({ ...formData, heroSubTextFontSize: Number(e.target.value) })}
                        className="w-full accent-stone-800 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">자간 조절 ({formData.heroSubTextLetterSpacing ?? 1}px)</label>
                      <input
                        type="range"
                        min="-2"
                        max="10"
                        name="heroSubTextLetterSpacing"
                        value={formData.heroSubTextLetterSpacing ?? 1}
                        onChange={(e) => setFormData({ ...formData, heroSubTextLetterSpacing: Number(e.target.value) })}
                        className="w-full accent-stone-800 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">폰트 종류 (Font Family)</label>
                      <select
                        name="heroSubTextFontFamily"
                        value={formData.heroSubTextFontFamily || 'Pretendard'}
                        onChange={handleChange as any}
                        className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-xs bg-white font-medium"
                      >
                        <option value="Pretendard">Pretendard (Regular 400)</option>
                        <option value="Pretendard-Medium">Pretendard (Medium 500)</option>
                        <option value="Pretendard-SemiBold">Pretendard (SemiBold 600)</option>
                        <option value="Pretendard-Bold">Pretendard (Bold 700)</option>
                        <option value="Pretendard-Black">Pretendard (Black 900)</option>
                        <option value="Pretendard-Light">Pretendard (Light 300)</option>
                        <option value="Moneygraphy-Rounded">Moneygraphy Rounded (머니그라피 둥근체)</option>
                        <option value="Moneygraphy-Pixel">Moneygraphy Pixel (머니그라피 픽셀체)</option>
                        <option value="Playfair Display">Playfair Display (고급 Serif)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">글자 색상 (Color Palette)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.heroSubTextColor || '#E7E5E4'}
                          onChange={(e) => setFormData({ ...formData, heroSubTextColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 p-0.5 bg-white shrink-0"
                        />
                        <div className="flex items-center space-x-1 overflow-x-auto py-1">
                          {['#E7E5E4', '#FFFFFF', '#D4AF37', '#9CA3AF', '#18181B', '#800020'].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setFormData({ ...formData, heroSubTextColor: color })}
                              className={`w-5 h-5 rounded-full border border-stone-300 transition-transform cursor-pointer ${formData.heroSubTextColor === color ? 'scale-125 ring-2 ring-stone-900 z-10' : 'hover:scale-110'}`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description Copy Controls */}
                <div className="space-y-4 pt-4 border-t border-stone-200/80">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">소개 문구 디테일 (Description)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">글자 크기 ({formData.heroDescriptionFontSize || 16}px)</label>
                      <input
                        type="range"
                        min="12"
                        max="24"
                        value={formData.heroDescriptionFontSize || 16}
                        onChange={(e) => setFormData({ ...formData, heroDescriptionFontSize: Number(e.target.value) })}
                        className="w-full accent-stone-800 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">자간 조절 ({formData.heroDescriptionLetterSpacing ?? 0}px)</label>
                      <input
                        type="range"
                        min="-2"
                        max="6"
                        value={formData.heroDescriptionLetterSpacing ?? 0}
                        onChange={(e) => setFormData({ ...formData, heroDescriptionLetterSpacing: Number(e.target.value) })}
                        className="w-full accent-stone-800 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">폰트 종류 (Font Family)</label>
                      <select
                        value={formData.heroDescriptionFontFamily || 'Pretendard'}
                        onChange={(e) => setFormData({ ...formData, heroDescriptionFontFamily: e.target.value })}
                        className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-xs bg-white font-medium"
                      >
                        <option value="Pretendard">Pretendard (Regular)</option>
                        <option value="Pretendard-Medium">Pretendard (Medium)</option>
                        <option value="Pretendard-Light">Pretendard (Light)</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">글자 색상 (Color Palette)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.heroDescriptionColor || '#D6D3D1'}
                          onChange={(e) => setFormData({ ...formData, heroDescriptionColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 p-0.5 bg-white shrink-0"
                        />
                        <div className="flex items-center space-x-1 overflow-x-auto py-1">
                          {['#D6D3D1', '#FFFFFF', '#A8A29E', '#FF87AC'].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setFormData({ ...formData, heroDescriptionColor: color })}
                              className={`w-5 h-5 rounded-full border border-stone-300 transition-transform cursor-pointer ${formData.heroDescriptionColor === color ? 'scale-125 ring-2 ring-stone-900 z-10' : 'hover:scale-110'}`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button Text Color */}
                <div className="space-y-4 pt-4 border-t border-stone-200/80">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">CTA 버튼 글자 색상</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.heroCtaTextColor || '#0B0C10'}
                      onChange={(e) => setFormData({ ...formData, heroCtaTextColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 p-0.5 bg-white shrink-0"
                    />
                    <div className="flex items-center space-x-1 overflow-x-auto py-1">
                      {['#0B0C10', '#FFFFFF', '#1C1917'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, heroCtaTextColor: color })}
                          className={`w-5 h-5 rounded-full border border-stone-300 transition-transform cursor-pointer ${formData.heroCtaTextColor === color ? 'scale-125 ring-2 ring-stone-900 z-10' : 'hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-stone-500">버튼 배경은 라임 그라데이션으로 고정, 글자 색상만 조절합니다.</span>
                  </div>
                </div>
              </div>

            {/* Work Section Settings (Title, Letter Spacing & Sub Copy) */}
            <div className="pt-6 border-t border-stone-200 space-y-4">
              <h3 className="text-base font-semibold text-stone-800">Work 포트폴리오 섹션 타이틀 & 카피 편집</h3>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Work 섹션 제목 (Title) — Enter로 줄바꿈 가능</label>
                <textarea
                  name="homePortfolioTitle"
                  value={formData.homePortfolioTitle || 'Work'}
                  onChange={handleChange}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 resize-y"
                  placeholder="Work"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">글자 크기 ({formData.homePortfolioTitleFontSize || 48}px)</label>
                  <input
                    type="range"
                    min="24"
                    max="80"
                    value={formData.homePortfolioTitleFontSize || 48}
                    onChange={(e) => setFormData({ ...formData, homePortfolioTitleFontSize: Number(e.target.value) })}
                    className="w-full accent-stone-800 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">자간 조절 ({formData.homePortfolioTitleLetterSpacing ?? 1}px)</label>
                  <input
                    type="range"
                    min="-4"
                    max="15"
                    value={formData.homePortfolioTitleLetterSpacing ?? 1}
                    onChange={(e) => setFormData({ ...formData, homePortfolioTitleLetterSpacing: Number(e.target.value) })}
                    className="w-full accent-stone-800 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">폰트 종류</label>
                  <select
                    value={formData.homePortfolioTitleFontFamily || 'Pretendard'}
                    onChange={(e) => setFormData({ ...formData, homePortfolioTitleFontFamily: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-xs bg-white font-medium"
                  >
                    <option value="Pretendard">Pretendard (Regular)</option>
                    <option value="Pretendard-Bold">Pretendard (Bold)</option>
                    <option value="Pretendard-Black">Pretendard (Black)</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Cinzel">Cinzel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">글자 색상</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.homePortfolioTitleColor || '#FFFFFF'}
                      onChange={(e) => setFormData({ ...formData, homePortfolioTitleColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 p-0.5 bg-white shrink-0"
                    />
                    <div className="flex items-center space-x-1 overflow-x-auto py-1">
                      {['#FFFFFF', '#FF87AC', '#E7E5E4', '#18181B'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, homePortfolioTitleColor: color })}
                          className={`w-5 h-5 rounded-full border border-stone-300 transition-transform cursor-pointer ${formData.homePortfolioTitleColor === color ? 'scale-125 ring-2 ring-stone-900 z-10' : 'hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Work 섹션 서브 설명 카피 (Sub Copy) — Enter로 줄바꿈 가능</label>
                <textarea
                  name="homePortfolioSubText"
                  value={formData.homePortfolioSubText || ''}
                  onChange={handleChange}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 resize-y"
                  placeholder="예: aging studio의 감각적인 대표 포트폴리오 작품입니다."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">글자 크기 ({formData.homePortfolioSubTextFontSize || 14}px)</label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={formData.homePortfolioSubTextFontSize || 14}
                    onChange={(e) => setFormData({ ...formData, homePortfolioSubTextFontSize: Number(e.target.value) })}
                    className="w-full accent-stone-800 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">자간 조절 ({formData.homePortfolioSubTextLetterSpacing ?? 1}px)</label>
                  <input
                    type="range"
                    min="-2"
                    max="10"
                    value={formData.homePortfolioSubTextLetterSpacing ?? 1}
                    onChange={(e) => setFormData({ ...formData, homePortfolioSubTextLetterSpacing: Number(e.target.value) })}
                    className="w-full accent-stone-800 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">글자 색상</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.homePortfolioSubTextColor || '#A8A29E'}
                      onChange={(e) => setFormData({ ...formData, homePortfolioSubTextColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 p-0.5 bg-white shrink-0"
                    />
                    <div className="flex items-center space-x-1 overflow-x-auto py-1">
                      {['#A8A29E', '#FFFFFF', '#FF87AC', '#57534E'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, homePortfolioSubTextColor: color })}
                          className={`w-5 h-5 rounded-full border border-stone-300 transition-transform cursor-pointer ${formData.homePortfolioSubTextColor === color ? 'scale-125 ring-2 ring-stone-900 z-10' : 'hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Font Settings */}
            <div className="pt-6 border-t border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Heading Font (제목 폰트)</label>
                <select
                  name="headingFont"
                  value={formData.headingFont || 'Pretendard'}
                  onChange={handleChange as any}
                  className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors bg-white"
                >
                  <option value="Pretendard">Pretendard (프리텐다드/제목 및 본문 통일 추천)</option>
                  <option value="Playfair Display">Playfair Display (클래식/영문 추천)</option>
                  <option value="Cormorant Garamond">Cormorant Garamond (우아함/영문 추천)</option>
                  <option value="Lora">Lora (부드러운 세리프/영문)</option>
                  <option value="Noto Serif KR">Noto Serif KR (명조체/한글 추천)</option>
                  <option value="Nanum Myeongjo">Nanum Myeongjo (나눔명조/한글 추천)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Body Font (본문 폰트)</label>
                <select
                  name="bodyFont"
                  value={formData.bodyFont || 'Pretendard'}
                  onChange={handleChange as any}
                  className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors bg-white"
                >
                  <option value="Pretendard">Pretendard (프리텐다드/가장 깔끔한 한글)</option>
                  <option value="Inter">Inter (모던/영문 추천)</option>
                  <option value="Noto Sans KR">Noto Sans KR (고딕체/한글 추천)</option>
                  <option value="Nanum Gothic">Nanum Gothic (나눔고딕/한글 추천)</option>
                  <option value="Gowun Dodum">Gowun Dodum (고운돋움/감성적인 한글)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8">
            {/* Interactive Visual Drag Canvas Editor for About (Home Tab Style) */}
            <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Move size={18} className="text-burgundy-400" />
                  <span className="font-semibold text-stone-200 text-sm">About 실시간 라이브 미리보기 (실제 화면과 100% 동일한 세로형 3:4 비율)</span>
                </div>
                <span className="text-xs text-stone-400">💡 세로형 3:4 대표 사진 & 텍스트 실시간 라이브 연동</span>
              </div>

              {/* 2-Column Real Layout matching About.tsx */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-stone-950 p-6 rounded-xl border border-stone-800 shadow-inner">
                {/* Left: Vertical Image Card (3:4 Ratio) */}
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border border-stone-800 bg-stone-900 flex items-center justify-center">
                  {formData.aboutImage ? (
                    <img src={formData.aboutImage} alt="About Canvas" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xs text-stone-500 font-medium">세로형 이미지 없음 (3:4 비율)</span>
                  )}
                  <div className="absolute inset-0 bg-stone-950/10 pointer-events-none" />
                </div>

                {/* Right: Live Text Preview matching About.tsx */}
                <div className="flex flex-col justify-center space-y-4 p-2">
                  <h1
                    className="font-bold leading-snug transition-all"
                    style={{
                      fontSize: `${formData.aboutTextFontSize || 36}px`,
                      letterSpacing: `${formData.aboutTextLetterSpacing ?? 0}px`,
                      fontFamily: formData.aboutTextFontFamily || 'Pretendard',
                      textAlign: (formData.aboutTextAlign || 'left') as any,
                      color: formData.aboutTextColor || '#FFFFFF',
                    }}
                  >
                    {formData.aboutTitle || 'About Us'}
                  </h1>

                  {formData.aboutSubText && (
                    <h2 className="text-sm md:text-base text-stone-300 font-light leading-relaxed whitespace-pre-line">
                      {formData.aboutSubText}
                    </h2>
                  )}

                  <div
                    className="space-y-3 text-stone-400 font-light leading-relaxed transition-all"
                    style={{
                      fontSize: `${Math.max(10, Math.round((formData.aboutBodyFontSize || 16) * 0.85))}px`,
                      letterSpacing: `${formData.aboutBodyLetterSpacing ?? 0}px`,
                    }}
                  >
                    {formData.aboutText && <p className="whitespace-pre-line">{formData.aboutText}</p>}
                    {formData.aboutText2 && <p className="whitespace-pre-line">{formData.aboutText2}</p>}
                    {formData.aboutText3 && <p className="whitespace-pre-line">{formData.aboutText3}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Photoshop-style Detail Typography Controller for About */}
            <div className="bg-stone-900 text-white p-6 rounded-2xl border border-stone-800 space-y-6 shadow-xl">
              <h4 className="font-semibold text-stone-100 text-base flex items-center justify-between border-b border-stone-800 pb-3">
                <span className="flex items-center space-x-2">
                  <span>🎨 About 포토샵 디테일 타이포그래피 편집기</span>
                  <span className="bg-burgundy-600 text-white text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold">Home Style Editor</span>
                </span>
                <span className="text-xs text-stone-400 font-normal">위치 / 정렬 / 제목 크기 / 본문 크기 / 자간 / 폰트</span>
              </h4>

              {/* Position Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">가로 위치 (X: {formData.aboutTextX ?? 50}%)</label>
                  <input type="range" min="0" max="100" name="aboutTextX" value={formData.aboutTextX ?? 50} onChange={(e) => setFormData({ ...formData, aboutTextX: Number(e.target.value) })} className="w-full accent-burgundy-500 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">세로 위치 (Y: {formData.aboutTextY ?? 30}%)</label>
                  <input type="range" min="0" max="100" name="aboutTextY" value={formData.aboutTextY ?? 30} onChange={(e) => setFormData({ ...formData, aboutTextY: Number(e.target.value) })} className="w-full accent-burgundy-500 cursor-pointer" />
                </div>
              </div>

              {/* Text Alignment */}
              <div className="pt-2 border-t border-stone-800">
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">글자 정렬 (Text Alignment)</label>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setFormData({ ...formData, aboutTextAlign: 'left' })} className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all cursor-pointer ${(!formData.aboutTextAlign || formData.aboutTextAlign === 'left') ? 'bg-white text-stone-900 border-white shadow-md font-bold' : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'}`}><AlignLeft size={16} /><span>왼쪽 정렬</span></button>
                  <button type="button" onClick={() => setFormData({ ...formData, aboutTextAlign: 'center' })} className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all cursor-pointer ${formData.aboutTextAlign === 'center' ? 'bg-white text-stone-900 border-white shadow-md font-bold' : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'}`}><AlignCenter size={16} /><span>가운데 정렬</span></button>
                  <button type="button" onClick={() => setFormData({ ...formData, aboutTextAlign: 'right' })} className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all cursor-pointer ${formData.aboutTextAlign === 'right' ? 'bg-white text-stone-900 border-white shadow-md font-bold' : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'}`}><AlignRight size={16} /><span>오른쪽 정렬</span></button>
                </div>
              </div>

              {/* Sliders & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-3 border-t border-stone-800">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">제목 크기 ({formData.aboutTextFontSize || 42}px)</label>
                  <input type="range" min="18" max="80" name="aboutTextFontSize" value={formData.aboutTextFontSize || 42} onChange={(e) => setFormData({ ...formData, aboutTextFontSize: Number(e.target.value) })} className="w-full accent-burgundy-500 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-burgundy-400 mb-1">✨ 본문 크기 ({formData.aboutBodyFontSize || 16}px)</label>
                  <input type="range" min="12" max="36" name="aboutBodyFontSize" value={formData.aboutBodyFontSize || 16} onChange={(e) => setFormData({ ...formData, aboutBodyFontSize: Number(e.target.value) })} className="w-full accent-burgundy-500 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">자간 조절 ({formData.aboutTextLetterSpacing ?? 0}px)</label>
                  <input type="range" min="-4" max="16" name="aboutTextLetterSpacing" value={formData.aboutTextLetterSpacing ?? 0} onChange={(e) => setFormData({ ...formData, aboutTextLetterSpacing: Number(e.target.value) })} className="w-full accent-burgundy-500 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">폰트 종류</label>
                  <select name="aboutTextFontFamily" value={formData.aboutTextFontFamily || 'Pretendard'} onChange={handleChange as any} className="w-full border border-stone-700 rounded-lg px-3 py-2 text-xs bg-stone-800 text-stone-200 font-medium">
                    <option value="Pretendard">Pretendard (Regular 400)</option>
                    <option value="Pretendard-Medium">Pretendard (Medium 500)</option>
                    <option value="Pretendard-SemiBold">Pretendard (SemiBold 600)</option>
                    <option value="Pretendard-Bold">Pretendard (Bold 700)</option>
                    <option value="Pretendard-Black">Pretendard (Black 900)</option>
                    <option value="Pretendard-Light">Pretendard (Light 300)</option>
                    <option value="Moneygraphy-Rounded">Moneygraphy Rounded (머니그라피 둥근체)</option>
                    <option value="Moneygraphy-Pixel">Moneygraphy Pixel (머니그라피 픽셀체)</option>
                    <option value="Playfair Display">Playfair Display (고급 Serif)</option>
                    <option value="Cormorant Garamond">Cormorant Garamond (클래식 Serif)</option>
                    <option value="Cinzel">Cinzel (명품 비주얼)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">글자 색상</label>
                  <div className="flex items-center space-x-2">
                    <input type="color" value={formData.aboutTextColor || '#1C1917'} onChange={(e) => setFormData({ ...formData, aboutTextColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border border-stone-700 p-0.5 bg-stone-800 shrink-0" />
                    <div className="flex items-center space-x-1 overflow-x-auto py-1">
                      {['#1C1917', '#FFFFFF', '#D4AF37', '#800020', '#3B82F6'].map(color => (
                        <button key={color} type="button" onClick={() => setFormData({ ...formData, aboutTextColor: color })} className={`w-5 h-5 rounded-full border border-stone-600 transition-transform cursor-pointer ${formData.aboutTextColor === color ? 'scale-125 ring-2 ring-white z-10' : 'hover:scale-110'}`} style={{ backgroundColor: color }} title={color} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Fields */}
            <div className="space-y-6">
              <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-stone-700">About Image (소개 페이지 대표 세로형 이미지 3:4)</label>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                  {getByteSizeKB(formData.aboutImage)}
                </span>
              </div>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    name="aboutImage"
                    value={formData.aboutImage || ''}
                    onChange={handleChange}
                    className="flex-1 border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors"
                  />
                  <div className="relative overflow-hidden">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'aboutImage')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <button type="button" className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-4 py-2.5 rounded-lg font-medium transition-colors h-full whitespace-nowrap">
                      PC에서 찾기
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">About Title (대제목) — Enter로 줄바꿈 가능</label>
                  <textarea
                    name="aboutTitle"
                    value={formData.aboutTitle || ''}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors font-medium text-stone-800 resize-y"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">About Sub Title (서브 타이틀)</label>
                  <textarea
                    name="aboutSubText"
                    value={formData.aboutSubText || ''}
                    onChange={handleChange}
                    rows={2}
                    placeholder="엔터(Enter)를 눌러 자유롭게 줄바꿈 하실 수 있습니다."
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors font-medium text-stone-800"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Story Paragraph 1 (소개 문단 1)</label>
                  <textarea
                    name="aboutText"
                    value={formData.aboutText || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors text-stone-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Story Paragraph 2 (소개 문단 2)</label>
                  <textarea
                    name="aboutText2"
                    value={formData.aboutText2 || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors text-stone-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Story Paragraph 3 (소개 문단 3)</label>
                  <textarea
                    name="aboutText3"
                    value={formData.aboutText3 || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors text-stone-800 font-medium"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SERVICE TAB */}
        {activeTab === 'service' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8">
            
            {/* Live Process Preview Canvas matching Service.tsx 100% */}
            <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <span className="font-semibold text-stone-200 text-sm">Service Process 실시간 라이브 미리보기 (실제 화면과 100% 동일)</span>
                <span className="text-xs text-stone-400">💡 텍스트 & 이미지 입력 시 0.1초 즉시 라이브 연동</span>
              </div>

              <div className="bg-white p-6 rounded-xl border border-stone-200 text-stone-900 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4">
                  <h1 className="text-3xl font-black text-stone-950 tracking-tight font-sans">
                    {formData.serviceProcessTitle || 'Process'}
                  </h1>
                  {formData.serviceSubText && (
                    <p className="text-xs text-stone-500 mt-2 whitespace-pre-line">{formData.serviceSubText}</p>
                  )}
                </div>

                <div className="lg:col-span-8 space-y-6">
                  {(formData.serviceProcessSteps || []).map((step, idx) => (
                    <div key={step.id || idx} className="pt-4 border-t border-stone-200 flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-[10px] font-mono font-bold text-stone-400 pt-0.5">{step.stepNumber || `0${idx + 1}`}</span>
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">{step.title || '단계 제목'}</h4>
                          <p className="text-xs text-stone-600 mt-1 whitespace-pre-line">{step.desc1}</p>
                          {step.desc2 && <p className="text-xs text-stone-400 mt-0.5 whitespace-pre-line">{step.desc2}</p>}
                        </div>
                      </div>
                      {step.image && (
                        <div className="w-24 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          <img src={step.image} alt={step.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Process Main Title & Sub Text Controls */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4 shadow-sm">
              <h3 className="text-base font-semibold text-stone-800 border-b border-stone-200 pb-3">Process 섹션 타이틀 설정</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">대형 타이틀 (기본: Process) — Enter로 줄바꿈 가능</label>
                  <textarea
                    name="serviceProcessTitle"
                    value={formData.serviceProcessTitle || 'Process'}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 resize-y"
                    placeholder="Process"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">서브 설명 카피 — Enter로 줄바꿈 가능</label>
                  <textarea
                    name="serviceSubText"
                    value={formData.serviceSubText || ''}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 resize-y"
                    placeholder="예: aging studio의 촬영 프로세스 안내입니다."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Process Steps Management (Dynamic Cards with Custom Images) */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="text-base font-semibold text-stone-800">Process 단계별 상세 데이터 관리 (텍스트 & 이미지)</h3>
                <button
                  type="button"
                  onClick={() => {
                    const steps = formData.serviceProcessSteps || [];
                    const nextNum = String(steps.length + 1).padStart(2, '0');
                    const newStep: ProcessStep = {
                      id: `step_${Date.now()}`,
                      stepNumber: nextNum,
                      title: `새 단계 ${nextNum}`,
                      desc1: '설정 문구를 입력하세요.',
                      desc2: '',
                      image: ''
                    };
                    setFormData({ ...formData, serviceProcessSteps: [...steps, newStep] });
                  }}
                  className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  + 새 프로세스 단계 추가
                </button>
              </div>

              <div className="space-y-6">
                {(formData.serviceProcessSteps || []).map((step, idx) => (
                  <div key={step.id || idx} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <span className="text-xs font-bold text-stone-800 flex items-center space-x-2">
                        <span className="bg-stone-800 text-white text-[10px] px-2 py-0.5 rounded font-mono">단계 {idx + 1}</span>
                        <span>{step.title || '제목 없음'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const steps = (formData.serviceProcessSteps || []).filter((_, i) => i !== idx);
                          setFormData({ ...formData, serviceProcessSteps: steps });
                        }}
                        className="text-xs text-red-500 hover:underline cursor-pointer font-medium"
                      >
                        이 단계 삭제
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Step Number & Title */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-stone-600 mb-1">번호 (01, 02..)</label>
                        <input
                          type="text"
                          value={step.stepNumber}
                          onChange={(e) => {
                            const newSteps = [...(formData.serviceProcessSteps || [])];
                            newSteps[idx] = { ...newSteps[idx], stepNumber: e.target.value };
                            setFormData({ ...formData, serviceProcessSteps: newSteps });
                          }}
                          className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-mono"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-stone-600 mb-1">단계 제목 (e.g. 상담·기획)</label>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => {
                            const newSteps = [...(formData.serviceProcessSteps || [])];
                            newSteps[idx] = { ...newSteps[idx], title: e.target.value };
                            setFormData({ ...formData, serviceProcessSteps: newSteps });
                          }}
                          className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-bold text-stone-900"
                        />
                      </div>

                      {/* Descriptions */}
                      <div className="md:col-span-6 space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-stone-600 mb-1">설명 문구 1 (강조 핵심 문구)</label>
                          <textarea
                            value={step.desc1}
                            onChange={(e) => {
                              const newSteps = [...(formData.serviceProcessSteps || [])];
                              newSteps[idx] = { ...newSteps[idx], desc1: e.target.value };
                              setFormData({ ...formData, serviceProcessSteps: newSteps });
                            }}
                            rows={2}
                            placeholder="엔터(Enter)를 눌러 줄바꿈 가능"
                            className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-stone-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600 mb-1">설명 문구 2 (상세 부연 설명)</label>
                          <textarea
                            value={step.desc2}
                            onChange={(e) => {
                              const newSteps = [...(formData.serviceProcessSteps || [])];
                              newSteps[idx] = { ...newSteps[idx], desc2: e.target.value };
                              setFormData({ ...formData, serviceProcessSteps: newSteps });
                            }}
                            rows={2}
                            placeholder="엔터(Enter)를 눌러 자유롭게 줄바꿈 하실 수 있습니다."
                            className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-stone-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step Image Upload */}
                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {step.image ? (
                          <img src={step.image} alt={step.title} className="w-16 h-12 rounded object-cover border border-stone-300" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-16 h-12 rounded bg-stone-200 flex items-center justify-center text-[10px] text-stone-400">사진 없음</div>
                        )}
                        <span className="text-xs text-stone-500 truncate max-w-xs">{step.image || '등록된 이미지가 없습니다.'}</span>
                      </div>

                      <div className="relative overflow-hidden">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingField(`stepImg_${idx}`);
                              try {
                                const url = await uploadImageToCloudCDN(file);
                                const newSteps = [...(formData.serviceProcessSteps || [])];
                                newSteps[idx] = { ...newSteps[idx], image: url };
                                setFormData({ ...formData, serviceProcessSteps: newSteps });
                              } finally {
                                setUploadingField(null);
                                e.target.value = '';
                              }
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <button type="button" className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                          {uploadingField === `stepImg_${idx}` ? '업로드 중...' : '[PC에서 찾기] 이미지 등록'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}

        {/* CONTACT TAB */}
        {activeTab === 'contact' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Contact Title (상단 대제목) — Enter로 줄바꿈 가능</label>
                  <textarea
                    name="contactTitle"
                    value={formData.contactTitle || ''}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors font-medium text-stone-800 resize-y"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Contact Sub Title (상단 서브 타이틀) — Enter로 줄바꿈 가능</label>
                  <textarea
                    name="contactSubText"
                    value={formData.contactSubText || ''}
                    onChange={handleChange}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors font-medium text-stone-800 resize-y"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">🎨 Contact 페이지 전체 배경색 (Background Color)</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.contactBgColor || '#F5F5F0'}
                    onChange={(e) => setFormData({ ...formData, contactBgColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-stone-300 p-0.5 cursor-pointer"
                  />
                  <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
                    {['#F5F5F0', '#FFFFFF', '#18181B', '#FAF9F6', '#EFEFE8', '#0F172A'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, contactBgColor: color })}
                        className={`w-6 h-6 rounded-full border border-stone-300 transition-transform cursor-pointer ${formData.contactBgColor === color ? 'scale-125 ring-2 ring-stone-900 z-10' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Left panel: service intro card */}
              <div className="pt-6 border-t border-stone-200 space-y-4">
                <h4 className="text-base font-semibold text-stone-800 border-b border-stone-200 pb-2 flex items-center justify-between">
                  <span>📝 좌측 서비스 소개 카드</span>
                  <span className="text-xs font-normal text-stone-500">문의하기 페이지 좌측 카드 상단 문구에 반영됩니다.</span>
                </h4>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">카드 제목 (Message Title) — Enter로 줄바꿈 가능</label>
                  <textarea
                    name="contactMessageTitle"
                    value={formData.contactMessageTitle || ''}
                    onChange={handleChange}
                    placeholder="예: Let's Create Together"
                    rows={2}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 resize-y"
                  />
                </div>
              </div>

              {/* Studio Contact Information Left Card Editor */}
              <div className="pt-6 border-t border-stone-200 space-y-4">
                <h4 className="text-base font-semibold text-stone-800 border-b border-stone-200 pb-2 flex items-center justify-between">
                  <span>📍 연락처 정보 편집</span>
                  <span className="text-xs font-normal text-stone-500">문의하기 페이지 카카오 버튼 및 하단 Footer에 반영됩니다.</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">이메일 주소 (Email)</label>
                    <input
                      type="text"
                      name="contactEmail"
                      value={formData.contactEmail || ''}
                      onChange={handleChange}
                      placeholder="contact@puffstudio.com"
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">전화번호 / 대표 연락처 (Phone)</label>
                    <input
                      type="text"
                      name="contactPhone"
                      value={formData.contactPhone || ''}
                      onChange={handleChange}
                      placeholder="010-1234-5678"
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">인스타그램 URL (Instagram Link)</label>
                  <input
                    type="text"
                    name="instagramUrl"
                    value={formData.instagramUrl || ''}
                    onChange={handleChange}
                    placeholder="https://instagram.com/puffstudio"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">카카오톡 채널 URL (채널 추가 버튼)</label>
                  <input
                    type="text"
                    name="kakaoChannelUrl"
                    value={formData.kakaoChannelUrl || ''}
                    onChange={handleChange}
                    placeholder="https://pf.kakao.com/_xxxxx"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500"
                  />
                  <p className="text-xs text-stone-400 mt-1">비워두면 문의하기 페이지에 카카오톡 버튼이 표시되지 않습니다.</p>
                </div>
              </div>

              {/* Right panel: consultation form */}
              <div className="pt-6 border-t border-stone-200 space-y-4">
                <h4 className="text-base font-semibold text-stone-800 border-b border-stone-200 pb-2 flex items-center justify-between">
                  <span>📋 우측 상담 신청 폼</span>
                  <span className="text-xs font-normal text-stone-500">문의하기 페이지 우측 폼 제목/설명/버튼에 반영됩니다.</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">폼 제목 (Form Title) — Enter로 줄바꿈 가능</label>
                    <textarea
                      name="contactFormTitle"
                      value={formData.contactFormTitle || ''}
                      onChange={handleChange}
                      placeholder="예: 상담 신청"
                      rows={2}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">제출 버튼 문구 (Button Text)</label>
                    <input
                      type="text"
                      name="contactFormButtonText"
                      value={formData.contactFormButtonText || ''}
                      onChange={handleChange}
                      placeholder="예: 상담 신청하기"
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">폼 안내 문구 (Form Description)</label>
                  <textarea
                    name="contactFormDescription"
                    value={formData.contactFormDescription || ''}
                    onChange={handleChange}
                    rows={2}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">촬영 목적 및 내용 입력란 힌트 문구 (Placeholder)</label>
                  <textarea
                    name="contactMessagePlaceholder"
                    value={formData.contactMessagePlaceholder ?? "촬영 목적(SNS 컨텐츠, 상세페이지, 숏폼 등)과 원하는 컨셉, 필요한 예상 컷 수/영상 갯수를 자유롭게 적어주세요.\n상담을 먼저 원하시면 '상담희망'이라고 남겨주셔도 됩니다."}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500"
                  />
                </div>
              </div>

              {/* 상품 구성 카드 편집기 (4칸: 시작 패키지 / 하프데이 / 풀데이 / 컷 당 촬영) */}
              <div className="pt-6 border-t border-stone-200 space-y-6">
                <h4 className="text-base font-semibold text-stone-800 border-b border-stone-200 pb-2 flex items-center justify-between">
                  <span>💳 상품 구성 카드 편집 (4칸)</span>
                  <span className="text-xs font-normal text-stone-500">문의하기 페이지 상단 4개 카드에 100% 반영됩니다. 마지막 카드는 보통 &quot;컷 당 촬영&quot; 단가표로 사용해요.</span>
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(formData.contactPackages && formData.contactPackages.length > 0 ? formData.contactPackages : DEFAULT_CONTACT_PACKAGES).map((pkg, pIdx) => (
                    <div key={pkg.id || pIdx} className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-3">
                      <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                        <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                          [{pIdx + 1}] {pkg.name || `카드 ${pIdx + 1}`}
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-[11px] text-stone-500 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!pkg.highlight}
                              onChange={(e) => {
                                const base = formData.contactPackages && formData.contactPackages.length > 0 ? formData.contactPackages : DEFAULT_CONTACT_PACKAGES;
                                const next = [...base];
                                next[pIdx] = { ...next[pIdx], highlight: e.target.checked };
                                setFormData({ ...formData, contactPackages: next });
                              }}
                            />
                            추천 뱃지 표시
                          </label>
                          <label className="flex items-center gap-1.5 text-[11px] text-stone-500 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!pkg.featuresFirst}
                              onChange={(e) => {
                                const base = formData.contactPackages && formData.contactPackages.length > 0 ? formData.contactPackages : DEFAULT_CONTACT_PACKAGES;
                                const next = [...base];
                                next[pIdx] = { ...next[pIdx], featuresFirst: e.target.checked };
                                setFormData({ ...formData, contactPackages: next });
                              }}
                            />
                            가격/포함내역을 위로
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">카드 이름</label>
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => {
                              const base = formData.contactPackages && formData.contactPackages.length > 0 ? formData.contactPackages : DEFAULT_CONTACT_PACKAGES;
                              const next = [...base];
                              next[pIdx] = { ...next[pIdx], name: e.target.value };
                              setFormData({ ...formData, contactPackages: next });
                            }}
                            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-stone-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">가격 (비워두면 안 보임)</label>
                          <input
                            type="text"
                            value={pkg.price}
                            onChange={(e) => {
                              const base = formData.contactPackages && formData.contactPackages.length > 0 ? formData.contactPackages : DEFAULT_CONTACT_PACKAGES;
                              const next = [...base];
                              next[pIdx] = { ...next[pIdx], price: e.target.value };
                              setFormData({ ...formData, contactPackages: next });
                            }}
                            placeholder="예: 590,000원"
                            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-stone-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">소요 시간 (선택)</label>
                          <input
                            type="text"
                            value={pkg.duration || ''}
                            onChange={(e) => {
                              const base = formData.contactPackages && formData.contactPackages.length > 0 ? formData.contactPackages : DEFAULT_CONTACT_PACKAGES;
                              const next = [...base];
                              next[pIdx] = { ...next[pIdx], duration: e.target.value };
                              setFormData({ ...formData, contactPackages: next });
                            }}
                            placeholder="예: 4시간"
                            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-stone-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">한 줄 소개 (Tagline) — Enter로 줄바꿈 가능</label>
                        <textarea
                          value={pkg.tagline}
                          onChange={(e) => {
                            const base = formData.contactPackages && formData.contactPackages.length > 0 ? formData.contactPackages : DEFAULT_CONTACT_PACKAGES;
                            const next = [...base];
                            next[pIdx] = { ...next[pIdx], tagline: e.target.value };
                            setFormData({ ...formData, contactPackages: next });
                          }}
                          rows={2}
                          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-stone-800 resize-y"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">설명 문구 — Enter로 줄바꿈 가능</label>
                        <textarea
                          value={pkg.description}
                          onChange={(e) => {
                            const base = formData.contactPackages && formData.contactPackages.length > 0 ? formData.contactPackages : DEFAULT_CONTACT_PACKAGES;
                            const next = [...base];
                            next[pIdx] = { ...next[pIdx], description: e.target.value };
                            setFormData({ ...formData, contactPackages: next });
                          }}
                          rows={2}
                          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-stone-800 resize-y"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          포함 내역 / 단가표 (줄바꿈으로 구분, &quot;라벨 — 가격&quot; 형식으로 쓰면 가격이 오른쪽에 강조돼요)
                        </label>
                        <textarea
                          value={(pkg.features || []).join('\n')}
                          onChange={(e) => {
                            const base = formData.contactPackages && formData.contactPackages.length > 0 ? formData.contactPackages : DEFAULT_CONTACT_PACKAGES;
                            const next = [...base];
                            next[pIdx] = { ...next[pIdx], features: e.target.value.split('\n') };
                            setFormData({ ...formData, contactPackages: next });
                          }}
                          rows={4}
                          placeholder={'예:\n일반 누끼 — 40,000원\n반사체 누끼 (거울·은박·유광 뚜껑 등) — 60,000원'}
                          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-stone-800 resize-y"
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* 정책 안내 그룹 편집기 (보정&납품 / 비용관련 / 예약&결제) */}
              <div className="pt-6 border-t border-stone-200 space-y-4">
                <h4 className="text-base font-semibold text-stone-800 border-b border-stone-200 pb-2 flex items-center justify-between">
                  <span>📋 정책 안내 (보정&납품 / 비용관련 / 예약&결제)</span>
                  <span className="text-xs font-normal text-stone-500">문의하기 페이지 상담 신청 좌측에 반영됩니다.</span>
                </h4>
                <div className="space-y-6">
                  {(formData.contactPolicyGroups && formData.contactPolicyGroups.length > 0 ? formData.contactPolicyGroups : DEFAULT_POLICY_GROUPS).map((group, gIdx) => (
                    <div key={group.id} className="border border-stone-200 rounded-xl p-4 space-y-3 bg-stone-50">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">그룹 제목</label>
                        <input
                          type="text"
                          value={group.title}
                          onChange={(e) => {
                            const base = formData.contactPolicyGroups && formData.contactPolicyGroups.length > 0 ? formData.contactPolicyGroups : DEFAULT_POLICY_GROUPS;
                            const next = [...base];
                            next[gIdx] = { ...next[gIdx], title: e.target.value };
                            setFormData({ ...formData, contactPolicyGroups: next });
                          }}
                          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white text-stone-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          항목 목록 (줄바꿈으로 구분)
                        </label>
                        <textarea
                          value={(group.items || []).join('\n')}
                          onChange={(e) => {
                            const base = formData.contactPolicyGroups && formData.contactPolicyGroups.length > 0 ? formData.contactPolicyGroups : DEFAULT_POLICY_GROUPS;
                            const next = [...base];
                            next[gIdx] = { ...next[gIdx], items: e.target.value.split('\n') };
                            setFormData({ ...formData, contactPolicyGroups: next });
                          }}
                          rows={5}
                          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-stone-800 resize-y"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {/* DEPLOYMENT TAB */}
        {activeTab === 'deployment' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Globe size={20} />
                홈페이지 정식 배포 및 도메인 연결
              </h3>
              <p className="text-blue-800 mb-4 text-sm leading-relaxed">
                현재 홈페이지의 소스 코드를 다운로드하여 Vercel에 배포하고, 나만의 도메인(www.내이름.com)을 연결할 수 있습니다.
                <br />
                아래 버튼을 눌러 최신 소스 코드를 다운로드한 후, Vercel(버셀)에 업로드해 주세요.
              </p>
              
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={20} />
                <span>{isDownloading ? '다운로드 중...' : '소스 코드 다운로드 (.zip)'}</span>
              </button>
              
              <div className="mt-6 pt-6 border-t border-blue-200/50">
                <h4 className="font-medium text-blue-900 mb-2 text-sm">배포 후 데이터 관리 안내</h4>
                <p className="text-blue-800 text-sm">
                  소스 코드를 한 번 배포하고 나면, 앞으로 사진을 올리거나 텍스트를 수정할 때마다 코드를 다시 다운로드할 필요가 <strong>없습니다.</strong>
                  <br />
                  모든 데이터는 방금 연결하신 구글 파이어베이스(Firebase)에 실시간으로 안전하게 저장되며, 라이브 웹사이트에 즉시 반영됩니다.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t border-stone-200">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center space-x-2 bg-burgundy-700 hover:bg-burgundy-600 active:bg-burgundy-800 text-white px-8 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Save size={20} />
          <span>{isSaving ? '저장 중...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}
