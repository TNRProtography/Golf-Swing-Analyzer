
import React, { useState, useRef, useCallback } from 'react';
import { ClubSelector } from './ClubSelector';
import { Loader } from './Loader';
import { AnalysisResult } from './AnalysisResult';
import { analyzeSwing, getCoachingTips } from '../services/geminiService';
import type { Club, SwingData, AnalysisResultData } from '../types';
import { CLUBS } from '../constants';

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55a1 1 0 011.45.89V17a1 1 0 01-1.45.89L15 14M4 6h10a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
);

interface AnalysisViewProps {
  addSwing: (swingData: SwingData) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ addSwing }) => {
  const [selectedClub, setSelectedClub] = useState<Club>(CLUBS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    setVideoBlobUrl(null);
    setAnalysisResult(null);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
        }
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access the camera. Please check permissions and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if(streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };
  
  const extractFrames = useCallback(async (videoUrl: string): Promise<{frames: string[], poster: string}> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.muted = true;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const frames: string[] = [];
        let poster = '';

        video.onloadeddata = async () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            const frameCount = 10;
            const interval = duration / (frameCount + 1);

            for (let i = 1; i <= frameCount; i++) {
                video.currentTime = i * interval;
                await new Promise(r => video.onseeked = r);
                context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                frames.push(dataUrl);
                if (i === Math.floor(frameCount / 2)) { // Choose middle frame as poster
                    poster = dataUrl;
                }
            }
            resolve({frames, poster});
        };
        video.load();
    });
  }, []);

  const handleAnalyze = async () => {
    if (!videoBlobUrl) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
        const { frames, poster } = await extractFrames(videoBlobUrl);
        if (frames.length === 0) throw new Error("Could not extract frames from video.");

        const { stats, trajectory } = await analyzeSwing(frames, selectedClub);
        const tips = await getCoachingTips(stats, selectedClub, poster);
        
        const newSwing: SwingData = {
            id: new Date().toISOString(),
            club: selectedClub,
            videoUrl: videoBlobUrl,
            posterUrl: poster,
            stats,
            trajectory,
            tips,
            timestamp: Date.now(),
        };

        addSwing(newSwing);
        setAnalysisResult(newSwing);
    } catch (err: any) {
        console.error("Analysis failed:", err);
        setError(`Analysis failed. ${err.message || 'Please try again.'}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleReset = () => {
    setVideoBlobUrl(null);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
    if(videoRef.current) {
        videoRef.current.src = "";
        videoRef.current.srcObject = null;
    }
  }

  return (
    <div className="bg-light-gray rounded-lg shadow-xl p-4 md:p-8 w-full max-w-4xl mx-auto flex flex-col gap-6">
        <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-golf-sand">Swing Analyzer</h2>
            <p className="text-gray-400 mt-1">Record your swing to get instant AI-powered feedback.</p>
        </div>

        <div className="bg-dark-charcoal rounded-lg aspect-video w-full flex items-center justify-center overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-contain" playsInline autoPlay muted loop={!isRecording && !!videoBlobUrl}></video>
             {!videoBlobUrl && !isRecording && (
                <div className="absolute flex flex-col items-center text-center p-4">
                    <CameraIcon />
                    <p className="mt-4 text-lg font-semibold text-gray-300">Ready to Record</p>
                    <div className="mt-2 text-sm text-gray-400 max-w-xs bg-dark-charcoal/50 p-3 rounded-lg backdrop-blur-sm">
                        <p className="font-bold text-golf-sand/80">Camera Placement Tip:</p>
                        <p>For best results, place your camera side-on to your swing path, about 1 meter (waist high) off the ground.</p>
                    </div>
                </div>
            )}
        </div>

        {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</div>}

        {!isLoading && !analysisResult && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <ClubSelector selectedClub={selectedClub} onClubChange={setSelectedClub} disabled={isRecording}/>
                {isRecording ? (
                    <button onClick={stopRecording} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                        Stop Recording
                    </button>
                ) : videoBlobUrl ? (
                    <>
                        <button onClick={handleAnalyze} className="w-full sm:w-auto bg-golf-green hover:bg-golf-green-light text-white font-bold py-3 px-6 rounded-lg transition-colors">
                            Analyze Swing
                        </button>
                        <button onClick={handleReset} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                            Record New
                        </button>
                    </>
                ) : (
                    <button onClick={startRecording} className="w-full sm:w-auto bg-golf-green-light hover:bg-golf-green text-white font-bold py-3 px-6 rounded-lg transition-colors">
                        Start Recording
                    </button>
                )}
            </div>
        )}

        {isLoading && <Loader message="Analyzing your swing... this may take a moment." />}
        {analysisResult && <AnalysisResult result={analysisResult} onReset={handleReset}/>}
    </div>
  );
};
