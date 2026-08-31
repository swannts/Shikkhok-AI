'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { teacherClassroomService, Classroom } from '@/services/teacher-classroom.service';
import { Users, BookOpen, FileCheck, Plus, ArrowUpRight, Copy, Check } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    teacherClassroomService
      .getMyClassrooms()
      .then((data) => setClassrooms(data))
      .catch((err) => console.error('Failed to load classrooms:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalStudents = classrooms.reduce((sum, c) => sum + (c.memberCount || 0), 0);

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
            শিক্ষক ড্যাশবোর্ড
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold">স্বাগতম, {user?.name || 'শিক্ষক মহাশয়'}!</h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            আপনার ডিজিটাল শ্রেণিকক্ষ তৈরি করুন, NCTB কারিকুলাম অনুযায়ী অ্যাসাইনমেন্ট প্রদান করুন এবং শিক্ষার্থীদের পারফরম্যান্স মূল্যায়ন করুন।
          </p>
        </div>
        <Link
          href="/classrooms"
          className="px-5 py-3 rounded-2xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 active:scale-95 transition-all shadow-lg flex items-center gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          নতুন শ্রেণিকক্ষ যোগ করুন
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">মোট শ্রেণিকক্ষ</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{classrooms.length}</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">যুক্ত শিক্ষার্থী</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalStudents}</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">মূল্যায়ন স্থিতি</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">নিয়মিত</p>
          </div>
        </div>
      </div>

      {/* Active Classrooms List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">আমার সক্রিয় শ্রেণিকক্ষসমূহ</h2>
            <p className="text-xs text-slate-500">শিক্ষার্থীদের যুক্ত করতে নিচের ৬ অক্ষরের কোডটি শেয়ার করুন</p>
          </div>
          <Link href="/classrooms" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            সবগুলো দেখুন <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">শ্রেণিকক্ষ লোড হচ্ছে...</div>
        ) : classrooms.length === 0 ? (
          <div className="p-10 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">এখনও কোনো শ্রেণিকক্ষ তৈরি করা হয়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
              আপনার প্রথম ক্লাস তৈরি করে শিক্ষার্থীদের জন্য অ্যাসাইনমেন্ট প্রকাশ করুন।
            </p>
            <Link
              href="/classrooms"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" /> শ্রেণিকক্ষ তৈরি করুন
            </Link>
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono font-bold transition-colors"
                      title="শিক্ষার্থীদের কোড কপি করুন"
                    >
                      {copiedCode === c.joinCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 text-[10px]">কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>{c.joinCode}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">বিষয়: {c.subjectId} {c.section ? `• শাখা: ${c.section}` : ''}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    👥 {c.memberCount || 0} জন শিক্ষার্থী
                  </span>
                  <Link
                    href={`/classrooms/${c._id}`}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    বিবরণ <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
