import React from 'react';

interface VideoImageTimelineSceneProps {
  index: number;
  imageUrl?: string;
  isCover: boolean;
  prompt: string;
  sectionText: string;
  aspectRatio?: string;
  onPreviewImage: (imageUrl: string, index: number) => void;
  onSetAsCover: (imageUrl: string, index: number) => void;
}

const VideoImageTimelineScene: React.FC<VideoImageTimelineSceneProps> = ({
  index,
  imageUrl,
  isCover,
  prompt,
  sectionText,
  aspectRatio,
  onPreviewImage,
  onSetAsCover,
}) => {
  const hasImage = typeof imageUrl === 'string' && imageUrl.length > 0;
  const resolvedAspectRatio = aspectRatio ?? '16:9';
  const aspectRatioCss = resolvedAspectRatio.replace(':', ' / ');

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-700"></div>
      <div className={`absolute left-0 top-3 h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
        isCover
          ? 'border-indigo-400 bg-indigo-900 text-indigo-200'
          : 'border-slate-500 bg-slate-800 text-slate-300'
      }`}>
        {index + 1}
      </div>

      <div className={`rounded-xl border p-3 bg-slate-900/80 ${
        isCover ? 'border-indigo-500/70' : 'border-slate-700'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(80px,140px)_1fr] gap-3 items-start">
          {hasImage && imageUrl ? (
            <button
              type="button"
              onClick={() => onPreviewImage(imageUrl, index)}
              className="relative rounded-lg overflow-hidden border border-slate-700 group text-left focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label={`Preview scene ${index + 1}`}
            >
              <div className="w-full bg-slate-950" style={{ aspectRatio: aspectRatioCss }}>
                <img
                  src={imageUrl}
                  alt={`Scene ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
              <span className="absolute left-2 top-2 text-[10px] bg-black/70 text-slate-200 px-2 py-1 rounded-full">
                Scene {index + 1}
              </span>
              {isCover && (
                <span className="absolute right-2 top-2 text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-full font-semibold">
                  Cover
                </span>
              )}
            </button>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-slate-700 group text-left">
              <div className="w-full bg-slate-950" style={{ aspectRatio: aspectRatioCss }}>
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs px-3 text-center">
                  Image pending for this section
                </div>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
              <span className="absolute left-2 top-2 text-[10px] bg-black/70 text-slate-200 px-2 py-1 rounded-full">
                Scene {index + 1}
              </span>
              {isCover && (
                <span className="absolute right-2 top-2 text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-full font-semibold">
                  Cover
                </span>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Prompt {index + 1}
              </p>
              <div className="flex items-center gap-2">
                {hasImage && imageUrl && (
                  <button
                    type="button"
                    onClick={() => onPreviewImage(imageUrl, index)}
                    className="text-xs text-slate-300 hover:text-slate-100 font-semibold"
                  >
                    Preview
                  </button>
                )}
                {hasImage && imageUrl && !isCover && (
                  <button
                    type="button"
                    onClick={() => onSetAsCover(imageUrl, index)}
                    className="text-xs text-indigo-300 hover:text-indigo-200 font-semibold"
                  >
                    Set as Cover
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Aspect ratio: {resolvedAspectRatio}</p>
            {sectionText && (
              <div className="rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Script</p>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">{sectionText}</p>
              </div>
            )}
            <p className="text-sm text-slate-200 leading-relaxed">
              {prompt}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoImageTimelineScene;