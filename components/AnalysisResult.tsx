import React from 'react';
import { StatCard } from './StatCard';
import { AVERAGE_CARRY_DISTANCES } from '../constants';
import type { AnalysisResultData } from '../types';

interface AnalysisResultProps {
  result: AnalysisResultData;
  onReset: () => void;
}

const TrajectoryOverlay: React.FC<{ trajectory: {x: number, y: number}[], impactFrameUrl: string }> = ({ trajectory, impactFrameUrl }) => {
    if (!trajectory || trajectory.length < 2) {
        return <img src={impactFrameUrl} alt="Golf Swing Impact" className="w-full h-full object-contain rounded-lg" />;
    }

    const points = trajectory.map(p => `${p.x * 100}% ${p.y * 100}%`).join(' ');

    return (
        <div className="relative w-full h-full">
            <img src={impactFrameUrl} alt="Golf Swing Impact" className="w-full h-full object-contain rounded-lg" />
            <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                    points={points.replace(/%/g, '')}
                    fill="none"
                    stroke="rgba(255, 255, 0, 0.8)"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeDasharray="2 1"
                />
            </svg>
        </div>
    );
};

const DistanceComparison: React.FC<{ club: string, distance: number }> = ({ club, distance }) => {
    const avgData = AVERAGE_CARRY_DISTANCES[club];
    if (!avgData || avgData.amateurMale === 0) return null;

    const maxDist = Math.max(distance, avgData.proMale, avgData.amateurMale) * 1.1;
    const yourWidth = (distance / maxDist) * 100;
    const amateurWidth = (avgData.amateurMale / maxDist) * 100;
    const proWidth = (avgData.proMale / maxDist) * 100;

    return (
        <div className="space-y-3 mt-4 text-sm">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">Your Shot</span>
                    <span className="font-mono">{distance.toFixed(0)} yds</span>
                </div>
                <div className="w-full bg-dark-charcoal rounded-full h-4">
                    <div className="bg-golf-green-light h-4 rounded-full" style={{ width: `${yourWidth}%` }}></div>
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-1 text-gray-400">
                    <span>Amateur Avg.</span>
                    <span className="font-mono">{avgData.amateurMale} yds</span>
                </div>
                <div className="w-full bg-dark-charcoal rounded-full h-4">
                    <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${amateurWidth}%` }}></div>
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-1 text-gray-400">
                    <span>Pro Avg.</span>
                    <span className="font-mono">{avgData.proMale} yds</span>
                </div>
                <div className="w-full bg-dark-charcoal rounded-full h-4">
                    <div className="bg-red-500 h-4 rounded-full" style={{ width: `${proWidth}%` }}></div>
                </div>
            </div>
        </div>
    );
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onReset }) => {
  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-golf-sand">Analysis Complete</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-charcoal p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2 text-gray-300">Swing & Ball Flight</h4>
          <div className="aspect-video w-full rounded-lg overflow-hidden">
             <TrajectoryOverlay trajectory={result.trajectory} impactFrameUrl={result.impactFrameUrl} />
          </div>
        </div>
        <div className="bg-dark-charcoal p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2 text-gray-300">Key Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Carry Distance" value={`${result.stats.distance.toFixed(0)}`} unit="yds" />
            <StatCard label="Ball Speed" value={result.stats.ballSpeed.toFixed(0)} unit="mph" />
            <StatCard label="Club Head Speed" value={result.stats.clubHeadSpeed.toFixed(0)} unit="mph" />
            <StatCard label="Launch Angle" value={result.stats.launchAngle.toFixed(1)} unit="deg" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-charcoal p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2 text-gray-300">AI Coach Tips</h4>
           <ul className="space-y-3 text-gray-300 list-disc list-inside">
             {result.tips.map((tip, index) => (
                <li key={index} className="text-sm">{tip}</li>
             ))}
           </ul>
        </div>
        <div className="bg-dark-charcoal p-4 rounded-lg">
            <h4 className="font-bold text-lg mb-2 text-gray-300">Distance Comparison</h4>
            <DistanceComparison club={result.club} distance={result.stats.distance} />
        </div>
      </div>
      <button onClick={onReset} className="w-full sm:w-auto mx-auto bg-golf-green hover:bg-golf-green-light text-white font-bold py-3 px-8 rounded-lg transition-colors">
        Analyze Another Swing
      </button>
    </div>
  );
};