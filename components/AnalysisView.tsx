
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ClubSelector } from './ClubSelector';
import { Loader } from './Loader';
import { AnalysisResult } from './AnalysisResult';
import { performSwingAnalysis } from '../services/geminiService';
import { saveVideo } from '../services/localDBService';
import type { Club, SwingData, AnalysisResultData } from '../types';
import { CLUBS } from '../constants';

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55a1 1 0 011.45.89V17a1 1 0 01-1.45.89L15 14M4 6h10a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
);

const InformationCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);

const ExpandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
    </svg>
);

const ShrinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l-4 4m0 0v-4m0 4h4m10-10l-4-4m0 0v4m0-4h-4m-6 10l4-4m0 0v-4m0 4h-4m10 10l-4-4m0 0v-4m0 4h-4" />
    </svg>
);


const CameraAngleGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-light-gray rounded-lg shadow-2xl p-6 w-full max-w-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-golf-sand">Camera Placement Guide</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            <p className="text-gray-400 mb-6">For accurate AI analysis, camera position is key. Here are the two standard angles and why we recommend one over the other for this app.</p>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-dark-charcoal p-4 rounded-lg border border-golf-green">
                    <h4 className="font-bold text-lg text-golf-green-light mb-2">Face-On (Recommended)</h4>
                    <p className="text-sm text-gray-300 mb-3">Place the camera directly in front of you, facing your chest, level with your hands at address.</p>
                    <ul className="text-xs space-y-2 list-disc list-inside">
                        <li className="text-green-400"><strong>Pro:</strong> Best for analyzing body mechanics (rotation, weight shift).</li>
                        <li className="text-green-400"><strong>Pro:</strong> Allows AI to accurately calculate club head speed and launch angle.</li>
                        <li className="text-red-400"><strong>Con:</strong> Poor for seeing the ball's actual flight path.</li>
                    </ul>
                </div>
                <div className="bg-dark-charcoal p-4 rounded-lg border border-gray-600">
                    <h4 className="font-bold text-lg text-gray-300 mb-2">Down-the-Line</h4>
                    <p className="text-sm text-gray-300 mb-3">Place the camera directly behind you, looking down the target line.</p>
                     <ul className="text-xs space-y-2 list-disc list-inside">
                        <li className="text-green-400"><strong>Pro:</strong> Excellent for seeing ball flight and swing path.</li>
                        <li className="text-red-400"><strong>Con:</strong> Hard for AI to calculate speeds and angles from this 2D view.</li>
                    </ul>
                </div>
            </div>
             <div className="text-center mt-6">
                <button onClick={onClose} className="bg-golf-green hover:bg-golf-green-light text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Got it
                </button>
            </div>
        </div>
    </div>
);


