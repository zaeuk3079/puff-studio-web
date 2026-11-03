import React, { useRef, useState } from 'react';
import { useCMS } from '../store/CMSContext';
import { motion } from 'motion/react';
import { MessageCircle, Send, Clock, Sparkles, Wallet, CalendarCheck, Calendar, LucideIcon } from 'lucide-react';
import { ContactPackage, ContactPolicyGroup } from '../store/CMSContext';

const DEFAULT_PACKAGES: ContactPackage[] = [
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

const POLICY_ICONS: Record<string, LucideIcon> = {
  retouch: Sparkles,
  cost: Wallet,
  booking: CalendarCheck,
};

export default function Contact() {
  const { settings } = useCMS();

  const policyGroups = settings.contactPolicyGroups && settings.contactPolicyGroups.length > 0
    ? settings.contactPolicyGroups
    : DEFAULT_POLICY_GROUPS;

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(''); // 희망 일정
  const [message, setMessage] = useState(''); // 촬영 목적 및 내용 (자유 서술)
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof (input as any).showPicker === 'function') {
      (input as any).showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  const handleDatePicked = (value: string) => {
    if (!value) return;
    const [year, month, day] = value.split('-');
    setDate(`${year}년 ${Number(month)}월 ${Number(day)}일`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Web3Forms 키 확인 (폴백 처리)
    if (!settings.web3FormsKey) {
      const confirmFallback = window.confirm(
        '온라인 문의 전송 키가 설정되지 않았습니다.\n기존의 구글 폼 신청 페이지로 이동하시겠습니까?'
      );
      if (confirmFallback && settings.googleFormUrl) {
        window.open(settings.googleFormUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: settings.web3FormsKey,
          subject: `[상담 문의] ${name}님 - 촬영 문의`,
          from_name: name,
          name,
          phone,
          email,
          category: 'INQUIRY',
          date,
          message
        })
      });

      const result = await response.json();
      if (result.success) {
        setSubmitStatus('success');
        // Reset form
        setName('');
        setPhone('');
        setEmail('');
        setDate('');
        setMessage('');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-24 transition-colors duration-500 text-white" style={{ backgroundColor: settings.contactBgColor || '#0B0C10' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <span className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase whitespace-pre-line">{settings.contactSubText || 'Contact'}</span>
          <h1 className="font-serif text-3xl sm:text-4xl text-white mt-2 whitespace-pre-line">{settings.contactTitle || '견적문의'}</h1>
        </motion.div>

        {/* 상품 구성 (Pricing / Packages) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-10"
        >
          {/* Package cards (4th card = 컷 당 촬영 단가표) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto_auto] gap-5 mb-6">
            {(settings.contactPackages && settings.contactPackages.length > 0 ? settings.contactPackages : DEFAULT_PACKAGES).map((pkg) => {
              const featuresList = (
                <ul className="flex-1">
                  {pkg.features.map((feat, idx) => {
                    const trimmed = feat.trim();
                    const isNote = trimmed.startsWith('(') && trimmed.endsWith(')');
                    const [label, price] = feat.split(' — ');
                    return (
                      <li
                        key={idx}
                        className={`flex items-start gap-1.5 text-xs ${
                          isNote ? 'text-stone-500 mt-0.5' : `text-stone-300 ${idx > 0 ? 'mt-2' : ''}`
                        }`}
                      >
                        {!isNote && <span className="text-lime-300 mt-0.5 shrink-0 w-3.5 text-center">✓</span>}
                        {isNote ? (
                          <span className="leading-relaxed whitespace-pre-line pl-5">{feat}</span>
                        ) : price ? (
                          <span className="leading-relaxed flex-1 flex items-baseline justify-between gap-2">
                            <span className="whitespace-pre-line">{label}</span>
                            <span className="text-lime-300 font-semibold whitespace-nowrap">{price}</span>
                          </span>
                        ) : (
                          <span className="leading-relaxed whitespace-pre-line">{feat}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              );
              const taglineDescription = (
                <div>
                  <p className="text-xs text-stone-400 leading-relaxed whitespace-pre-line">{pkg.tagline}</p>
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed whitespace-pre-line">{pkg.description}</p>
                </div>
              );

              return (
                <div
                  key={pkg.id}
                  className={`p-6 rounded-2xl border lg:grid lg:grid-rows-subgrid lg:row-span-4 ${
                    pkg.highlight
                      ? 'bg-lime-300/5 border-lime-300/40 shadow-lg shadow-lime-300/5'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  {/* lg:grid-rows-subgrid lets this card's name/price/top-content/divider rows
                      share height with the same rows in the other 3 cards, so the divider lands
                      at the same vertical position regardless of how long each card's text is —
                      no more guessing a fixed min-height that breaks whenever copy changes. */}
                  <div className="lg:row-start-1">
                    {pkg.highlight && (
                      <span className="inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-lime-300 text-ink-950 mb-3">
                        추천
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                  </div>
                  {(pkg.price || pkg.duration) && (
                    <div className="lg:row-start-2 mt-2 flex items-baseline gap-2 min-h-[28px]">
                      {pkg.price && <span className="text-xl font-black gradient-accent-text">{pkg.price}</span>}
                      {pkg.duration && (
                        <span className="text-xs text-stone-400 flex items-center gap-1">
                          <Clock size={12} />
                          {pkg.duration}
                        </span>
                      )}
                    </div>
                  )}
                  {pkg.featuresFirst ? (
                    <>
                      <div className="lg:row-start-3 mt-3">{featuresList}</div>
                      <div className="lg:row-start-4 mt-5 pt-5 border-t border-white/10">{taglineDescription}</div>
                    </>
                  ) : (
                    <>
                      <div className="lg:row-start-3 mt-3">{taglineDescription}</div>
                      <div className="lg:row-start-4 mt-5 pt-5 border-t border-white/10">{featuresList}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Service intro + Contact info (Left Side) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/5 p-12 rounded-2xl shadow-sm border border-white/10 flex flex-col justify-between"
          >
            <div>
              <h2 className="font-serif text-3xl text-white mb-8 whitespace-pre-line">{settings.contactMessageTitle}</h2>

              {settings.kakaoChannelUrl && (
                <a
                  href={settings.kakaoChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 bg-[#FEE500] hover:brightness-95 text-[#191919] font-bold tracking-wide py-3.5 rounded-xl transition-all duration-300 shadow-sm mb-12"
                >
                  <MessageCircle size={18} />
                  <span>카카오톡 채널로 문의하기</span>
                </a>
              )}

              <div className="space-y-6">
                {policyGroups.map((group, groupIdx) => {
                  const Icon = POLICY_ICONS[group.id] || Sparkles;
                  return (
                    <div key={group.id} className={groupIdx > 0 ? 'pt-6 border-t border-white/10' : ''}>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Icon size={14} className="text-lime-300" />
                        {group.title}
                      </h3>
                      <ul className="space-y-2.5">
                        {group.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-stone-400 leading-relaxed">
                            <span className="text-stone-600 mt-0.5 shrink-0">·</span>
                            <span className="whitespace-pre-line">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Consultation Form (Right Side) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/5 p-10 md:p-12 rounded-2xl shadow-sm border border-white/10 w-full"
          >
            <h2 className="font-serif text-3xl text-white mb-2 whitespace-pre-line">{settings.contactFormTitle || '상담 신청'}</h2>
            <p className="text-stone-400 font-light text-sm mb-8 leading-relaxed whitespace-pre-line">
              {settings.contactFormDescription || '원하시는 촬영 조건과 목적을 기재해 주시면, 검토 후 이메일 또는 연락처로 신속히 안내해 드리겠습니다.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-stone-300 mb-2">이름 / 브랜드명 <span className="text-lime-300">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 홍길동 (또는 puff studio)"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-stone-500 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-lime-300/30 focus:border-lime-300/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-stone-300 mb-2">연락처 <span className="text-lime-300">*</span></label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-stone-500 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-lime-300/30 focus:border-lime-300/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-stone-300 mb-2">이메일 주소 <span className="text-lime-300">*</span></label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-stone-500 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-lime-300/30 focus:border-lime-300/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-stone-300 mb-2">희망 일정</label>
                <div className="relative">
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="대략적으로"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-stone-500 rounded-lg pl-4 pr-11 py-3 text-sm focus:ring-2 focus:ring-lime-300/30 focus:border-lime-300/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={openDatePicker}
                    aria-label="달력에서 날짜 선택"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-lime-300 transition-colors cursor-pointer"
                  >
                    <Calendar size={18} />
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    onChange={(e) => handleDatePicked(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                    tabIndex={-1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-stone-300 mb-2">촬영 목적 및 내용 <span className="text-lime-300">*</span></label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={settings.contactMessagePlaceholder || "촬영 목적(SNS 컨텐츠, 상세페이지, 숏폼 등)과 원하는 컨셉, 필요한 예상 컷 수/영상 갯수를 자유롭게 적어주세요.\n상담을 먼저 원하시면 '상담희망'이라고 남겨주셔도 됩니다."}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-stone-500 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-lime-300/30 focus:border-lime-300/50 transition-colors resize-none leading-relaxed"
                />
              </div>

              {submitStatus === 'success' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-sm text-center">
                  ✨ 상담 신청이 성공적으로 접수되었습니다. 지정하신 메일/연락처로 곧 연락해 드리겠습니다!
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg text-sm text-center">
                  ⚠️ 문의 발송 중 문제가 발생했습니다. 번거로우시겠지만 관리자 이메일({settings.contactEmail})로 직접 발송해 주세요.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full gradient-accent-bg hover:brightness-105 disabled:opacity-50 text-ink-950 font-bold tracking-widest uppercase py-4 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center space-x-2 cursor-pointer border-none"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-ink-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{settings.contactFormButtonText || '상담 신청하기'}</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
