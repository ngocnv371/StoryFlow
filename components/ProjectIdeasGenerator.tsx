import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { generateProjectIdeas } from '../services/aiService';
import { showAlert } from '../store/uiSlice';
import { createStoriesFromIdeasRemote } from '../store/storiesSlice';
import { useAuth } from '../context/AuthContext';

type ModalStep = 'theme' | 'generating' | 'review' | 'creating';

const ProjectIdeasGenerator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((state: RootState) => state.config);
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState('');
  const [step, setStep] = useState<ModalStep>('theme');
  const [ideas, setIdeas] = useState<string[]>([]);
  const [approved, setApproved] = useState<boolean[]>([]);

  const approvedCount = useMemo(() => approved.filter(Boolean).length, [approved]);
  const isBusy = step === 'generating' || step === 'creating';

  const handleOpen = () => {
    setIsOpen(true);
    setTheme('');
    setIdeas([]);
    setApproved([]);
    setStep('theme');
  };

  const handleClose = () => {
    if (isBusy) return;
    setIsOpen(false);
  };

  const handleGenerate = async () => {
    if (!theme.trim()) {
      dispatch(showAlert({
        title: 'Theme Required',
        message: 'Please enter a theme before generating ideas.',
        type: 'warning'
      }));
      return;
    }

    setStep('generating');

    try {
      const generatedIdeas = await generateProjectIdeas(config, theme.trim());
      setIdeas(generatedIdeas);
      setApproved(generatedIdeas.map(() => true));
      setStep('review');
    } catch (error: any) {
      setStep('theme');
      dispatch(showAlert({
        title: 'Idea Generation Failed',
        message: error.message || 'Unable to generate project ideas. Check your text generation provider settings.',
        type: 'error'
      }));
    }
  };

  const toggleApproved = (index: number) => {
    setApproved((previous) => previous.map((value, i) => (i === index ? !value : value)));
  };

  const handleCreateProjects = async () => {
    if (!user) return;

    const selectedIdeas = ideas.filter((_, index) => approved[index]);
    if (selectedIdeas.length === 0) {
      dispatch(showAlert({
        title: 'No Ideas Selected',
        message: 'Select at least one idea to create projects.',
        type: 'warning'
      }));
      return;
    }

    setStep('creating');

    try {
      const resultAction = await dispatch(createStoriesFromIdeasRemote({
        userId: user.id,
        ideas: selectedIdeas,
      }));

      if (createStoriesFromIdeasRemote.rejected.match(resultAction)) {
        throw new Error(resultAction.error.message || 'Failed to create projects from approved ideas.');
      }

      dispatch(showAlert({
        title: 'Projects Created',
        message: `Created ${selectedIdeas.length} new project${selectedIdeas.length > 1 ? 's' : ''} from approved ideas.`,
        type: 'success'
      }));

      setIsOpen(false);
    } catch (error: any) {
      setStep('review');
      dispatch(showAlert({
        title: 'Project Creation Failed',
        message: error.message || 'Unable to create projects at this time.',
        type: 'error'
      }));
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-6.364l.707.707M12 21v-1m-4.95-2.05l.707-.707m9.9 0l-.707-.707" />
        </svg>
        <span>Generate Ideas</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Project Idea Generator</h2>
                <p className="text-sm text-slate-500">Generate 10 new project ideas from a theme using text generation.</p>
              </div>
              <button onClick={handleClose} disabled={isBusy} className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {step === 'theme' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="idea-theme" className="text-sm font-bold text-slate-600 uppercase tracking-wide">Theme</label>
                    <input
                      id="idea-theme"
                      type="text"
                      value={theme}
                      onChange={(event) => setTheme(event.target.value)}
                      placeholder="e.g. Cyberpunk detective stories in floating cities"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {step === 'generating' && (
                <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Generating 10 ideas...</h3>
                    <p className="text-sm text-slate-500 mt-1">Theme: {theme}</p>
                  </div>
                </div>
              )}

              {step === 'review' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">Approve ideas</h3>
                    <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                      {approvedCount} selected
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
                    {ideas.map((idea, index) => (
                      <label key={`${index}-${idea}`} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={approved[index] || false}
                          onChange={() => toggleApproved(index)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700 leading-relaxed">{idea}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 'creating' && (
                <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Creating projects...</h3>
                    <p className="text-sm text-slate-500 mt-1">Creating {approvedCount} approved project{approvedCount > 1 ? 's' : ''}.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isBusy}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              {step === 'theme' && (
                <button
                  onClick={handleGenerate}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Generate 10 Ideas
                </button>
              )}

              {step === 'review' && (
                <button
                  onClick={handleCreateProjects}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Create Selected Projects
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectIdeasGenerator;
