import { useState, useRef } from 'react';
import type { ContentGenerateRequest, GeneratedContent } from '@/types';
import { LANGUAGES } from '@/lib/languages';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/lib/useTranslation';

export function ContentGenerator() {
  const appLanguage = useLanguageStore(s => s.language);
  const [language, setLanguage] = useState(appLanguage);
  const [productServiceTopic, setProductServiceTopic] = useState('');
  const [brandName, setBrandName] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [numCarouselSlides, setNumCarouselSlides] = useState(3);
  const [numCollageSlots, setNumCollageSlots] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'post' | 'reels' | 'carousel' | 'collage'>('post');
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const planLabel = user?.plan === 'pro' ? 'FikirBiz Pro' : 'FikirBiz Basic';
  const contentDataRef = useRef<'carousel' | 'collage' | null>(null);

  const handleGenerate = async () => {
    if (!productServiceTopic.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    contentDataRef.current = null;

    const request: ContentGenerateRequest = {
      language,
      productServiceTopic: productServiceTopic.trim(),
      brandName: brandName.trim() || undefined,
      keyFeatures: keyFeatures.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
      callToAction: callToAction.trim() || undefined,
      numCarouselSlides: activeTab === 'carousel' ? numCarouselSlides : undefined,
      numCollageSlots: activeTab === 'collage' ? numCollageSlots : undefined,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/content/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          language: request.language,
          product_service_topic: request.productServiceTopic,
          brand_name: request.brandName,
          key_features: request.keyFeatures,
          target_audience: request.targetAudience,
          call_to_action: request.callToAction,
          num_carousel_slides: request.numCarouselSlides,
          num_collage_slots: request.numCollageSlots,
        }),
      });

      if (!response.ok) {
        throw new Error('Content generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsLoading(false);
                if (activeTab === 'carousel' && contentDataRef.current !== 'carousel') {
                  setError('Carousel generasiyası hələ aktiv deyil. Backend yenilənir, biraz sonra yenidən cəhd edin.');
                } else if (activeTab === 'collage' && contentDataRef.current !== 'collage') {
                  setError('Kollaj generasiyası hələ aktiv deyil. Backend yenilənir, biraz sonra yenidən cəhd edin.');
                }
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content') {
                  const raw = parsed.data;
                  const rawCarousel = raw.carousel;
                  const rawCollage = raw.collage;
                  const mappedContent: GeneratedContent = {
                    post: {
                      title: raw.post?.title || '',
                      caption: raw.post?.caption || '',
                      visualSuggestion: raw.post?.visual_suggestion || '',
                      hashtags: raw.post?.hashtags || [],
                    },
                    reels: {
                      script: raw.reels?.script || '',
                      caption: raw.reels?.caption || '',
                      hashtags: raw.reels?.hashtags || [],
                    },
                    carousel: Array.isArray(rawCarousel)
                      ? rawCarousel.map((s: Record<string, string>) => ({
                          title: s.title || '',
                          caption: s.caption || '',
                          visualSuggestion: s.visual_suggestion || '',
                        }))
                      : [],
                    collage: rawCollage && typeof rawCollage === 'object'
                      ? {
                          theme: rawCollage.theme || '',
                          layout: rawCollage.layout || '',
                          colorPalette: rawCollage.color_palette || '',
                          slots: Array.isArray(rawCollage.slots)
                            ? rawCollage.slots.map((s: Record<string, string>) => ({
                                slotTitle: s.slot_title || '',
                                photoDescription: s.photo_description || '',
                                visualStyle: s.visual_style || '',
                                compositionNotes: s.composition_notes || '',
                              }))
                            : [],
                        }
                      : null,
                  };
                  if (mappedContent.carousel.length > 0) {
                    contentDataRef.current = 'carousel';
                  }
                  if (mappedContent.collage && mappedContent.collage.slots.length > 0) {
                    contentDataRef.current = 'collage';
                  }
                  setGeneratedContent(mappedContent);
                } else if (parsed.type === 'error') {
                  setError(parsed.data);
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    if (!generatedContent) return;
    if (activeTab === 'carousel') {
      const allText = generatedContent.carousel
        .map((slide, i) => `--- Slayd ${i + 1} ---\n${slide.title}\n\n${slide.caption}\n\n🖼️ Vizual Təklif:\n${slide.visualSuggestion}`)
        .join('\n\n');
      handleCopy(allText, 'all-carousel');
    } else if (activeTab === 'collage' && generatedContent.collage) {
      const c = generatedContent.collage;
      const slotsText = c.slots
        .map((s, i) => `--- Slot ${i + 1}: ${s.slotTitle} ---\n📸 Fototəsvir: ${s.photoDescription}\n🎨 Vizual stil: ${s.visualStyle}\n📐 Kompozisiya: ${s.compositionNotes}`)
        .join('\n\n');
      const allText = `🎯 Mövzu: ${c.theme}\n📐 Layout: ${c.layout}\n🎨 Rəng Palitrası: ${c.colorPalette}\n\n${slotsText}`;
      handleCopy(allText, 'all-collage');
    } else if (activeTab === 'post') {
      const fullText = `${generatedContent.post.title}\n\n${generatedContent.post.caption}\n\n🖼️ Vizual Təklif:\n${generatedContent.post.visualSuggestion}\n\n${generatedContent.post.hashtags.map(h => `#${h.replace(/^#+/, '')}`).join(' ')}`;
      handleCopy(fullText, 'all-post');
    } else {
      const fullText = `${generatedContent.reels.script}\n\n---\n\n${generatedContent.reels.caption}\n\n${generatedContent.reels.hashtags.map(h => `#${h.replace(/^#+/, '')}`).join(' ')}`;
      handleCopy(fullText, 'all-reels');
    }
  };

  return (
    <div className="min-h-screen bg-brand-ivory">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">
            💡 {planLabel}
          </h1>
          <p className="text-brand-khaki">
            {t('contentDesc')}
          </p>
        </div>

        {/* Form Card */}
        <div className="relative z-10 bg-white rounded-2xl shadow-lg p-6 mb-6 border border-brand-gray">
          {/* Content Type Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none -mx-2 px-2 snap-x snap-mandatory">
            <button
              onClick={() => setActiveTab('post')}
              className={`snap-start shrink-0 flex-1 min-w-0 py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                activeTab === 'post'
                  ? 'bg-brand-navy text-brand-gold shadow-lg shadow-brand-navy/15'
                  : 'bg-brand-ivory text-brand-khaki hover:bg-brand-gray/30'
              }`}
            >
              <span className="sm:hidden">📸</span>
              <span className="hidden sm:inline">📸 {t('instagramPost')}</span>
            </button>
            <button
              onClick={() => setActiveTab('reels')}
              className={`snap-start shrink-0 flex-1 min-w-0 py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                activeTab === 'reels'
                  ? 'bg-brand-navy text-brand-gold shadow-lg shadow-brand-navy/15'
                  : 'bg-brand-ivory text-brand-khaki hover:bg-brand-gray/30'
              }`}
            >
              <span className="sm:hidden">🎬</span>
              <span className="hidden sm:inline">🎬 {t('instagramReels')}</span>
            </button>
            <button
              onClick={() => setActiveTab('carousel')}
              className={`snap-start shrink-0 flex-1 min-w-0 py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                activeTab === 'carousel'
                  ? 'bg-brand-navy text-brand-gold shadow-lg shadow-brand-navy/15'
                  : 'bg-brand-ivory text-brand-khaki hover:bg-brand-gray/30'
              }`}
            >
              <span className="sm:hidden">🎠</span>
              <span className="hidden sm:inline">🎠 Carousel</span>
            </button>
            <button
              onClick={() => setActiveTab('collage')}
              className={`snap-start shrink-0 flex-1 min-w-0 py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                activeTab === 'collage'
                  ? 'bg-brand-navy text-brand-gold shadow-lg shadow-brand-navy/15'
                  : 'bg-brand-ivory text-brand-khaki hover:bg-brand-gray/30'
              }`}
            >
              <span className="sm:hidden">🖼️</span>
              <span className="hidden sm:inline">🖼️ Kollaj</span>
            </button>
          </div>

          {/* Language Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-brand-gold">🌐</span>
              <span className="text-xs font-semibold text-brand-khaki uppercase tracking-wide">{t('language')}</span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 bg-brand-ivory border border-brand-gray rounded-xl text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.label}>{lang.flag} {lang.label}</option>
              ))}
            </select>
          </div>

          {/* Product/Service Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-brand-gold">📋</span>
              <span className="text-xs font-semibold text-brand-khaki uppercase tracking-wide">{t('productDetails')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-brand-khaki mb-1">
                  {t('productTopic')} <span className="text-red-500">{t('required')}</span>
                </label>
                <input
                  type="text"
                  value={productServiceTopic}
                  onChange={(e) => setProductServiceTopic(e.target.value)}
                  placeholder="e.g. Handmade leather bags"
                  className="w-full px-4 py-3 bg-brand-ivory border border-brand-gray rounded-xl text-brand-navy placeholder-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-brand-khaki mb-1">
                  {t('brandName')} <span className="text-brand-gray">{t('optional')}</span>
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. LuxiLeather"
                  className="w-full px-4 py-3 bg-brand-ivory border border-brand-gray rounded-xl text-brand-navy placeholder-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-brand-khaki mb-1">
                {t('keyFeatures')} <span className="text-brand-gray">{t('optional')}</span>
              </label>
              <textarea
                value={keyFeatures}
                onChange={(e) => setKeyFeatures(e.target.value)}
                placeholder="e.g. Handcrafted, durable, eco-friendly, premium materials"
                rows={3}
                className="w-full px-4 py-3 bg-brand-ivory border border-brand-gray rounded-xl text-brand-navy placeholder-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-brand-khaki mb-1">
                  {t('targetAudience')} <span className="text-brand-gray">{t('optional')}</span>
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Professionals aged 25-40"
                  className="w-full px-4 py-3 bg-brand-ivory border border-brand-gray rounded-xl text-brand-navy placeholder-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-brand-khaki mb-1">
                  {t('callToAction')} <span className="text-brand-gray">{t('optional')}</span>
                </label>
                <input
                  type="text"
                  value={callToAction}
                  onChange={(e) => setCallToAction(e.target.value)}
                  placeholder="e.g. Shop via link in bio"
                  className="w-full px-4 py-3 bg-brand-ivory border border-brand-gray rounded-xl text-brand-navy placeholder-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                />
              </div>
            </div>

            {/* Carousel / Collage Slots Input */}
            {activeTab === 'carousel' && (
              <div className="mb-4">
                <label className="block text-sm text-brand-khaki mb-1">
                  🎠 Slayd sayı
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={numCarouselSlides}
                    onChange={(e) => setNumCarouselSlides(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    className="w-24 px-4 py-3 bg-brand-ivory border border-brand-gray rounded-xl text-brand-navy placeholder-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent text-center font-semibold text-lg"
                  />
                  <span className="text-sm text-brand-khaki">slayd</span>
                </div>
              </div>
            )}
            {activeTab === 'collage' && (
              <div className="mb-4">
                <label className="block text-sm text-brand-khaki mb-1">
                  🖼️ Foto slot sayı
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={numCollageSlots}
                    onChange={(e) => setNumCollageSlots(Math.max(2, Math.min(12, parseInt(e.target.value) || 2)))}
                    className="w-24 px-4 py-3 bg-brand-ivory border border-brand-gray rounded-xl text-brand-navy placeholder-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent text-center font-semibold text-lg"
                  />
                  <span className="text-sm text-brand-khaki">foto</span>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!productServiceTopic.trim() || isLoading}
              className="w-full py-4 bg-brand-gold text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('generating')}
                </span>
              ) : (
                `✨ ${activeTab === 'carousel' ? `${numCarouselSlides} Slaydlı Carousel Yarat` : activeTab === 'collage' ? `${numCollageSlots} Fotolu Kollaj Yarat` : t('generateContent')}`
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {/* Generated Content */}
        {generatedContent && activeTab === 'carousel' && generatedContent.carousel.length > 0 && (
          <div className="relative z-10 bg-white rounded-2xl shadow-lg border border-brand-gray overflow-hidden">
            <div className="p-6">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleCopyAll}
                  className="px-4 py-2 bg-brand-ivory hover:bg-brand-gray text-brand-khaki rounded-lg text-sm font-medium transition-colors"
                >
                  {copiedField === 'all-carousel' ? `✓ ${t('copied')}` : `📋 Hamısını Kopyala`}
                </button>
              </div>

              <div className="space-y-6">
                {generatedContent.carousel.map((slide, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-brand-navy to-[#0a1520] rounded-2xl p-6 text-white shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold text-brand-navy font-bold text-sm">
                        {i + 1}
                      </span>
                      <button
                        onClick={() => handleCopy(`--- Slayd ${i + 1} ---\n${slide.title}\n\n${slide.caption}\n\n🖼️ Vizual Təklif:\n${slide.visualSuggestion}`, `carousel-${i}`)}
                        className="text-xs text-brand-gold/70 hover:text-brand-gold transition-colors"
                      >
                        {copiedField === `carousel-${i}` ? `✓ ${t('copied')}` : t('copy')}
                      </button>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-brand-gold mb-3">
                      {slide.title}
                    </h3>

                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap mb-4">
                      {slide.caption}
                    </p>

                    <div className="border-t border-white/10 pt-3 mt-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold/60">🖼️ Vizual Təklif</span>
                      <p className="text-sm text-white/60 italic mt-1">
                        {slide.visualSuggestion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {generatedContent && activeTab === 'collage' && generatedContent.collage && generatedContent.collage.slots.length > 0 && (
          <div className="relative z-10 bg-white rounded-2xl shadow-lg border border-brand-gray overflow-hidden">
            <div className="p-6">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleCopyAll}
                  className="px-4 py-2 bg-brand-ivory hover:bg-brand-gray text-brand-khaki rounded-lg text-sm font-medium transition-colors"
                >
                  {copiedField === 'all-collage' ? `✓ ${t('copied')}` : '📋 Hamısını Kopyala'}
                </button>
              </div>

              {/* Collage Header */}
              <div className="bg-gradient-to-br from-purple-900/10 via-pink-900/5 to-brand-navy/10 rounded-2xl p-6 mb-6 border border-purple-200/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🖼️</span>
                  <h2 className="text-xl font-bold text-brand-navy">Kollaj İdeyası</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
                  <div className="bg-white/70 rounded-xl p-4">
                    <span className="text-xs font-semibold text-brand-khaki uppercase tracking-wide">🎯 Mövzu</span>
                    <p className="text-brand-navy font-medium mt-1">{generatedContent.collage.theme}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4">
                    <span className="text-xs font-semibold text-brand-khaki uppercase tracking-wide">📐 Layout</span>
                    <p className="text-brand-navy font-medium mt-1">{generatedContent.collage.layout}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4">
                    <span className="text-xs font-semibold text-brand-khaki uppercase tracking-wide">🎨 Rəng Palitrası</span>
                    <p className="text-brand-navy font-medium mt-1">{generatedContent.collage.colorPalette}</p>
                  </div>
                </div>
              </div>

              {/* Collage Slots */}
              <div className="space-y-4">
                {generatedContent.collage.slots.map((slot, i) => (
                  <div key={i} className="bg-white border border-brand-gray rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm shadow-md">
                          {i + 1}
                        </span>
                        <h3 className="font-semibold text-brand-navy">{slot.slotTitle}</h3>
                      </div>
                      <button
                        onClick={() => handleCopy(`--- Slot ${i + 1}: ${slot.slotTitle} ---\n📸 ${slot.photoDescription}\n🎨 ${slot.visualStyle}\n📐 ${slot.compositionNotes}`, `collage-${i}`)}
                        className="text-xs text-brand-gold hover:text-brand-gold transition-colors"
                      >
                        {copiedField === `collage-${i}` ? `✓ ${t('copied')}` : t('copy')}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      <div className="bg-brand-ivory rounded-lg p-3">
                        <span className="text-xs font-semibold text-brand-khaki">📸 Fototəsvir</span>
                        <p className="text-sm text-brand-navy mt-1">{slot.photoDescription}</p>
                      </div>
                      <div className="bg-brand-ivory rounded-lg p-3">
                        <span className="text-xs font-semibold text-brand-khaki">🎨 Vizual stil</span>
                        <p className="text-sm text-brand-navy mt-1">{slot.visualStyle}</p>
                      </div>
                      <div className="bg-brand-ivory rounded-lg p-3">
                        <span className="text-xs font-semibold text-brand-khaki">📐 Kompozisiya</span>
                        <p className="text-sm text-brand-navy mt-1">{slot.compositionNotes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {generatedContent && activeTab !== 'carousel' && activeTab !== 'collage' && (
          <div className="relative z-10 bg-white rounded-2xl shadow-lg border border-brand-gray overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-brand-gray">
              <button
                onClick={() => setActiveTab('post')}
                className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 font-semibold text-xs sm:text-sm transition-colors ${
                  activeTab === 'post'
                    ? 'bg-brand-gold text-white'
                    : 'bg-brand-ivory text-brand-khaki hover:bg-brand-gray'
                }`}
              >
                <span className="sm:hidden">📸 Post</span>
                <span className="hidden sm:inline">📸 {t('instagramPost')}</span>
              </button>
              <button
                onClick={() => setActiveTab('reels')}
                className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 font-semibold text-xs sm:text-sm transition-colors ${
                  activeTab === 'reels'
                    ? 'bg-brand-gold text-white'
                    : 'bg-brand-ivory text-brand-khaki hover:bg-brand-gray'
                }`}
              >
                <span className="sm:hidden">🎬 Reels</span>
                <span className="hidden sm:inline">🎬 {t('instagramReels')}</span>
              </button>
            </div>

            <div className="p-6">
              {/* Copy All Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleCopyAll}
                  className="px-4 py-2 bg-brand-ivory hover:bg-brand-gray text-brand-khaki rounded-lg text-sm font-medium transition-colors"
                >
                  {copiedField === `all-${activeTab}` ? `✓ ${t('copied')}` : `📋 ${t('copyAll')}`}
                </button>
              </div>

              {/* Post Content */}
              {activeTab === 'post' && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-brand-khaki">🎨 Başlıq</span>
                      <button
                        onClick={() => handleCopy(generatedContent.post.title, 'post-title')}
                        className="text-xs text-brand-gold hover:text-brand-gold"
                      >
                        {copiedField === 'post-title' ? `✓ ${t('copied')}` : t('copy')}
                      </button>
                    </div>
                    <div className="p-4 bg-brand-navy/5 rounded-xl text-brand-navy text-lg font-semibold whitespace-pre-wrap">
                      {generatedContent.post.title}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-brand-khaki">📝 Mətn</span>
                      <button
                        onClick={() => handleCopy(generatedContent.post.caption, 'post-caption')}
                        className="text-xs text-brand-gold hover:text-brand-gold"
                      >
                        {copiedField === 'post-caption' ? `✓ ${t('copied')}` : t('copy')}
                      </button>
                    </div>
                    <div className="p-4 bg-brand-ivory rounded-xl text-brand-navy whitespace-pre-wrap">
                      {generatedContent.post.caption}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-brand-khaki">🖼️ Vizual Təklif</span>
                      <button
                        onClick={() => handleCopy(generatedContent.post.visualSuggestion, 'post-visual')}
                        className="text-xs text-brand-gold hover:text-brand-gold"
                      >
                        {copiedField === 'post-visual' ? `✓ ${t('copied')}` : t('copy')}
                      </button>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-brand-navy/5 to-brand-gold/5 rounded-xl text-brand-navy text-sm italic border-l-4 border-l-brand-gold whitespace-pre-wrap">
                      {generatedContent.post.visualSuggestion}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-brand-khaki">{t('hashtags')}</span>
                      <button
                        onClick={() => handleCopy(generatedContent.post.hashtags.map(h => `#${h.replace(/^#+/, '')}`).join(' '), 'post-hashtags')}
                        className="text-xs text-brand-gold hover:text-brand-gold"
                      >
                        {copiedField === 'post-hashtags' ? `✓ ${t('copied')}` : t('copy')}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.post.hashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-brand-navy text-white rounded-full text-sm"
                        >
                          #{tag.replace(/^#+/, '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reels Content */}
              {activeTab === 'reels' && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-brand-khaki">🎬 {t('reelsScript')}</span>
                      <button
                        onClick={() => handleCopy(generatedContent.reels.script, 'reels-script')}
                        className="text-xs text-brand-gold hover:text-brand-gold"
                      >
                        {copiedField === 'reels-script' ? `✓ ${t('copied')}` : t('copy')}
                      </button>
                    </div>
                    <div className="p-4 bg-brand-ivory rounded-xl text-brand-navy whitespace-pre-wrap">
                      {generatedContent.reels.script}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-brand-khaki">{t('caption')}</span>
                      <button
                        onClick={() => handleCopy(generatedContent.reels.caption, 'reels-caption')}
                        className="text-xs text-brand-gold hover:text-brand-gold"
                      >
                        {copiedField === 'reels-caption' ? `✓ ${t('copied')}` : t('copy')}
                      </button>
                    </div>
                    <div className="p-4 bg-brand-ivory rounded-xl text-brand-navy whitespace-pre-wrap">
                      {generatedContent.reels.caption}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-brand-khaki">{t('hashtags')}</span>
                      <button
                        onClick={() => handleCopy(generatedContent.reels.hashtags.map(h => `#${h.replace(/^#+/, '')}`).join(' '), 'reels-hashtags')}
                        className="text-xs text-brand-gold hover:text-brand-gold"
                      >
                        {copiedField === 'reels-hashtags' ? `✓ ${t('copied')}` : t('copy')}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.reels.hashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-brand-navy text-white rounded-full text-sm"
                        >
                          #{tag.replace(/^#+/, '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentGenerator;
