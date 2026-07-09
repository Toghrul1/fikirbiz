import { useState } from 'react';
import type { ContentGenerateRequest, GeneratedContent } from '@/types';
import { LANGUAGES } from '@/lib/languages';
import { useLanguageStore } from '@/store/languageStore';
import { useTranslation } from '@/lib/useTranslation';

export function ContentGenerator() {
  const appLanguage = useLanguageStore(s => s.language);
  const [language, setLanguage] = useState(appLanguage);
  const [productServiceTopic, setProductServiceTopic] = useState('');
  const [brandName, setBrandName] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'post' | 'reels'>('post');
  const { t } = useTranslation();

  const handleGenerate = async () => {
    if (!productServiceTopic.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);

    const request: ContentGenerateRequest = {
      language,
      productServiceTopic: productServiceTopic.trim(),
      brandName: brandName.trim() || undefined,
      keyFeatures: keyFeatures.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
      callToAction: callToAction.trim() || undefined,
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
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content') {
                  setGeneratedContent(parsed.data);
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
    if (activeTab === 'post') {
      const fullText = `${generatedContent.post.caption}\n\n${generatedContent.post.hashtags.map(h => `#${h.replace(/^#+/, '')}`).join(' ')}`;
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
            💡 {t('contentTitle')}
          </h1>
          <p className="text-brand-khaki">
            {t('contentDesc')}
          </p>
        </div>

        {/* Form Card */}
        <div className="relative z-10 bg-white rounded-2xl shadow-lg p-6 mb-6 border border-brand-gray">
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

            <div className="grid grid-cols-2 gap-4 mb-4">
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

            <div className="grid grid-cols-2 gap-4 mb-6">
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
                `✨ ${t('generateContent')}`
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
        {generatedContent && (
          <div className="relative z-10 bg-white rounded-2xl shadow-lg border border-brand-gray overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-brand-gray">
              <button
                onClick={() => setActiveTab('post')}
                className={`flex-1 py-4 px-6 font-semibold text-sm transition-colors ${
                  activeTab === 'post'
                    ? 'bg-brand-gold text-white'
                    : 'bg-brand-ivory text-brand-khaki hover:bg-brand-gray'
                }`}
              >
                📸 {t('instagramPost')}
              </button>
              <button
                onClick={() => setActiveTab('reels')}
                className={`flex-1 py-4 px-6 font-semibold text-sm transition-colors ${
                  activeTab === 'reels'
                    ? 'bg-brand-gold text-white'
                    : 'bg-brand-ivory text-brand-khaki hover:bg-brand-gray'
                }`}
              >
                🎬 {t('instagramReels')}
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
                  {/* Caption */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-brand-khaki">{t('caption')}</span>
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

                  {/* Hashtags */}
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
                  {/* Script */}
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

                  {/* Caption */}
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

                  {/* Hashtags */}
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
