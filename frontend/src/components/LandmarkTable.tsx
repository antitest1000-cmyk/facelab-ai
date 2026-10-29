import React, { useState, useMemo } from 'react';
import { Search, Filter, Crosshair, ArrowUpDown } from 'lucide-react';
import { LandmarkPoint } from '../types/api';
import { KEY_LANDMARK_NAMES, getLandmarkRegion } from '../lib/faceMeshConnections';

interface LandmarkTableProps {
  landmarks: LandmarkPoint[];
  selectedLandmarkIndex: number | null;
  onSelectLandmark: (index: number | null) => void;
}

const REGION_TABS = [
  'All',
  'Irises',
  'Left Eye',
  'Right Eye',
  'Lips',
  'Nose',
  'Left Eyebrow',
  'Right Eyebrow',
  'Face Contour',
];

export const LandmarkTable: React.FC<LandmarkTableProps> = ({
  landmarks,
  selectedLandmarkIndex,
  onSelectLandmark,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');

  // Filter landmarks by search query and region
  const filteredLandmarks = useMemo(() => {
    return landmarks.filter((lm) => {
      const region = getLandmarkRegion(lm.index);
      const name = KEY_LANDMARK_NAMES[lm.index] || '';

      // Region filter
      if (selectedRegion !== 'All') {
        if (selectedRegion === 'Irises' && !region.includes('Iris')) return false;
        if (selectedRegion === 'Left Eye' && region !== 'Left Eye') return false;
        if (selectedRegion === 'Right Eye' && region !== 'Right Eye') return false;
        if (selectedRegion === 'Lips' && region !== 'Lips') return false;
        if (selectedRegion === 'Nose' && region !== 'Nose') return false;
        if (selectedRegion === 'Left Eyebrow' && region !== 'Left Eyebrow') return false;
        if (selectedRegion === 'Right Eyebrow' && region !== 'Right Eyebrow') return false;
        if (selectedRegion === 'Face Contour' && region !== 'Face Contour') return false;
      }

      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesIndex = lm.index.toString() === query || lm.index.toString().includes(query);
        const matchesName = name.toLowerCase().includes(query);
        const matchesRegion = region.toLowerCase().includes(query);
        return matchesIndex || matchesName || matchesRegion;
      }

      return true;
    });
  }, [landmarks, selectedRegion, searchQuery]);

  return (
    <div className="rounded-2xl bg-dark-900 border border-slate-800 overflow-hidden flex flex-col h-[480px]">
      {/* Header & Search */}
      <div className="p-3.5 border-b border-slate-800 space-y-2.5 bg-dark-900/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-brand-cyan" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Landmark Coordinates Inspector
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-dark-800 text-slate-400 border border-slate-700">
              {filteredLandmarks.length} of {landmarks.length}
            </span>
          </div>

          {selectedLandmarkIndex !== null && (
            <button
              onClick={() => onSelectLandmark(null)}
              className="text-[11px] text-brand-cyan hover:underline"
            >
              Clear focus
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by index # (e.g. 468, 1) or feature (e.g. iris, eye)..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-dark-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-brand-cyan/60"
          />
        </div>

        {/* Region filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {REGION_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedRegion(tab)}
              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap transition-all ${
                selectedRegion === tab
                  ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40'
                  : 'bg-dark-850 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-dark-950/95 backdrop-blur-xs text-[11px] text-slate-400 border-b border-slate-800 z-10 font-mono">
            <tr>
              <th className="py-2 px-3 font-medium">Index</th>
              <th className="py-2 px-3 font-medium">Anatomical Region</th>
              <th className="py-2 px-3 font-medium text-right">Norm X</th>
              <th className="py-2 px-3 font-medium text-right">Norm Y</th>
              <th className="py-2 px-3 font-medium text-right">Norm Z</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 font-mono">
            {filteredLandmarks.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs font-sans">
                  No landmarks found matching your search.
                </td>
              </tr>
            ) : (
              filteredLandmarks.map((lm) => {
                const isSelected = selectedLandmarkIndex === lm.index;
                const region = getLandmarkRegion(lm.index);
                const semanticName = KEY_LANDMARK_NAMES[lm.index];

                return (
                  <tr
                    key={lm.index}
                    onClick={() => onSelectLandmark(isSelected ? null : lm.index)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand-cyan/15 text-white border-l-2 border-brand-cyan'
                        : 'hover:bg-dark-800/60 text-slate-300'
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className="w-4 text-right">{lm.index}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
                      )}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300">{region}</span>
                        {semanticName && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                            {semanticName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400">
                      {lm.x.toFixed(5)}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400">
                      {lm.y.toFixed(5)}
                    </td>
                    <td className="py-2 px-3 text-right text-violet-400">
                      {lm.z.toFixed(5)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
