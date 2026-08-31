'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  teacherClassroomService,
  Classroom,
  Assignment,
  StudentSubmission,
} from '@/services/teacher-classroom.service';
import {
  Users,
  FileCheck,
  Plus,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  Award,
  ExternalLink,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const classroomId = resolvedParams.id;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<'assignments' | 'students'>('assignments');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Create Assignment Modal
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [maxPoints, setMaxPoints] = useState(100);
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // Grading Modal
  const [gradingAssignment, setGradingAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [score, setScore] = useState<number>(100);
  const [feedback, setFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classData, assignmentData] = await Promise.all([
        teacherClassroomService.getClassroom(classroomId),
        teacherClassroomService.listAssignments(classroomId),
      ]);
      setClassroom(classData);
      setAssignments(assignmentData);
    } catch (err) {
      console.error('Failed to load classroom details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classroomId]);

  const copyJoinCode = () => {
    if (classroom?.joinCode) {
      navigator.clipboard.writeText(classroom.joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAssignment(true);
    try {
      await teacherClassroomService.createAssignment(classroomId, {
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        maxPoints: Number(maxPoints),
      });
      setShowAssignmentModal(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err) {
      console.error('Failed to create assignment:', err);
    } finally {
      setCreatingAssignment(false);
    }
  };

  const openGrading = async (assignment: Assignment) => {
    setGradingAssignment(assignment);
    setLoadingSubmissions(true);
    try {
      const subs = await teacherClassroomService.listSubmissions(classroomId, assignment._id);
      setSubmissions(subs);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingAssignment || !selectedSubmission) return;
    setSavingGrade(true);
    try {
      await teacherClassroomService.gradeSubmission(
        classroomId,
        gradingAssignment._id,
        selectedSubmission._id,
        {
          score: Number(score),
          feedback,
        }
      );
      // Refresh submissions
      const subs = await teacherClassroomService.listSubmissions(classroomId, gradingAssignment._id);
      setSubmissions(subs);
      setSelectedSubmission(null);
    } catch (err) {
      console.error('Failed to save grade:', err);
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">শ্রেণিকক্ষ তথ্য লোড হচ্ছে...</div>;
  }

  if (!classroom) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-600">শ্রেণিকক্ষটি পাওয়া যায়নি</p>
        <Link href="/classrooms" className="text-emerald-600 text-xs font-bold mt-2 inline-block">
          ← শ্রেণিকক্ষ তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          href="/classrooms"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> সকল শ্রেণিকক্ষ
        </Link>

        <div className="p-6 md:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
                শ্রেণি {classroom.classLevel}
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                {classroom.subjectId}
              </span>
              {classroom.section && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                  শাখা: {classroom.section}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">{classroom.name}</h1>
            <p className="text-xs text-slate-500 mt-1">শিক্ষাবর্ষ: {classroom.academicYear || 2026} • মোট শিক্ষার্থী: {classroom.memberCount || 0} জন</p>
          </div>

          {/* Join Code Card */}
          <div className="p-4 bg-emerald-50 border border-emerald-200/60 rounded-2xl flex items-center gap-4 flex-shrink-0">
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">শিক্ষার্থী জয়েন কোড</p>
              <p className="text-2xl font-black font-mono text-emerald-900 mt-0.5">{classroom.joinCode}</p>
            </div>
            <button
              onClick={copyJoinCode}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all"
              title="কোড কপি করুন"
            >
              {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'assignments'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          অ্যাসাইনমেন্টসমূহ ({assignments.length})
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'students'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          যুক্ত শিক্ষার্থী ({classroom.memberCount || 0})
        </button>
      </div>

      {/* Tab 1: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">শ্রেণিকক্ষের পাঠ ও বাড়ির কাজ</h2>
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> নতুন অ্যাসাইনমেন্ট দিন
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
              <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">এখনও কোনো অ্যাসাইনমেন্ট প্রকাশ করা হয়নি।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {assignments.map((a) => (
                <div
                  key={a._id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-base">{a.title}</h3>
                    {a.description && <p className="text-xs text-slate-600 line-clamp-1">{a.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        জমা দেওয়ার শেষ সময়: {new Date(a.dueDate).toLocaleDateString('bn-BD')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        পূর্ণমান: {a.maxPoints}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openGrading(a)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto transition-colors"
                  >
                    মূল্যায়ন ও সাবমিশন দেখুন
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Students Roster */}
      {activeTab === 'students' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <Users className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">মোট {classroom.memberCount || 0} জন শিক্ষার্থী এনরোল্ড</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            শিক্ষার্থীরা মোবাইল অ্যাপে লগইন করে জয়েন কোড <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{classroom.joinCode}</span> দিলেই স্বয়ংক্রিয়ভাবে এই ক্লাসরুমে যুক্ত হবে।
          </p>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">নতুন অ্যাসাইনমেন্ট তৈরি করুন</h2>
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">অ্যাসাইনমেন্টের শিরোনাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বীজগণিতীয় সূত্রাবলি অনুশীলন ৪.১"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বিস্তারিত নির্দেশাবলি (Instructions)</label>
                <textarea
                  rows={3}
                  placeholder="শিক্ষার্থীদের জন্য বিস্তারিত বিবরণ লিখুন..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">জমা দেওয়ার শেষ তারিখ</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পূর্ণমান (Max Points)</label>
                  <input
                    type="number"
                    required
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={creatingAssignment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {creatingAssignment ? 'প্রকাশ হচ্ছে...' : 'অ্যাসাইনমেন্ট প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions & Grading Drawer / Modal */}
      {gradingAssignment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  মূল্যায়ন প্যানেল
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{gradingAssignment.title}</h2>
              </div>
              <button
                onClick={() => {
                  setGradingAssignment(null);
                  setSelectedSubmission(null);
                }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {loadingSubmissions ? (
                <div className="p-8 text-center text-slate-400">সাবমিশন লোড হচ্ছে...</div>
              ) : submissions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  এখনও কোনো শিক্ষার্থী এই অ্যাসাইনমেন্ট জমা দেয়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub._id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {sub.studentName || `শিক্ষার্থী ID: ${sub.studentId.slice(-6)}`}
                          </span>
                          {sub.isGraded ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> গ্রেডেড: {sub.score}/{gradingAssignment.maxPoints}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                              মূল্যায়ন বাকি
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 italic">
                          {sub.submissionText || 'ফাইল অ্যাটাচমেন্ট সহ জমা দেওয়া হয়েছে'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          জমা দেওয়ার তারিখ: {new Date(sub.submittedAt).toLocaleString('bn-BD')}
                        </p>
                        {sub.feedback && (
                          <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg mt-1">
                            💬 শিক্ষকের মন্তব্য: {sub.feedback}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setScore(sub.score || gradingAssignment.maxPoints);
                          setFeedback(sub.feedback || '');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold self-start sm:self-auto transition-colors"
                      >
                        {sub.isGraded ? 'গ্রেড পরিবর্তন' : 'নম্বর ও মন্তব্য দিন'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Grading Input Area */}
              {selectedSubmission && (
                <div className="mt-4 p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    মূল্যায়ন ফরম (Student: {selectedSubmission.studentName || selectedSubmission.studentId.slice(-6)})
                  </h4>
                  <form onSubmit={handleSaveGrade} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        প্রাপ্ত নম্বর (পূর্ণমান: {gradingAssignment.maxPoints})
                      </label>
                      <input
                        type="number"
                        max={gradingAssignment.maxPoints}
                        min={0}
                        required
                        value={score}
                        onChange={(e) => setScore(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        শিক্ষার্থীর জন্য পরামর্শ ও মন্তব্য (Feedback)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="যেমন: খুব সুন্দর হয়েছে, সূত্র প্রতিপাদনে আরেকটু নজর দিন।"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSubmission(null)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        disabled={savingGrade}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                      >
                        {savingGrade ? 'সংরক্ষণ হচ্ছে...' : 'গ্রেড নিশ্চিত করুন'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
