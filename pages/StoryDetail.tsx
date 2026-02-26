import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { fetchStoryById, updateStoryRemote } from "../store/storiesSlice";
import { Story } from "../types";
import ImageInspector from "../components/ImageInspector";
import AutoGenerateButton from "../components/AutoGenerateButton";
import StorySummarySection from "../components/story-detail/StorySummarySection";
import VideoSection from "../components/story-detail/VideoSection";
import NarrationSection from "../components/story-detail/NarrationSection";
import CoverSection from "../components/story-detail/CoverSection";
import MusicSection from "../components/story-detail/MusicSection";
import TagsSection from "../components/story-detail/TagsSection";
import TranscriptSection from "../components/story-detail/TranscriptSection";
import StoryStatusSelect from "../components/story-detail/StoryStatusSelect";
import toast from "react-hot-toast";

const StoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const story = useSelector((state: RootState) =>
    state.stories.items.find((s) => s.id === id),
  );

  const [formData, setFormData] = useState<Story | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [storyLoadFailed, setStoryLoadFailed] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  useEffect(() => {
    if (!id || story) return;

    setIsLoadingStory(true);
    setStoryLoadFailed(false);

    dispatch(fetchStoryById(id))
      .unwrap()
      .then((loadedStory) => {
        if (!loadedStory) {
          setStoryLoadFailed(true);
        }
      })
      .catch(() => {
        setStoryLoadFailed(true);
      })
      .finally(() => {
        setIsLoadingStory(false);
      });
  }, [dispatch, id, story]);

  useEffect(() => {
    if (story) setFormData(story);
  }, [story]);

  if (isLoadingStory && !formData)
    return <div className="p-8">Loading Story...</div>;

  if (storyLoadFailed && !formData) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-slate-600">Story not found or unavailable.</p>
        <button
          onClick={() => navigate("/projects")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  if (!formData) return <div className="p-8">Loading Story...</div>;

  const handleSave = async () => {
    try {
      await dispatch(updateStoryRemote(formData)).unwrap();
      toast.success("Saved!");
    } catch {
      toast.error("Failed to save story");
    }
  };

  const handleUpdate = (updates: Partial<Story>) => {
    setFormData((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/projects")}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Back
        </button>
        <div className="flex items-center gap-4">
          <div className="w-36">
            <StoryStatusSelect
              value={formData.status}
              onChange={(status) => handleUpdate({ status })}
            />
          </div>
          <AutoGenerateButton story={formData} onStoryUpdated={setFormData} />
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg"
          >
            💾 Save
          </button>
        </div>
      </div>

      <StorySummarySection story={formData} onUpdate={handleUpdate} />
      <TagsSection
        tags={formData.tags}
        onChange={(tags) => handleUpdate({ tags })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <NarrationSection story={formData} onUpdate={handleUpdate} />
          <CoverSection
            story={formData}
            onUpdate={handleUpdate}
            onOpenInspector={() => setIsInspectorOpen(true)}
          />
          <MusicSection story={formData} onUpdate={handleUpdate} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <TranscriptSection story={formData} onUpdate={handleUpdate} />
          <VideoSection story={formData} onUpdate={handleUpdate} />
        </div>
      </div>
      <ImageInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        imageUrl={formData.thumbnail_url}
        title={formData.title}
      />
    </div>
  );
};

export default StoryDetail;
