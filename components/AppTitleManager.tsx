import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const DEFAULT_APP_TITLE = 'StoryFlow';

const hasGeneratingStatus = (statuses: Record<string, 'idle' | 'generating' | 'error'>): boolean =>
  Object.values(statuses).some(status => status === 'generating');

const getFakeProgressPercent = (elapsedMs: number): number => {
  const elapsedSeconds = Math.max(0, elapsedMs / 1000);
  const progressValue = 100 * (1 - 1 / Math.log(elapsedSeconds + Math.E));
  return Math.min(99, Math.max(0, Math.floor(progressValue)));
};

const AppTitleManager: React.FC = () => {
  const stories = useSelector((state: RootState) => state.stories);
  const [elapsedMs, setElapsedMs] = React.useState(0);

  const activeGenerationPrefix = React.useMemo(() => {
    if (hasGeneratingStatus(stories.videoGenerationStatuses)) {
      return '🎬';
    }

    if (hasGeneratingStatus(stories.audioGenerationStatuses)) {
      return '🎙️';
    }

    if (hasGeneratingStatus(stories.transcriptGenerationStatuses)) {
      return '📝';
    }

    if (hasGeneratingStatus(stories.imageGenerationStatuses)) {
      return '🖼️';
    }

    if (hasGeneratingStatus(stories.musicGenerationStatuses)) {
      return '🎵';
    }

    if (stories.projectIdeasGenerating) {
      return '💡';
    }

    return null;
  }, [stories]);

  React.useEffect(() => {
    if (!activeGenerationPrefix) {
      setElapsedMs(0);
      return;
    }

    const startedAt = Date.now();
    setElapsedMs(0);

    const intervalId = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeGenerationPrefix]);

  const activeGenerationTitle = React.useMemo(() => {
    if (!activeGenerationPrefix) {
      return null;
    }

    const fakeProgress = getFakeProgressPercent(elapsedMs);
    return `${activeGenerationPrefix} ${fakeProgress}% • ${DEFAULT_APP_TITLE}`;
  }, [activeGenerationPrefix, elapsedMs]);

  React.useEffect(() => {
    document.title = activeGenerationTitle ?? DEFAULT_APP_TITLE;
  }, [activeGenerationTitle]);

  return null;
};

export default AppTitleManager;
