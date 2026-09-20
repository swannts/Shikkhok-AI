import { apiClient } from "../lib/api-client";

export interface Classroom {
  _id: string;
  name: string;
  subjectId?: string | null;
  classLevel: number;
  section?: string;
  medium: string;
  curriculumYear: number;
  code: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CurriculumSubject {
  _id: string;
  name: string;
  slug: string;
  classLevel: number;
  medium: string;
  curriculumYear: number;
}

export interface Assignment {
  _id: string;
  classroomId: string;
  title: string;
  description?: string;
  dueDate: string;
  maxScore: number;
  assignmentType: string;
  isPublished: boolean;
  createdAt: string;
}

export interface StudentSubmission {
  _id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  content: string;
  attachmentUrls?: string[];
  submittedAt: string;
  status: string;
  score?: number;
  teacherFeedback?: string;
  gradedAt?: string;
}

export interface CreateClassroomPayload {
  name: string;
  subjectId?: string;
  classLevel: number;
  section?: string;
  medium?: string;
  curriculumYear?: number;
  description?: string;
}

export interface CreateAssignmentPayload {
  title: string;
  description?: string;
  dueDate: string;
  maxScore: number;
}

export interface GradeSubmissionPayload {
  score: number;
  teacherFeedback?: string;
}

export const teacherClassroomService = {
  async getMyClassrooms(): Promise<Classroom[]> {
    const res = await apiClient.get("/classrooms/me/teaching");
    return res.data.data || res.data;
  },

  async listSubjects(
    classLevel: number,
    medium = "bangla",
    curriculumYear = 2026,
  ): Promise<CurriculumSubject[]> {
    const res = await apiClient.get("/curriculum/subjects", {
      params: { classLevel, medium, curriculumYear },
    });
    return res.data.data || res.data;
  },

  async createClassroom(payload: CreateClassroomPayload): Promise<Classroom> {
    const res = await apiClient.post("/classrooms", payload);
    return res.data.data || res.data;
  },

  async getClassroom(
    classroomId: string,
  ): Promise<Classroom & { students?: any[]; assignments?: Assignment[] }> {
    const res = await apiClient.get(`/classrooms/${classroomId}`);
    return res.data.data || res.data;
  },

  async listAssignments(classroomId: string): Promise<Assignment[]> {
    const res = await apiClient.get(`/classrooms/${classroomId}/assignments`);
    return res.data.data || res.data;
  },

  async createAssignment(
    classroomId: string,
    payload: CreateAssignmentPayload,
  ): Promise<Assignment> {
    const res = await apiClient.post(
      `/classrooms/${classroomId}/assignments`,
      payload,
    );
    return res.data.data || res.data;
  },

  async listSubmissions(
    classroomId: string,
    assignmentId: string,
  ): Promise<StudentSubmission[]> {
    const res = await apiClient.get(
      `/classrooms/${classroomId}/assignments/${assignmentId}/submissions`,
    );
    return res.data.data || res.data;
  },

  async gradeSubmission(
    classroomId: string,
    assignmentId: string,
    submissionId: string,
    payload: GradeSubmissionPayload,
  ): Promise<StudentSubmission> {
    const res = await apiClient.put(
      `/classrooms/${classroomId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
      payload,
    );
    return res.data.data || res.data;
  },
};
