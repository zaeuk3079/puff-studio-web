import React, { useState } from 'react';
import { useCMS, PortfolioItem } from '../../store/CMSContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, X, Check, GripVertical, Loader2, Pin } from 'lucide-react';
import { uploadImageToCloudCDN } from '../../utils/imageUtils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableGalleryItem({ id, url, isCover, onSetCover, onRemove }: { key?: React.Key, id: string, url: string, isCover: boolean, onSetCover: () => void, onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={`relative group rounded-lg overflow-hidden border-2 bg-stone-100 ${isCover ? 'border-burgundy-500' : 'border-transparent'}`}>
      <div {...attributes} {...listeners} className="absolute top-2 right-2 z-10 bg-stone-900/50 text-white p-1.5 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-900/80">
        <GripVertical size={16} />
      </div>
      <img src={url} alt="Gallery" className="w-full h-32 object-cover" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-stone-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center space-y-2 pointer-events-none">
        {!isCover && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onSetCover(); }} className="pointer-events-auto text-xs bg-white text-stone-900 px-3 py-1.5 rounded shadow font-medium hover:bg-stone-100">대표 설정</button>
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="pointer-events-auto text-xs bg-red-500 text-white px-3 py-1.5 rounded shadow font-medium hover:bg-red-600">삭제</button>
      </div>
      {isCover && (
        <div className="absolute top-2 left-2 bg-burgundy-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Cover</div>
      )}
    </div>
  );
}

