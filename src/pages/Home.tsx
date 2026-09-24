import { useState, useEffect } from 'react';
import { useCMS, PortfolioItem } from '../store/CMSContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

// Helper function to get embed URL from YouTube or Vimeo link with autoplay
const getEmbedUrl = (url: string, autoPlay: boolean = true) => {
  if (!url) return null;
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch && ytMatch[1]) {
    const autoPlayParam = autoPlay ? '?autoplay=1&rel=0' : '';
    return { type: 'youtube', url: `https://www.youtube.com/embed/${ytMatch[1]}${autoPlayParam}` };
  }
  
  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    const autoPlayParam = autoPlay ? '?autoplay=1' : '';
    return { type: 'vimeo', url: `https://player.vimeo.com/video/${vimeoMatch[1]}${autoPlayParam}` };
  }
  
  // Direct video file
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return { type: 'direct', url: url };
  }
  
  return null;
};

// Helper function to determine aspect ratio for video items
const getItemVideoAspectRatio = (item: PortfolioItem): '16:9' | '9:16' => {
  if (item.videoAspectRatio) return item.videoAspectRatio;
  if (item.videoUrl && (item.videoUrl.includes('/shorts/') || item.videoUrl.includes('reels'))) {
    return '9:16';
  }
  return '16:9';
};

