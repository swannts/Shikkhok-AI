'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { teacherClassroomService, Classroom } from '@/services/teacher-classroom.service';
import { Users, Plus, Copy, Check, ArrowRight, X } from 'lucide-react';

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('mathematics');
  const [classLevel, setClassLevel] = useState(8);
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState(2026);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClassrooms = () => {
    setLoading(true);
    teacherClassroomService
      .getMyClassrooms()
      .then((data) => setClassrooms(data))
      .catch((err) => console.error('Failed to load classrooms:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await teacherClassroomService.createClassroom({
        name,
        subjectId,
        classLevel: Number(classLevel),
        section,
        academicYear: Number(academicYear),
      });
      setShowModal(false);
      setName('');
      fetchClassrooms();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'শ্রেণিকক্ষ তৈরি ব্যর্থ হয়েছে');
    } finally {
      setCreating(false);
    }
  };

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">আমার শ্রেণিকক্ষসমূহ (Classrooms)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            শিক্ষার্থীদের ক্লাসে যুক্ত করতে প্রতিটি ক্লাসের স্বয়ংক্রিয় জয়েন কোড শেয়ার করুন
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> নতুন শ্রেণিকক্ষ যোগ করুন
        </button>
      </div>

      {/* Classroom List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">শ্রেণিকক্ষ লোড হচ্ছে...</div>
      ) : classrooms.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">এখনও কোনো শ্রেণিকক্ষ তৈরি করা হয়নি</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            নতুন ক্লাস তৈরি করে শিক্ষার্থীদের আমন্ত্রণ জানান।
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
          >
            <Plus className="w-3.5 h-3.5" /> শ্রেণিকক্ষ তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((c) => (
            <div
              key={c._id}
              className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold">
                    শ্রেণি {c.classLevel}
                  </span>
                  <button
                    onClick={() => copyJoinCode(c.joinCode)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-mono font-bold transition-colors"
                    title="কোড কপি করুন"
                  >
                    {copiedCode === c.joinCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 text-[11px]">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.joinCode}</span>
                      </>
                    )}
                  </button>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  বিষয়: <span className="font-semibold text-slate-700">{c.subjectId}</span>
                  {c.section ? ` • শাখা: ${c.section}` : ''}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">👥 {c.memberCount || 0} শিক্ষার্থী</span>
                <Link
                  href={`/classrooms/${c._id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                >
                  বিস্তারিত <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Classroom Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">নতুন শ্রেণিকক্ষ তৈরি করুন</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">শ্রেণিকক্ষের নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ৮ম শ্রেণি গণিত (শাখা ক)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শ্রেণি (Class Level)</label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[6, 7, 8, 9, 10].map((grade) => (
                      <option key={grade} value={grade}>
                        শ্রেণি {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শাখা (Section)</label>
                  <input
                    type="text"
                    placeholder="যেমন: A বা ক"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বিষয় (Subject)</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="mathematics">গণিত (Mathematics)</option>
                    <option value="science">বিজ্ঞান (Science)</option>
                    <option value="physics">পদার্থবিজ্ঞান (Physics)</option>
                    <option value="chemistry">রসায়ন (Chemistry)</option>
                    <option value="biology">জীববিজ্ঞান (Biology)</option>
                    <option value="english">ইংরেজি (English)</option>
                    <option value="bangla">বাংলা (Bangla)</option>
                    <option value="ict">তথ্য ও যোগাযোগ প্রযুক্তি</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শিক্ষাবর্ষ</label>
                  <input
                    type="number"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {creating ? 'তৈরি হচ্ছে...' : 'শ্রেণিকক্ষ প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