function SortablePortfolioRow({ item, onEdit, onDelete, onTogglePin }: { key?: React.Key, item: PortfolioItem, onEdit: () => void, onDelete: () => void, onTogglePin: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-stone-50/50 transition-colors bg-white relative z-0">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div {...attributes} {...listeners} className="mr-4 text-stone-400 cursor-grab active:cursor-grabbing hover:text-stone-600 p-1">
            <GripVertical size={20} />
          </div>
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200">
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="focus:outline-none transition-transform hover:scale-110 p-1 cursor-pointer"
            title={item.isPinned ? "메인 상단 고정 해제" : "메인 상단 고정"}
          >
            <Pin
              size={16}
              className={item.isPinned
                ? "text-burgundy-600 fill-burgundy-600 hover:text-stone-400 hover:fill-transparent"
                : "text-stone-300 hover:text-burgundy-600 hover:fill-burgundy-600"
              }
            />
          </button>
          <div className="text-sm font-semibold text-stone-900">{item.title}</div>
        </div>
        <div className="text-sm text-stone-500 truncate max-w-xs mt-1">{item.description}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-600 uppercase tracking-wider">
          {item.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onClick={onEdit} className="text-stone-400 hover:text-burgundy-600 transition-colors mr-4" title="Edit">
          <Edit2 size={18} />
        </button>
        <button onClick={onDelete} className="text-stone-400 hover:text-red-600 transition-colors" title="Delete">
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}

export default function PortfolioManage() {
  const { portfolio, addPortfolioItem, updatePortfolioItem, deletePortfolioItem, reorderPortfolio, getGalleryImages } = useCMS();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<PortfolioItem>>({});
  const [tempUrl, setTempUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState({ done: 0, total: 0 });

  const legacyBase64Items = portfolio.filter(item => item.imageUrl?.startsWith('data:image'));

  const migrateBase64ImagesToCDN = async () => {
    if (legacyBase64Items.length === 0) return;
    if (!window.confirm(
      `${legacyBase64Items.length}개의 대표 이미지가 아직 Firestore에 base64로 저장되어 있어 페이지 로딩을 느리게 만들고 있습니다. ` +
      `지금 전부 Firebase Storage로 이전할까요? 이전 중에는 이 탭을 닫지 마세요.`
    )) return;

    setIsMigrating(true);
    setMigrationProgress({ done: 0, total: legacyBase64Items.length });
    let failCount = 0;

    for (const item of legacyBase64Items) {
      try {
        const res = await fetch(item.imageUrl);
        const blob = await res.blob();
        const file = new File([blob], `${item.id}.jpg`, { type: blob.type || 'image/jpeg' });
        const cdnUrl = await uploadImageToCloudCDN(file);
        if (cdnUrl.startsWith('data:image')) {
          // CDN upload itself failed and fell back to base64 again — don't count as success.
          failCount++;
        } else {
          await updatePortfolioItem(item.id, { imageUrl: cdnUrl });
        }
      } catch (err) {
        console.error('Migration failed for portfolio item', item.id, err);
        failCount++;
      }
      setMigrationProgress(prev => ({ ...prev, done: prev.done + 1 }));
    }

    setIsMigrating(false);
    alert(
      failCount === 0
        ? `이전 완료: ${legacyBase64Items.length}개 모두 성공했습니다.`
        : `이전 완료: ${legacyBase64Items.length - failCount}개 성공, ${failCount}개 실패했습니다. 실패한 항목은 다시 시도해주세요.`
    );
  };

  // Normalize mapping for categories (matching Home.tsx filters)
  const filteredPortfolio = portfolio.filter(item => {
    if (activeCategory === 'ALL') return true;
    
    const itemCat = item.category.toUpperCase().replace(/\s+/g, '');
    const activeCat = activeCategory.toUpperCase().replace(/\s+/g, '');
    
    if (activeCat === 'COMMERCIAL') {
      return itemCat === 'PRODUCT' || itemCat === 'COMMERCIAL';
    }
    if (activeCat === 'FOOD&BEVERAGE') {
      return itemCat === 'FOOD&BEVERAGE' || itemCat === 'FOOD' || itemCat === 'BEVERAGE';
    }
    if (activeCat === 'MODEL') {
      return itemCat === 'MODEL' || itemCat === 'PORTRAIT' || itemCat === 'SNAP' || itemCat === 'WEDDING';
    }
    if (activeCat === 'AI') {
      return itemCat === 'AI';
    }
    return itemCat === activeCat;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleEdit = async (item: PortfolioItem) => {
    setIsProcessing(true);
    try {
      const gallery = await getGalleryImages(item.id);
      setIsEditing(item.id);
      setFormData({ ...item, gallery });
    } catch (error) {
      console.error("Error loading gallery for edit:", error);
      setIsEditing(item.id);
      setFormData(item);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deletePortfolioItem(id);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      for (const file of files) {
        // Upload to the CDN (imgbb) and store a URL instead of a base64 data URI: embedding
        // full-resolution base64 images directly in Firestore documents made the portfolio
        // collection's read payload balloon to tens of MB, which every visitor downloaded in
        // full on every page load (the main cause of slow mobile loading).
        const cdnUrl = await uploadImageToCloudCDN(file, 2560, 0.82);

        setFormData(prev => {
          const newGallery = [...(prev.gallery || []), cdnUrl];
          return {
            ...prev,
            gallery: newGallery,
            imageUrl: prev.imageUrl || cdnUrl
          };
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeImage = (urlToRemove: string) => {
    setFormData(prev => {
      const newGallery = (prev.gallery || []).filter(url => url !== urlToRemove);
      let newImageUrl = prev.imageUrl;
      if (newImageUrl === urlToRemove) {
        newImageUrl = newGallery.length > 0 ? newGallery[0] : '';
      }
      return { ...prev, gallery: newGallery, imageUrl: newImageUrl };
    });
  };

  const setCoverImage = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
  };

  const handleDragEndGallery = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        if (!prev.gallery) return prev;
        const oldIndex = prev.gallery.indexOf(active.id as string);
        const newIndex = prev.gallery.indexOf(over.id as string);
        return { ...prev, gallery: arrayMove(prev.gallery, oldIndex, newIndex) };
      });
    }
  };

  const handleDragEndPortfolio = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeIndex = filteredPortfolio.findIndex(item => item.id === active.id);
      const overIndex = filteredPortfolio.findIndex(item => item.id === over.id);
      
      const reorderedFiltered = arrayMove(filteredPortfolio, activeIndex, overIndex);
      
      let newFullPortfolio: PortfolioItem[] = [];
      if (activeCategory === 'ALL') {
        newFullPortfolio = reorderedFiltered;
      } else {
        let filteredIdx = 0;
        newFullPortfolio = portfolio.map(item => {
          const itemCat = item.category.toUpperCase().replace(/\s+/g, '');
          const activeCat = activeCategory.toUpperCase().replace(/\s+/g, '');
          let matches = false;
          
          if (activeCat === 'COMMERCIAL') {
            matches = itemCat === 'PRODUCT' || itemCat === 'COMMERCIAL';
          } else if (activeCat === 'FOOD&BEVERAGE') {
            matches = itemCat === 'FOOD&BEVERAGE' || itemCat === 'FOOD' || itemCat === 'BEVERAGE';
          } else if (activeCat === 'MODEL') {
            matches = itemCat === 'MODEL' || itemCat === 'PORTRAIT' || itemCat === 'SNAP' || itemCat === 'WEDDING';
          } else if (activeCat === 'AI') {
            matches = itemCat === 'AI';
          } else {
            matches = itemCat === activeCat;
          }
          
          if (matches) {
            return reorderedFiltered[filteredIdx++];
          }
          return item;
        });
      }
      
      reorderPortfolio(newFullPortfolio);
    }
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      if (isEditing) {
        await updatePortfolioItem(isEditing, formData);
        setIsEditing(null);
      } else if (isAdding) {
        if (formData.title && formData.category && formData.imageUrl) {
          await addPortfolioItem(formData as Omit<PortfolioItem, 'id'>);
          setIsAdding(false);
        } else {
          alert('필수 항목(Title, Category, Image)을 모두 입력해주세요.');
          setIsProcessing(false);
          return;
        }
      }
      setFormData({});
      setTempUrl('');
    } catch (error) {
      console.error("Error saving portfolio item:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData({});
    setTempUrl('');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-stone-800 tracking-tight">Portfolio Management</h2>
          <p className="text-stone-500 mt-1">Add, edit, or remove works from your portfolio.</p>
        </div>
        {!isAdding && !isEditing && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-2 bg-burgundy-700 hover:bg-burgundy-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
          >
            <Plus size={18} />
            <span>Add New Item</span>
          </button>
        )}
      </div>

      {legacyBase64Items.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-amber-800">
            대표 이미지 <strong>{legacyBase64Items.length}개</strong>가 아직 Firestore에 직접 저장되어 있어 사이트 로딩을 느리게 만들고 있어요.
            {isMigrating && ` (이전 중: ${migrationProgress.done}/${migrationProgress.total})`}
          </p>
          <button
            onClick={migrateBase64ImagesToCDN}
            disabled={isMigrating}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            {isMigrating && <Loader2 size={14} className="animate-spin" />}
            <span>{isMigrating ? '이전 중...' : 'Firebase Storage로 이전하기 (속도 개선)'}</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className="text-lg font-semibold text-stone-800">
                {isEditing ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}
              </h3>
              <button onClick={handleCancel} className="text-stone-400 hover:text-stone-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors"
                    placeholder="e.g. Wedding in Seoul"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Category *</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors bg-white"
                  >
                    <option value="">카테고리 선택</option>
                    <option value="COMMERCIAL">COMMERCIAL</option>
                    <option value="MODEL">MODEL</option>
                    <option value="AI">AI</option>
                    <option value="Video">VIDEO (영상)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-3 cursor-pointer bg-stone-50 px-4 py-2.5 rounded-lg border border-stone-200 flex-1">
                    <input
                      type="checkbox"
                      checked={formData.isPinned || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                      className="w-5 h-5 text-burgundy-600 border-stone-300 rounded focus:ring-burgundy-500"
                    />
                    <span className="text-sm font-medium text-stone-700 flex items-center gap-2">
                      <Pin size={16} />
                      메인 화면에 고정 (Pin to Home)
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">대표 이미지 위치 (Object Position)</label>
                  <select
                    value={formData.objectPosition || 'center'}
                    onChange={(e) => setFormData(prev => ({ ...prev, objectPosition: e.target.value as any }))}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors bg-white"
                  >
                    <option value="top">상단 (Top)</option>
                    <option value="center">중앙 (Center)</option>
                    <option value="bottom">하단 (Bottom)</option>
                  </select>
                  <p className="text-[10px] text-stone-500 mt-1">가로/세로 비율에 따라 이미지가 잘릴 때 보여줄 기준점을 설정합니다.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Video URL (Optional)</label>
                <input
                  type="text"
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors"
                  placeholder="YouTube or Vimeo URL (e.g. https://www.youtube.com/watch?v=...)"
                />
                <p className="text-xs text-stone-500 mt-2">유튜브(YouTube) 또는 비메오(Vimeo) 영상 링크를 넣으시면 포트폴리오에 영상이 표시됩니다.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">영상 비율 선택 (Video Aspect Ratio)</label>
                <div className="flex space-x-4">
                  <label className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    (formData.videoAspectRatio || '16:9') === '16:9'
                      ? 'border-stone-900 bg-stone-900 text-white font-semibold'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}>
                    <input
                      type="radio"
                      name="videoAspectRatio"
                      value="16:9"
                      checked={(formData.videoAspectRatio || '16:9') === '16:9'}
                      onChange={() => setFormData(prev => ({ ...prev, videoAspectRatio: '16:9' }))}
                      className="sr-only"
                    />
                    <span>16:9 (가로 / 롱폼)</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.videoAspectRatio === '9:16'
                      ? 'border-stone-900 bg-stone-900 text-white font-semibold'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}>
                    <input
                      type="radio"
                      name="videoAspectRatio"
                      value="9:16"
                      checked={formData.videoAspectRatio === '9:16'}
                      onChange={() => setFormData(prev => ({ ...prev, videoAspectRatio: '9:16' }))}
                      className="sr-only"
                    />
                    <span>9:16 (세로 / 숏폼 / 릴스 / 쇼츠)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Images (Gallery) *</label>
                <div className="flex flex-wrap gap-3 mb-4">
                  <input
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg (URL 입력)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tempUrl && !(formData.gallery || []).includes(tempUrl)) {
                          setFormData(prev => ({
                            ...prev,
                            gallery: [...(prev.gallery || []), tempUrl],
                            imageUrl: prev.imageUrl || tempUrl
                          }));
                          setTempUrl('');
                        }
                      }
                    }}
                    className="flex-1 min-w-[200px] border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempUrl && !(formData.gallery || []).includes(tempUrl)) {
                        setFormData(prev => ({
                          ...prev,
                          gallery: [...(prev.gallery || []), tempUrl],
                          imageUrl: prev.imageUrl || tempUrl
                        }));
                        setTempUrl('');
                      }
                    }}
                    className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    URL 추가
                  </button>
                  <div className="relative overflow-hidden">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isProcessing}
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      disabled={isProcessing}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-4 py-2.5 rounded-lg font-medium transition-colors h-full whitespace-nowrap flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>처리 중...</span>
                        </>
                      ) : (
                        <span>+ PC에서 찾기</span>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-stone-500 mb-4">
                  여러 장의 사진을 추가할 수 있습니다. 대표 이미지를 지정해주세요. 이미지를 드래그하여 순서를 변경할 수 있습니다.
                  <br />
                  <span className="text-burgundy-600 font-medium">* 무료 고화질 모드: 2K 고해상도로 최대 8장까지 무제한 업로드 가능합니다.</span>
                </p>
                
                {(formData.gallery && formData.gallery.length > 0) ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndGallery}>
                    <SortableContext items={formData.gallery} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                        {formData.gallery.map((imgUrl) => (
                          <SortableGalleryItem
                            key={imgUrl}
                            id={imgUrl}
                            url={imgUrl}
                            isCover={formData.imageUrl === imgUrl}
                            onSetCover={() => setCoverImage(imgUrl)}
                            onRemove={() => removeImage(imgUrl)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  formData.imageUrl && (
                    <div className="mt-4 w-32 h-32 rounded-lg overflow-hidden border border-stone-200">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-500 transition-colors resize-none"
                  placeholder="Short description of the work..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-100">
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 text-stone-600 font-medium hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 bg-burgundy-700 hover:bg-burgundy-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Save Item</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs for Sorting & Filtering */}
      <div className="flex flex-wrap gap-2 mb-6 text-xs font-semibold uppercase tracking-wider bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
        {['ALL', 'COMMERCIAL', 'MODEL', 'AI', 'Video'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4.5 py-2.5 rounded-full border transition-all duration-300 cursor-pointer ${
              activeCategory === cat 
                ? 'bg-stone-900 border-stone-900 text-white shadow-sm font-bold' 
                : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Image</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndPortfolio}>
              <SortableContext items={filteredPortfolio.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-stone-100">
                  {filteredPortfolio.map((item) => (
                    <SortablePortfolioRow
                      key={item.id}
                      item={item}
                      onEdit={() => handleEdit(item)}
                      onDelete={() => handleDelete(item.id)}
                      onTogglePin={() => updatePortfolioItem(item.id, { isPinned: !item.isPinned })}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
          {filteredPortfolio.length === 0 && (
            <div className="p-12 text-center text-stone-500">
              No portfolio items found. Add some to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
