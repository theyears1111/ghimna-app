import React from 'react';
import { RouteState } from '../types';
import { COURSES_INFO } from '../constants';
import { ArrowLeft } from 'lucide-react';

interface Props { 
  navigate: (r: RouteState) => void; 
  courseId: string; 
}

export default function CourseDetailPage({ navigate, courseId }: Props) {
  const info = COURSES_INFO[courseId] ?? { label: courseId, emoji: '🏋️' };
  return (
    <div className="min-h-screen bg-[#2C2C2C]">
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate({ page: 'COURSES' })} className="text-white/60 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">{info.label}</h1>
      </div>
      <div className="p-4 text-center mt-12">
        <span className="text-6xl">{info.emoji}</span>
        <p className="text-white text-xl font-bold mt-4">{info.label}</p>
        <p className="text-white/40 text-sm mt-2">Da implementare</p>
      </div>
    </div>
  );
}