import React, { useState, useEffect } from 'react';
import type { SwingData } from '../types';
import { Loader } from './Loader';
import { getVideo } from '../services/localDBService';

const ClubColors: { [key: string]: string } = {
  'Driver': 'bg-red-500',
  'Wood': 'bg-blue-500',
  'Iron': 'bg-yellow-500',
  'Wedge': 'bg-green-500',
  'Putter': 'bg-purple-500',
  'Default': 'bg-gray-400'
}

const getClubColor = (club: string) => {
    if (club.includes('Driver')) return ClubColors['Driver'];
    if (club.includes('Wood')) return ClubColors['Wood'];
    if (club.includes('Iron')) return ClubColors['Iron'];
    if (club.includes('Wedge')) return ClubColors['Wedge'];
    if (club.includes('Putter')) return ClubColors['Putter'];
    return ClubColors['Default'];
}

interface ShotHistoryViewProps {
    swings: SwingData[];
    isLoading: boolean;
}

export const ShotHistoryView: React.FC<ShotHistoryViewProps> = ({ swings, isLoading }) => {
    const [selectedSwing, setSelectedSwing] = useState<SwingData | null>(null);
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
    const MAX_DISTANCE = 350; // Max yards for visualization

    useEffect(() => {
        let objectUrl: string | null = null;

        const loadVideo = async () => {
            if (selectedSwing) {
                setSelectedVideoUrl(null);
                const videoBlob = await getVideo(selectedSwing.id);
                if (videoBlob) {
                    objectUrl = URL.createObjectURL(videoBlob);
                    setSelectedVideoUrl(objectUrl);
                }
            }
        };

        loadVideo();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [selectedSwing]);


    if (isLoading) {
        return (
            <div className="text-center p-8 bg-light-gray rounded-lg">
                <Loader message="Loading swing history from cloud..."/>
            </div>
        )
    }

    if (swings.length === 0) {
        return (
            <div className="text-center p-8 bg-light-gray rounded-lg">
                <h2 className="text-2xl font-bold text-golf-sand">No Swings Recorded Yet</h2>
                <p className="text-gray-400 mt-2">Go to the Analysis tab to record your first swing!</p>
            </div>
        );
    }
    
    // Simple dispersion simulation: random number between -50 and 50
    const getDispersion = (id: string) => {
        // create a pseudo-random number based on swing id
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const random = (hash % 101) - 50;
        return random;
    }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3 bg-light-gray p-4 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-center mb-4 text-golf-sand">Shot Dispersion</h2>
            <div className="relative w-full aspect-[2/3] bg-golf-green rounded-md overflow-hidden">
                {/* Tee box */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-8 bg-golf-green-light rounded-t-lg border-2 border-golf-sand/50"></div>
                
                {/* Yardage markers */}
                {[...Array(6)].map((_, i) => {
                    const distance = (i + 1) * 50;
                    const topPosition = 100 - (distance / MAX_DISTANCE) * 100;
                    return (
                        <div key={distance} style={{top: `${topPosition}%`}} className="absolute w-full flex justify-between items-center px-2 text-xs text-golf-sand/60">
                            <span>-</span>
                            <span className="font-mono">{distance} yds</span>
                            <span>-</span>
                        </div>
                    )
                })}
                
                {swings.map(swing => {
                    const bottom = (swing.stats.distance / MAX_DISTANCE) * 100;
                    const dispersion = getDispersion(swing.id);
                    const left = 50 + (dispersion / 100) * 50;

                    return (
                        <div
                            key={swing.id}
                            className={`absolute w-3 h-3 ${getClubColor(swing.club)} rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-150 border-2 border-white/50`}
                            style={{ bottom: `${Math.min(bottom, 100)}%`, left: `${left}%` }}
                            onClick={() => setSelectedSwing(swing)}
                            title={`${swing.club}: ${swing.stats.distance} yds`}
                        ></div>
                    );
                })}
            </div>
        </div>
        <div className="lg:w-1/3 bg-light-gray p-4 rounded-lg shadow-xl self-start">
            {selectedSwing ? (
                <div className="text-white">
                    <h3 className="text-xl font-bold text-golf-sand">Shot Details</h3>
                    <p className="text-gray-400 text-sm mb-4">{new Date(selectedSwing.timestamp).toLocaleString()}</p>
                    
                    {selectedVideoUrl ? (
                        <video src={selectedVideoUrl} controls loop className="w-full rounded-lg mb-4 bg-dark-charcoal"></video>
                    ) : (
                        <div className="w-full aspect-video bg-dark-charcoal rounded-lg flex items-center justify-center mb-4">
                            <p className="text-gray-400 text-sm">No video available.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-charcoal p-3 rounded-lg">
                            <p className="text-xs text-gray-400">Club</p>
                            <p className="font-bold text-lg">{selectedSwing.club}</p>
                        </div>
                        <div className="bg-dark-charcoal p-3 rounded-lg">
                            <p className="text-xs text-gray-400">Distance</p>
                            <p className="font-bold text-lg">{selectedSwing.stats.distance} <span className="text-sm font-normal">yds</span></p>
                        </div>
                        <div className="bg-dark-charcoal p-3 rounded-lg">
                            <p className="text-xs text-gray-400">Ball Speed</p>
                            <p className="font-bold text-lg">{selectedSwing.stats.ballSpeed} <span className="text-sm font-normal">mph</span></p>
                        </div>
                         <div className="bg-dark-charcoal p-3 rounded-lg">
                            <p className="text-xs text-gray-400">Club Speed</p>
                            <p className="font-bold text-lg">{selectedSwing.stats.clubHeadSpeed} <span className="text-sm font-normal">mph</span></p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h4 className="font-bold text-golf-sand mb-2">AI Coach Tips:</h4>
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            {selectedSwing.tips.map((tip, index) => <li key={index}>{tip}</li>)}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10">
                    <h3 className="text-xl font-bold text-golf-sand">Select a Shot</h3>
                    <p className="text-gray-400 mt-2">Click on a shot on the dispersion map to see its details.</p>
                </div>
            )}
        </div>
    </div>
  );
};