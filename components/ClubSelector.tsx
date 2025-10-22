
import React from 'react';
import { CLUBS } from '../constants';
import type { Club } from '../types';

interface ClubSelectorProps {
  selectedClub: Club;
  onClubChange: (club: Club) => void;
  disabled?: boolean;
}

export const ClubSelector: React.FC<ClubSelectorProps> = ({ selectedClub, onClubChange, disabled }) => {
  return (
    <div className="w-full sm:w-auto">
        <select
            value={selectedClub}
            onChange={(e) => onClubChange(e.target.value as Club)}
            disabled={disabled}
            className="w-full sm:w-auto bg-dark-charcoal border border-gray-600 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-golf-green-light transition-all disabled:opacity-50"
        >
            {CLUBS.map((club) => (
            <option key={club} value={club}>
                {club}
            </option>
            ))}
        </select>
    </div>
  );
};