export default function Home() {
  const { settings, portfolio, getGalleryImages } = useCMS();
  
  const [activeCategory, setActiveCategory] = useState<'Photography' | 'Video'>('Photography');
  const [subCategory, setSubCategory] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)');
    setIsMobileViewport(mql.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  // Filter portfolio based on 3 main categories: Photography, Video, AI
  const filteredPortfolio = portfolio.filter(item => {
    const itemCat = (item.category || '').toUpperCase().replace(/\s+/g, '');
    
    if (activeCategory === 'AI') {
      return itemCat === 'AI';
    }
    if (activeCategory === 'Video') {
      return item.category === 'Video' || !!item.videoUrl;
    }
    
    // activeCategory === 'Photography'
    if (item.category === 'Video' || itemCat === 'AI') return false;
    if (subCategory === 'ALL') return true;
    
    if (subCategory === 'COMMERCIAL') {
      return itemCat === 'PRODUCT' || itemCat === 'COMMERCIAL' || itemCat.includes('FOOD') || itemCat.includes('BEVERAGE');
    }
    if (subCategory === 'MODEL') {
      return itemCat === 'MODEL' || itemCat === 'PORTRAIT' || itemCat === 'SNAP' || itemCat === 'WEDDING';
    }
    return false;
  });

  // Split video items by aspect ratio
  const videoItems16x9 = filteredPortfolio.filter(item => getItemVideoAspectRatio(item) === '16:9');
  const videoItems9x16 = filteredPortfolio.filter(item => getItemVideoAspectRatio(item) === '9:16');

  const handleItemClick = async (item: PortfolioItem) => {
    setSelectedItem(item);
    
    // If it's a video item, do not fetch extra gallery images so it directly plays the video in lightbox
    if (item.videoUrl || item.category === 'Video') {
      setGalleryImages([]);
      setIsLoadingGallery(false);
      return;
    }

    setIsLoadingGallery(true);
    try {
      const images = await getGalleryImages(item.id);
      setGalleryImages(images.length > 0 ? images : [item.imageUrl]);
    } catch (error) {
      console.error("Error loading gallery:", error);
      setGalleryImages([item.imageUrl]);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedItem]);

  const isSelectedVideo = selectedItem && (!!selectedItem.videoUrl || selectedItem.category === 'Video');
  const selectedVideoRatio = selectedItem ? getItemVideoAspectRatio(selectedItem) : '16:9';

  return (
    <div className="bg-ink-950 text-white min-h-screen pb-16">
      {/* Main Hero Banner — edge-to-edge, square corners, dark fade + brand copy + CTA, sits flush under header */}
      {settings.heroImage && (
        <div className="w-full mb-8 relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full overflow-hidden relative sm:min-h-[500px] sm:max-h-[820px]"
            style={{
              aspectRatio: isMobileViewport
                ? 4 / 3
                : (settings.heroAspectRatio === '16:9' ? 16 / 9 : settings.heroAspectRatio === '4:3' ? 4 / 3 : 3 / 2),
              maxHeight: isMobileViewport ? 520 : undefined,
            }}
          >
              {/* Single High-Resolution Premium Hero Banner Image */}
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={settings.heroImage || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=100&w=2800&auto=format&fit=crop'}
                  alt={settings.heroText || settings.siteName}
                  className="w-full h-full object-cover select-none"
                  style={{
                    objectPosition: settings.heroObjectPosition || 'center',
                    imageRendering: '-webkit-optimize-contrast',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                  referrerPolicy="no-referrer"
                />
                {/* Dark fade for legibility, anibada-style (halved strength) */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 via-ink-950/25 to-ink-950/5" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-950/35 via-transparent to-transparent" />
              </div>

              {/* Brand Copy Container — stays within the image's own box so the CTA button never
                  spills outside the banner; anchored to the bottom with mobile-friendly padding. */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end pb-4 sm:pb-7 md:pb-8 lg:pb-10">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[92%] md:max-w-2xl flex flex-col items-start">
            {settings.heroSubText && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                  fontSize: `clamp(11px, 2.5vw, ${settings.heroSubTextFontSize || 14}px)`,
                  letterSpacing: `${settings.heroSubTextLetterSpacing ?? 1}px`,
                  fontFamily: settings.heroSubTextFontFamily || 'Pretendard',
                }}
                className="uppercase font-bold leading-tight mb-1.5 sm:mb-3 tracking-widest gradient-accent-text whitespace-pre-line"
              >
                {settings.heroSubText}
              </motion.p>
            )}
            {settings.heroText && (
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{
                  fontSize: `clamp(24px, 6vw, ${settings.heroTextFontSize || 64}px)`,
                  letterSpacing: `${settings.heroTextLetterSpacing ?? 0}px`,
                  fontFamily: settings.heroTextFontFamily || 'Pretendard',
                  color: settings.heroTextColor || '#FFFFFF',
                }}
                className="font-black leading-none sm:leading-[1.05] drop-shadow-lg whitespace-pre-line"
              >
                {settings.heroText}
              </motion.h2>
            )}
            {settings.heroDescription && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{
                  fontSize: `clamp(10.5px, 2vw, ${settings.heroDescriptionFontSize || 16}px)`,
                  letterSpacing: `${settings.heroDescriptionLetterSpacing ?? 0}px`,
                  fontFamily: settings.heroDescriptionFontFamily || 'Pretendard',
                  color: settings.heroDescriptionColor || (isMobileViewport ? '#F5F5F4' : '#D6D3D1'),
                }}
                className="mt-3 sm:mt-5 leading-snug sm:leading-relaxed max-w-xl whitespace-pre-line"
              >
                {settings.heroDescription}
              </motion.p>
            )}
            {settings.heroCtaText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mt-5 sm:mt-8"
              >
                <Link
                  to={settings.heroCtaLink || '/contact'}
                  style={{ color: settings.heroCtaTextColor || '#0B0C10' }}
                  className="inline-flex items-center justify-center gradient-accent-bg font-bold text-xs sm:text-base px-4 py-2 sm:px-7 sm:py-3.5 rounded-xl shadow-lg shadow-lime-300/10 hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                >
                  {settings.heroCtaText}
                </Link>
              </motion.div>
            )}
            </div>
            </div>
          </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Header & Filter */}
        <div className="mb-16 mt-2">
          <div className="mb-8">
            <h1
              className="uppercase font-black whitespace-pre-line"
              style={{
                fontSize: `clamp(28px, 5vw, ${settings.homePortfolioTitleFontSize || 48}px)`,
                fontFamily: settings.homePortfolioTitleFontFamily || '"Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif',
                letterSpacing: `${settings.homePortfolioTitleLetterSpacing ?? 1}px`,
                color: settings.homePortfolioTitleColor || '#FFFFFF',
              }}
            >
              {settings.homePortfolioTitle || 'Work'}
            </h1>
            {settings.homePortfolioSubText && (
              <p
                style={{
                  fontSize: `${settings.homePortfolioSubTextFontSize || 14}px`,
                  letterSpacing: `${settings.homePortfolioSubTextLetterSpacing ?? 1}px`,
                  fontFamily: '"Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif',
                  color: settings.homePortfolioSubTextColor || undefined,
                }}
                className="font-medium mt-2 text-stone-400 whitespace-pre-line"
              >
                {settings.homePortfolioSubText}
              </p>
            )}
          </div>

          <div className="flex space-x-12 text-sm font-semibold tracking-[0.2em] border-b border-white/10 pb-4">
            <button
              onClick={() => {
                setActiveCategory('Photography');
                setSubCategory('ALL');
              }}
              className={`transition-all duration-300 cursor-pointer pb-4 -mb-5 border-b-2 ${
                activeCategory === 'Photography'
                  ? 'border-lime-300 text-lime-300 font-bold'
                  : 'border-transparent text-stone-400 hover:text-white'
              }`}
            >
              사진
            </button>
            <button
              onClick={() => setActiveCategory('Video')}
              className={`transition-all duration-300 cursor-pointer pb-4 -mb-5 border-b-2 ${
                activeCategory === 'Video'
                  ? 'border-lime-300 text-lime-300 font-bold'
                  : 'border-transparent text-stone-400 hover:text-white'
              }`}
            >
              영상
            </button>
            <button
              onClick={() => setActiveCategory('AI')}
              className={`transition-all duration-300 cursor-pointer pb-4 -mb-5 border-b-2 ${
                activeCategory === 'AI'
                  ? 'border-lime-300 text-lime-300 font-bold'
                  : 'border-transparent text-stone-400 hover:text-white'
              }`}
            >
              AI
            </button>
          </div>

          {/* Subcategories (only under Photography) */}
          {activeCategory === 'Photography' && (
            <div className="flex flex-wrap gap-3 mt-8 text-[11px] tracking-wider uppercase font-semibold text-stone-400">
              {[{ value: 'ALL', label: 'ALL' }, { value: 'COMMERCIAL', label: 'PRODUCT' }, { value: 'MODEL', label: 'MODEL' }].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSubCategory(value)}
                  className={`px-5 py-2.5 rounded-full border transition-all duration-300 cursor-pointer ${
                    subCategory === value
                      ? 'gradient-accent-bg border-transparent text-ink-950 shadow-sm font-bold'
                      : 'bg-white/5 border-white/10 text-stone-400 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Display: Photography vs Video (No Border, 3px Corner Radius) */}
        {activeCategory === 'Video' ? (
          <div className="space-y-16">
            {/* 16:9 Landscape Video Section */}
            {videoItems16x9.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {videoItems16x9.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.3) }}
                    className="w-full group cursor-pointer bg-stone-900 border-0 rounded-[3px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-stone-200/30 transition-all duration-500 hover:-translate-y-1 relative"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="relative overflow-hidden w-full" style={{ aspectRatio: '16/9' }}>
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        referrerPolicy="no-referrer"
                        loading={isMobileViewport ? 'lazy' : undefined}
                        decoding={isMobileViewport ? 'async' : undefined}
                      />
                      <div className="absolute inset-0 bg-stone-900/30 group-hover:bg-stone-900/15 transition-colors duration-500 flex items-center justify-center">
                        <div className="bg-stone-900/70 backdrop-blur-md text-white p-3.5 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110">
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-4 right-4 text-white text-xs font-semibold drop-shadow-md truncate">
                        {item.title}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 9:16 Vertical Shorts Section */}
            {videoItems9x16.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
                {videoItems9x16.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.3) }}
                    className="w-full group cursor-pointer bg-stone-900 border-0 rounded-[3px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-stone-200/30 transition-all duration-500 hover:-translate-y-1 relative"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="relative overflow-hidden w-full" style={{ aspectRatio: '9/16' }}>
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        referrerPolicy="no-referrer"
                        loading={isMobileViewport ? 'lazy' : undefined}
                        decoding={isMobileViewport ? 'async' : undefined}
                      />
                      <div className="absolute inset-0 bg-stone-900/30 group-hover:bg-stone-900/15 transition-colors duration-500 flex items-center justify-center">
                        <div className="bg-stone-900/70 backdrop-blur-md text-white p-3 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110">
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-semibold drop-shadow-md truncate text-center">
                        {item.title}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredPortfolio.length === 0 && (
              <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/5 text-stone-400 text-sm">
                등록된 영상 포트폴리오가 없습니다.
              </div>
            )}
          </div>
        ) : (
          /* Photography Grid (No Border, 3px Corner Radius) */
          filteredPortfolio.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {filteredPortfolio.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.3) }}
                  className="w-full group cursor-pointer bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/20 transition-all duration-500 hover:-translate-y-1 relative"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="relative overflow-hidden w-full" style={{ aspectRatio: '3/4' }}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      referrerPolicy="no-referrer"
                      loading={isMobileViewport ? 'lazy' : undefined}
                      decoding={isMobileViewport ? 'async' : undefined}
                    />
                    
                    {item.videoUrl && (
                      <div className="absolute bottom-4 right-4 bg-stone-900/60 backdrop-blur-sm text-white p-2.5 rounded-full z-10 shadow-md">
                        <Play size={14} fill="currentColor" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-stone-900/[0.01] group-hover:bg-transparent transition-colors duration-500" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/5 text-stone-400 text-sm">
              등록된 포트폴리오가 없습니다.
            </div>
          )
        )}
      </div>

      {/* About Snippet */}
      {settings.showHomeAbout !== false && (
        <section className="py-24 bg-ink-900 border-t border-white/5 mt-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-8 italic">The Studio</h2>
            <p className="text-lg md:text-xl text-stone-400 leading-relaxed font-light">
              {settings.aboutText}
            </p>
            <div className="mt-12">
              <Link to="/about" className="text-lime-300 hover:text-lime-200 uppercase tracking-widest text-sm font-semibold border-b border-lime-300/40 pb-1 transition-colors">
                Read Our Story
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-md p-4 md:p-8 overflow-y-auto"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-stone-900 w-full overflow-hidden shadow-2xl relative my-auto rounded-[3px] border border-stone-800 ${
                isSelectedVideo && selectedVideoRatio === '9:16'
                  ? 'max-w-sm md:max-w-md'
                  : 'max-w-4xl'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-20 bg-stone-800/80 hover:bg-stone-700 text-white p-2.5 rounded-full transition-colors shadow-lg backdrop-blur-sm"
              >
                <X size={18} />
              </button>
              
              {/* Video Player or Photo Gallery */}
              {isSelectedVideo ? (
                <div className="flex flex-col bg-black">
                  <div 
                    className="relative w-full bg-black flex items-center justify-center"
                    style={{ aspectRatio: selectedVideoRatio === '9:16' ? '9/16' : '16/9' }}
                  >
                    {selectedItem.videoUrl && getEmbedUrl(selectedItem.videoUrl, true) ? (
                      getEmbedUrl(selectedItem.videoUrl, true)?.type === 'direct' ? (
                        <video 
                          src={getEmbedUrl(selectedItem.videoUrl, true)!.url} 
                          controls 
                          autoPlay
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <iframe
                          src={getEmbedUrl(selectedItem.videoUrl, true)!.url}
                          title={selectedItem.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      )
                    ) : (
                      <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full h-full object-contain" />
                    )}
                  </div>
                  <div className="p-6 bg-stone-900 text-white border-t border-stone-800">
                    <h3 className="text-xl font-bold mb-1">{selectedItem.title}</h3>
                    {selectedItem.description && (
                      <p className="text-sm text-stone-400 font-light mt-2 leading-relaxed">{selectedItem.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Photo Lightbox */
                <div className="bg-white rounded-[3px] overflow-hidden">
                  <div className="p-8 md:p-10 border-b border-stone-100">
                    <h2 className="font-serif text-2xl md:text-3xl text-stone-900 mb-2">{selectedItem.title}</h2>
                    <p className="text-xs text-stone-400 tracking-widest uppercase mb-4 font-semibold">{selectedItem.category}</p>
                    <p className="text-stone-600 font-light text-sm leading-relaxed max-w-2xl">{selectedItem.description}</p>
                  </div>

                  <div className="p-4 md:p-8 bg-stone-50 max-h-[70vh] overflow-y-auto">
                    <div className="flex flex-col gap-6">
                      {isLoadingGallery ? (
                        <div className="flex justify-center items-center py-16">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-800"></div>
                        </div>
                      ) : (
                        galleryImages.map((imgUrl, idx) => (
                          <div key={idx} className="relative w-full flex justify-center bg-white rounded-[3px] overflow-hidden shadow-sm">
                            <img
                              src={imgUrl}
                              alt={`${selectedItem.title} - ${idx + 1}`}
                              className="w-full h-auto object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
