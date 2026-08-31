import { apiClient } from '../lib/api-client';

export interface Classroom {
  _id: string;
  name: string;
  subjectId: string;
  classLevel: number;
  section?: string;
  academicYear: number;
  joinCode: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Assignment {
  _id: string;
  classroomId: string;
  title: string;
  description?: string;
  subjectId: string;
  classLevel: number;
  dueDate: string;
  maxPoints: number;
  submissionCount?: number;
  createdAt: string;
}

export interface StudentSubmission {
  _id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submissionText?: string;
  attachmentUrls?: string[];
  submittedAt: string;
  isGraded: boolean;
  score?: number;
  feedback?: string;
  gradedAt?: string;
}

export interface CreateClassroomPayload {
  name: string;
  subjectId: string;
  classLevel: number;
  section?: string;
  academicYear?: number;
}

export interface CreateAssignmentPayload {
  title: string;
  description?: string;
  dueDate: string;
  maxPoints: number;
}

export interface GradeSubmissionPayload {
  score: number;
  feedback?: string;
}

export const teacherClassroomService = {
  async getMyClassrooms(): Promise<Classroom[]> {
    const res = await apiClient.get('/classrooms/me/teaching');
    return res.data.data || res.data;
  },

  async createClassroom(payload: CreateClassroomPayload): Promise<Classroom> {
    const res = await apiClient.post('/classrooms', payload);
    return res.data.data || res.data;
  },

  async getClassroom(classroomId: string): Promise<Classroom & { students?: any[]; assignments?: Assignment[] }> {
    const res = await apiClient.get(`/classrooms/${classroomId}`);
    return res.data.data || res.data;
  },

  async listAssignments(classroomId: string): Promise<Assignment[]> {
    const res = await apiClient.get(`/classrooms/${classroomId}/assignments`);
    return res.data.data || res.data;
  },

  async createAssignment(classroomId: string, payload: CreateAssignmentPayload): Promise<Assignment> {
    const res = await apiClient.post(`/classrooms/${classroomId}/assignments`, payload);
    return res.data.data || res.data;
  },

  async listSubmissions(classroomId: string, assignmentId: string): Promise<StudentSubmission[]> {
    const res = await apiClient.get(`/classrooms/${classroomId}/assignments/${assignmentId}/submissions`);
    return res.data.data || res.data;
  },

  async gradeSubmission(
    classroomId: string,
    assignmentId: string,
    submissionId: string,
    payload: GradeSubmissionPayload
  ): Promise<StudentSubmission> {
    const res = await apiClient.put(
      `/classrooms/${classroomId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
      payload
    );
    return res.data.data || res.data;
  },
};