interface AnalysisViewProps {
  addSwing: (swingData: SwingData) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ addSwing }) => {
  const [selectedClub, setSelectedClub] = useState<Club>(CLUBS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const [showCameraGuide, setShowCameraGuide] = useState(false);
  
  const [isHighFpsRequested, setIsHighFpsRequested] = useState(false);
  const [isPlaybackSlowed, setIsPlaybackSlowed] = useState(false);
  const [actualFps, setActualFps] = useState<number | null>(null);
  
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect runs once to get the list of available video devices.
    const getVideoDevices = async () => {
      try {
        // We must call getUserMedia to get permission before enumerateDevices can return device labels.
        // We can create a dummy stream and stop it immediately.
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(track => track.stop());
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0) {
          // Default to the first available camera.
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.warn("Could not enumerate video devices:", err);
        // Don't set an error here; it will be handled when the user tries to record.
      }
    };
    getVideoDevices();
  }, []);

  useEffect(() => {
    if (videoRef.current && videoBlobUrl) {
      videoRef.current.playbackRate = isPlaybackSlowed ? 0.25 : 1.0;
    }
  }, [isPlaybackSlowed, videoBlobUrl]);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const startRecording = async () => {
    setVideoBlobUrl(null);
    setVideoBlob(null);
    setAnalysisResult(null);
    setError(null);
    setActualFps(null);
    setIsPlaybackSlowed(false);

    try {
      const frameRateConstraint = isHighFpsRequested
        ? { ideal: 240, min: 60 }
        : { ideal: 30 };

      const constraints: MediaStreamConstraints = { 
        video: { 
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          frameRate: frameRateConstraint
        } 
      };
      
      // Fallback to 'environment' facing mode if no specific device is selected.
      if (typeof constraints.video === 'object' && !constraints.video.deviceId) {
        constraints.video.facingMode = 'environment';
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.frameRate) {
            setActualFps(settings.frameRate);
            console.log(`Camera stream started. Requested FPS: ${JSON.stringify(frameRateConstraint)}, Actual FPS: ${settings.frameRate}`);
        }
      }

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
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
        }
      };
      recorder.start();
      
      if (videoContainerRef.current) {
        videoContainerRef.current.requestFullscreen().catch(err => {
            console.warn(`Could not automatically enter full-screen mode: ${err.message}`);
        });
      }
      setIsRecording(true);

    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access the camera. Please check permissions and try again.");
    }
  };

  const stopRecording = () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if(streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };
  
  const extractFrames = useCallback(async (videoUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.muted = true;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const frames: string[] = [];
        
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
            }
            resolve(frames);
        };
        video.load();
    });
  }, []);

  const handleAnalyze = async () => {
    if (!videoBlobUrl || !videoBlob) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
        const frames = await extractFrames(videoBlobUrl);
        if (frames.length === 0) throw new Error("Could not extract frames from video.");

        const { stats, trajectory, tips, impactFrameUrl } = await performSwingAnalysis(frames, selectedClub);
        
        const newSwing: SwingData = {
            id: new Date().toISOString(),
            club: selectedClub,
            impactFrameUrl,
            stats,
            trajectory,
            tips,
            timestamp: Date.now(),
        };
        
        await saveVideo(newSwing.id, videoBlob);
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
    setVideoBlob(null);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
    setActualFps(null);
    setIsPlaybackSlowed(false);
    if(videoRef.current) {
        videoRef.current.src = "";
        videoRef.current.srcObject = null;
    }
  }

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
        videoContainerRef.current.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };


  return (
    <div className="bg-light-gray rounded-lg shadow-xl p-4 md:p-8 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {showCameraGuide && <CameraAngleGuide onClose={() => setShowCameraGuide(false)} />}
        <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-golf-sand">Swing Analyzer</h2>
            <p className="text-gray-400 mt-1">Record your swing to get instant AI-powered feedback.</p>
        </div>

        <div ref={videoContainerRef} className="relative bg-dark-charcoal rounded-lg aspect-video w-full flex items-center justify-center overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-contain" playsInline autoPlay muted loop={!isRecording && !!videoBlobUrl}></video>
             {!videoBlobUrl && !isRecording && (
                <div className="absolute flex flex-col items-center text-center p-4">
                    <CameraIcon />
                    <p className="mt-4 text-lg font-semibold text-gray-300">Ready to Record</p>
                    <div className="mt-2 text-sm text-gray-400 max-w-xs bg-dark-charcoal/50 p-3 rounded-lg backdrop-blur-sm">
                        <p className="font-bold text-golf-sand/80">Camera Placement Tip:</p>
                        <p>For best results, place your camera side-on ("Face-On") to your swing path.</p>
                        <button onClick={() => setShowCameraGuide(true)} className="mt-2 text-golf-green-light font-semibold hover:underline">
                           <InformationCircleIcon /> Why does it matter?
                        </button>
                    </div>
                </div>
            )}
            
            {isRecording && (
                <button
                    onClick={stopRecording}
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 animate-pulse"
                    aria-label="Stop Recording"
                >
                    <span className="w-3 h-3 bg-white rounded-sm"></span>
                    STOP
                </button>
            )}

            {!isRecording && videoBlobUrl && (
                <button 
                    onClick={toggleFullscreen} 
                    className="absolute bottom-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/75 transition-colors z-10"
                    aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
                </button>
            )}
        </div>

        {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</div>}

        {!isLoading && !analysisResult && (
            isRecording ? (
                 <button onClick={stopRecording} className="w-full sm:w-auto mx-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Stop Recording
                </button>
            ) : videoBlobUrl ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button onClick={handleAnalyze} className="w-full sm:w-auto bg-golf-green hover:bg-golf-green-light text-white font-bold py-3 px-6 rounded-lg transition-colors">
                        Analyze Swing
                    </button>
                    <button onClick={handleReset} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                        Record New
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    {/* Pre-recording settings */}
                    <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-dark-charcoal rounded-lg">
                        <ClubSelector selectedClub={selectedClub} onClubChange={setSelectedClub} />
                        
                        {videoDevices.length > 1 && (
                            <div className="w-full sm:w-auto">
                                <select
                                    value={selectedDeviceId}
                                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                                    className="w-full sm:w-auto bg-light-gray border border-gray-600 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-golf-green-light"
                                    aria-label="Select Camera"
                                >
                                    {videoDevices.map((device, index) => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Camera ${index + 1}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                            <label htmlFor="highFpsToggle" className="text-sm text-gray-300 font-semibold whitespace-nowrap">High FPS (Slow-Mo):</label>
                            <button
                                id="highFpsToggle"
                                onClick={() => setIsHighFpsRequested(!isHighFpsRequested)}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-charcoal focus:ring-golf-green ${isHighFpsRequested ? 'bg-golf-green' : 'bg-gray-600'}`}
                                role="switch"
                                aria-checked={isHighFpsRequested}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isHighFpsRequested ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    <button onClick={startRecording} className="w-full sm:w-auto bg-golf-green-light hover:bg-golf-green text-white font-bold py-3 px-6 rounded-lg transition-colors">
                        Start Recording
                    </button>
                </div>
            )
        )}
        
        {videoBlobUrl && !analysisResult && !isLoading && (
            <div className="flex items-center justify-center gap-6 mt-4 border-t border-gray-700 pt-4">
                {actualFps && 
                    <div className="text-sm text-gray-400">
                        Captured at <span className="font-bold text-golf-sand">{Math.round(actualFps)} FPS</span>
                    </div>
                }
                <div className="flex items-center gap-2">
                    <label htmlFor="playbackSlowMoToggle" className="text-sm text-gray-300 font-semibold">Slow Motion Playback:</label>
                    <button
                      id="playbackSlowMoToggle"
                      onClick={() => setIsPlaybackSlowed(!isPlaybackSlowed)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-gray focus:ring-golf-green ${
                        isPlaybackSlowed ? 'bg-golf-green' : 'bg-gray-600'
                      }`}
                      aria-pressed={isPlaybackSlowed}
                      role="switch"
                    >
                      <span className="sr-only">Toggle Slow Motion Playback</span>
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                          isPlaybackSlowed ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                </div>
            </div>
        )}

        {isLoading && <Loader message="Analyzing your swing... this may take a moment." />}
        {analysisResult && <AnalysisResult result={analysisResult} onReset={handleReset}/>}
    </div>
  );
};
