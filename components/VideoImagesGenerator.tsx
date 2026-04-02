import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { patchStoryRemote } from '../store/storiesSlice';
import { generateImagePrompts, generateMultipleImages } from '../services/aiService';
import { SUPABASE_IMAGE_BUCKET, uploadToSupabase } from '../services/ai/storage';
import { Story } from '../types';
import { resolveStoryConfig } from '../services/storyMetadata';
import toast from 'react-hot-toast';
import ImageInspector from './ImageInspector';

interface VideoImagesGeneratorProps {
  story: Story;
}

type GenPhase = 'idle' | 'prompts' | 'images';

const VideoImagesGenerator: React.FC<VideoImagesGeneratorProps> = ({ story }) => {
  const dispatch = useDispatch<AppDispatch>();
  const appConfig = useSelector((state: RootState) => state.config);
  const effectiveConfig = resolveStoryConfig(appConfig, story);

  const [phase, setPhase] = useState<GenPhase>('idle');
  const [imagesCompleted, setImagesCompleted] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCompleted, setUploadCompleted] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [replaceOnUpload, setReplaceOnUpload] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const frameDuration = effectiveConfig.video.frameDuration ?? 3000;
  const narrationDuration = story.duration ?? 0;

  const requiredImages = narrationDuration > 0
    ? Math.ceil(narrationDuration / (frameDuration / 1000))
    : 0;

  const existingImageUrls: string[] = Array.isArray(story.metadata?.image_urls)
    ? (story.metadata.image_urls as string[])
    : [];
  const existingPrompts: string[] = Array.isArray(story.metadata?.image_prompts)
    ? (story.metadata.image_prompts as string[])
    : [];

  const hasEnoughImages = existingImageUrls.length >= requiredImages && requiredImages > 0;
  const isGenerating = phase !== 'idle';
  const isBusy = isGenerating || isUploading;
  const timelineAspectRatio = effectiveConfig.imageGen.aspectRatio ?? '16:9';
  const timelineAspectRatioCss = timelineAspectRatio.replace(':', ' / ');

  const handleGenerate = async () => {
    if (!narrationDuration) {
      toast.error('Generate narration first so we can calculate how many images are needed.');
      return;
    }

    if (requiredImages <= 0) {
      toast.error('Could not determine the number of images needed. Check narration duration and frame duration settings.');
      return;
    }

    setPhase('prompts');
    setImagesCompleted(0);
    setTotalToGenerate(requiredImages);

    let prompts: string[];
    try {
      prompts = await generateImagePrompts(effectiveConfig, story, requiredImages);
    } catch (error: any) {
      console.error('Image prompt generation error:', error);
      toast.error(error.message || 'Failed to generate image prompts.');
      setPhase('idle');
      return;
    }

    // Save prompts to metadata
    try {
      await dispatch(patchStoryRemote({
        id: story.id,
        metadata: {
          ...story.metadata,
          image_prompts: prompts,
        },
      })).unwrap();
    } catch {
      // Non-fatal: continue even if save fails
    }

    setPhase('images');

    const generatedUrls: string[] = [];
    for (let i = 0; i < prompts.length; i++) {
      try {
        const batchUrls = await generateMultipleImages(effectiveConfig, story, [prompts[i]]);
        if (batchUrls.length > 0) {
          generatedUrls.push(batchUrls[0]);
        }
      } catch (error: any) {
        console.warn(`Image ${i + 1} failed:`, error);
      }
      setImagesCompleted(i + 1);
    }

    if (generatedUrls.length === 0) {
      toast.error('No images were generated. Check your image generation provider settings.');
      setPhase('idle');
      return;
    }

    // Save to metadata
    try {
      await dispatch(patchStoryRemote({
        id: story.id,
        metadata: {
          ...story.metadata,
          image_prompts: prompts,
          image_urls: generatedUrls,
        },
        // Set the first image as cover if there's no cover
        ...(story.thumbnail_url ? {} : { thumbnail_url: generatedUrls[0] }),
      })).unwrap();

      const missing = requiredImages - generatedUrls.length;
      if (missing > 0) {
        toast.success(`Generated ${generatedUrls.length}/${requiredImages} images. ${missing} failed.`);
      } else {
        toast.success(`Generated ${generatedUrls.length} images.`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save generated images.');
    }

    setPhase('idle');
  };

  const handleSetAsCover = async (imageUrl: string, index: number) => {
    try {
      await dispatch(patchStoryRemote({
        id: story.id,
        thumbnail_url: imageUrl,
        metadata: {
          ...story.metadata,
          selected_cover_image_index: index,
        },
      })).unwrap();
      toast.success('Cover image updated.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to set cover image.');
    }
  };

  const handlePreviewImage = (imageUrl: string, index: number) => {
    setPreviewImageUrl(imageUrl);
    setPreviewTitle(`Scene ${index + 1}`);
  };

  const handleRemoveImages = async () => {
    try {
      await dispatch(patchStoryRemote({
        id: story.id,
        metadata: {
          ...story.metadata,
          image_urls: [],
          image_prompts: [],
          selected_cover_image_index: undefined,
        },
      })).unwrap();
      toast.success('Images cleared.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear images.');
    }
  };

  const sanitizeFileName = (name: string) => name.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();

  const handleBulkUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleBulkUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles: File[] = event.target.files ? Array.from(event.target.files as FileList) : [];
    const files = rawFiles.filter((file) => file.type.startsWith('image/'));

    if (files.length === 0) {
      toast.error('Please select at least one image file.');
      return;
    }

    setIsUploading(true);
    setUploadCompleted(0);
    setUploadTotal(files.length);

    const uploadedUrls: string[] = [];
    const uploadedPrompts: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadName = `${story.id}_scene_${i + 1}_${sanitizeFileName(file.name)}`;
        const imageUrl = await uploadToSupabase(SUPABASE_IMAGE_BUCKET, uploadName, file, file.type || 'image/png');
        uploadedUrls.push(imageUrl);
        uploadedPrompts.push(`User uploaded image: ${file.name}`);
      } catch (error) {
        console.error('Bulk image upload failed:', error);
      }

      setUploadCompleted(i + 1);
    }

    if (uploadedUrls.length === 0) {
      toast.error('Failed to upload selected images.');
      setIsUploading(false);
      event.target.value = '';
      return;
    }

    const baseUrls = replaceOnUpload ? [] : existingImageUrls;
    const basePrompts = replaceOnUpload ? [] : existingPrompts;
    const mergedUrls = [...baseUrls, ...uploadedUrls];
    const mergedPrompts = [...basePrompts, ...uploadedPrompts];

    const currentCoverStillExists = !!story.thumbnail_url && mergedUrls.includes(story.thumbnail_url);
    const nextCoverUrl = currentCoverStillExists
      ? story.thumbnail_url
      : mergedUrls[0];

    try {
      await dispatch(patchStoryRemote({
        id: story.id,
        thumbnail_url: nextCoverUrl,
        metadata: {
          ...story.metadata,
          image_urls: mergedUrls,
          image_prompts: mergedPrompts,
          selected_cover_image_index: mergedUrls.indexOf(nextCoverUrl),
        },
      })).unwrap();

      const failedCount = files.length - uploadedUrls.length;
      if (failedCount > 0) {
        toast.success(`Uploaded ${uploadedUrls.length}/${files.length} images. ${failedCount} failed.`);
      } else {
        toast.success(`Uploaded ${uploadedUrls.length} images.`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save uploaded images.');
    }

    setIsUploading(false);
    event.target.value = '';
  };

  const selectedIndex: number = typeof story.metadata?.selected_cover_image_index === 'number'
    ? story.metadata.selected_cover_image_index
    : -1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-100">Scene Images</p>
          <p className="text-xs text-slate-500">
            {narrationDuration > 0
              ? `${narrationDuration}s narration @ ${frameDuration}ms/frame = ${requiredImages} images needed`
              : 'Generate narration first to calculate image count'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {existingImageUrls.length > 0 && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${hasEnoughImages ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400'}`}>
              {existingImageUrls.length}/{requiredImages}
            </span>
          )}
        </div>
      </div>

      {/* Generation button */}
      <button
        onClick={handleGenerate}
        disabled={isBusy || !narrationDuration}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
          isBusy || !narrationDuration
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:shadow-cyan-200 hover:-translate-y-0.5'
        }`}
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>
              {phase === 'prompts'
                ? 'Generating prompts...'
                : `Generating image ${imagesCompleted + 1}/${totalToGenerate}...`}
            </span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {existingImageUrls.length > 0
                ? `Regenerate ${requiredImages} Images`
                : `Generate ${requiredImages > 0 ? requiredImages : '...'} Images`}
            </span>
          </>
        )}
      </button>

      <div className="rounded-xl border border-slate-700 p-3 bg-slate-900/70 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">Bring Your Own Images</p>
            <p className="text-xs text-slate-400">Bulk upload scene images and use them as timeline frames.</p>
          </div>
          <button
            type="button"
            onClick={handleBulkUploadClick}
            disabled={isBusy}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              isBusy
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:-translate-y-0.5'
            }`}
          >
            Upload Images
          </button>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={replaceOnUpload}
            onChange={(event) => setReplaceOnUpload(event.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800"
          />
          Replace existing timeline with uploaded images
        </label>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleBulkUploadChange}
        />
      </div>

      {isUploading && uploadTotal > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-slate-400">Uploading {uploadCompleted}/{uploadTotal}...</p>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{ width: `${(uploadCompleted / uploadTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Progress bar during generation */}
      {isGenerating && phase === 'images' && totalToGenerate > 0 && (
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300"
            style={{ width: `${(imagesCompleted / totalToGenerate) * 100}%` }}
          />
        </div>
      )}

      {/* Timeline */}
      {existingImageUrls.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Scene Timeline
            </p>
            <button
              onClick={handleRemoveImages}
              className="text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-4">
            {existingImageUrls.map((url, idx) => {
              const isCover = story.thumbnail_url === url || idx === selectedIndex;
              const prompt = existingPrompts[idx] || 'No prompt stored for this scene.';

              return (
                <div key={idx} className="relative pl-8">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-700"></div>
                  <div className={`absolute left-0 top-3 h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                    isCover
                      ? 'border-indigo-400 bg-indigo-900 text-indigo-200'
                      : 'border-slate-500 bg-slate-800 text-slate-300'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className={`rounded-xl border p-3 bg-slate-900/80 ${
                    isCover ? 'border-indigo-500/70' : 'border-slate-700'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-[minmax(80px,140px)_1fr] gap-3 items-start">
                      <button
                        type="button"
                        onClick={() => handlePreviewImage(url, idx)}
                        className="relative rounded-lg overflow-hidden border border-slate-700 group text-left"
                        title="Preview image"
                      >
                        <div className="w-full" style={{ aspectRatio: timelineAspectRatioCss }}>
                          <img
                            src={url}
                            alt={`Scene ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                        <span className="absolute left-2 top-2 text-[10px] bg-black/70 text-slate-200 px-2 py-1 rounded-full">
                          Scene {idx + 1}
                        </span>
                        {isCover && (
                          <span className="absolute right-2 top-2 text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-full font-semibold">
                            Cover
                          </span>
                        )}
                      </button>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                            Prompt {idx + 1}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePreviewImage(url, idx)}
                              className="text-xs text-slate-300 hover:text-slate-100 font-semibold"
                            >
                              Preview
                            </button>
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => handleSetAsCover(url, idx)}
                                className="text-xs text-indigo-300 hover:text-indigo-200 font-semibold"
                              >
                                Set as Cover
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500">Aspect ratio: {timelineAspectRatio}</p>
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {prompt}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!hasEnoughImages && requiredImages > 0 && (
            <p className="text-xs text-amber-400">
              Need {requiredImages - existingImageUrls.length} more image(s) before the video can be compiled.
            </p>
          )}
        </div>
      )}

      <ImageInspector
        isOpen={!!previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
        imageUrl={previewImageUrl || ''}
        title={previewTitle || 'Scene Preview'}
      />
    </div>
  );
};

export default VideoImagesGenerator;
