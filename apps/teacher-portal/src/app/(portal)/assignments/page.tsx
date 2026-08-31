'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  teacherClassroomService,
  Classroom,
  Assignment,
} from '@/services/teacher-classroom.service';
import { FileCheck, BookOpen, Calendar, Award, ArrowRight } from 'lucide-react';

export default function AssignmentsOverviewPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [allAssignments, setAllAssignments] = useState<(Assignment & { classroomName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const classes = await teacherClassroomService.getMyClassrooms();
        setClassrooms(classes);

        const assignmentPromises = classes.map(async (c) => {
          const list = await teacherClassroomService.listAssignments(c._id);
          return list.map((a) => ({ ...a, classroomName: c.name }));
        });

        const results = await Promise.all(assignmentPromises);
        setAllAssignments(results.flat());
      } catch (err) {
        console.error('Failed to load assignments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">অ্যাসাইনমেন্ট ও বাড়ির কাজ পরিচালনা</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          আপনার সকল শ্রেণিকক্ষের চলমান অ্যাসাইনমেন্ট ও শিক্ষার্থী সাবমিশন এক নজরে দেখুন
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">অ্যাসাইনমেন্ট লোড হচ্ছে...</div>
      ) : allAssignments.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
          <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">কোনো সক্রিয় অ্যাসাইনমেন্ট নেই</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            নির্দিষ্ট শ্রেণিকক্ষে প্রবেশ করে নতুন অ্যাসাইনমেন্ট যুক্ত করুন।
          </p>
          <Link
            href="/classrooms"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
          >
            <BookOpen className="w-3.5 h-3.5" /> শ্রেণিকক্ষে যান
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {allAssignments.map((a) => (
            <div
              key={a._id}
              className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-bold">
                  {a.classroomName}
                </span>
                <h3 className="font-bold text-slate-900 text-lg">{a.title}</h3>
                {a.description && <p className="text-xs text-slate-600 line-clamp-1">{a.description}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    শেষ সময়: {new Date(a.dueDate).toLocaleDateString('bn-BD')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    পূর্ণমান: {a.maxPoints}
                  </span>
                </div>
              </div>

              <Link
                href={`/classrooms/${a.classroomId}`}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto shadow-sm transition-all"
              >
                মূল্যায়ন করুন <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
