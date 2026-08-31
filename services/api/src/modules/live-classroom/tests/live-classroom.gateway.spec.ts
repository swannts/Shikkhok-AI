import { Test, TestingModule } from '@nestjs/testing';
import { LiveClassroomGateway } from '../live-classroom.gateway';
import { LiveClassroomService } from '../live-classroom.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClassroomRepository } from '../../classrooms/repositories/classroom.repository';
import { ClassroomMemberRepository } from '../../classrooms/repositories/classroom-member.repository';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('LiveClassroomGateway', () => {
  let gateway: LiveClassroomGateway;
  let service: LiveClassroomService;
  let classroomRepository: jest.Mocked<ClassroomRepository>;
  let classroomMemberRepository: jest.Mocked<ClassroomMemberRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveClassroomGateway,
        LiveClassroomService,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({ sub: 'user_123', name: 'Rahim', role: 'student' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: ClassroomRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: ClassroomMemberRepository,
          useValue: {
            isMember: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<LiveClassroomGateway>(LiveClassroomGateway);
    service = module.get<LiveClassroomService>(LiveClassroomService);
    classroomRepository = module.get(ClassroomRepository);
    classroomMemberRepository = module.get(ClassroomMemberRepository);
  });

  const createSocket = (user: any = null) =>
    ({
      id: 'sock_1',
      data: user ? { user, joinedClassrooms: new Set<string>() } : {},
      handshake: { auth: {}, headers: {}, query: {} },
      disconnect: jest.fn(),
      join: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    }) as any;

  it('should be defined', () => {
    expect(gateway).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should disconnect anonymous sockets during connection', async () => {
    const client = createSocket();

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('should reject classroom join attempts without authentication', async () => {
    await expect(
      gateway.handleJoinClassroom(createSocket(), { classroomId: 'class_math_8' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should allow enrolled students to join but ignore any spoofed role intent', async () => {
    classroomRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      teacherId: new Types.ObjectId(),
      isActive: true,
    } as any);
    classroomMemberRepository.isMember.mockResolvedValue(true);

    const client = createSocket({ sub: 'student_1', role: 'student' });

    await gateway.handleJoinClassroom(client, {
      classroomId: 'class_math_8',
      name: 'Rahim',
    });

    expect(client.join).toHaveBeenCalledWith('class_math_8');
    expect(client.emit).toHaveBeenCalledWith(
      'room_joined',
      expect.objectContaining({
        participant: expect.objectContaining({
          userId: 'student_1',
          role: 'student',
          name: 'Rahim',
        }),
      }),
    );
  });

  it('should block non-teachers from clearing the whiteboard', () => {
    const client = createSocket({ sub: 'student_1', role: 'student' });
    service.addParticipant('class_math_8', {
      socketId: 'sock_1',
      userId: 'student_1',
      name: 'Rahim',
      role: 'student',
      joinedAt: new Date(),
    });

    expect(() =>
      gateway.handleWhiteboardClear(client, { classroomId: 'class_math_8' }),
    ).toThrow(ForbiddenException);
  });

  it('should manage participant rosters in live rooms', () => {
    const roster1 = service.addParticipant('class_math_8', {
      socketId: 'sock_1',
      userId: 'teacher_1',
      name: 'Dr. Karim',
      role: 'teacher',
      joinedAt: new Date(),
    });

    expect(roster1.length).toBe(1);
    expect(roster1[0].name).toBe('Dr. Karim');

    const roster2 = service.addParticipant('class_math_8', {
      socketId: 'sock_2',
      userId: 'student_1',
      name: 'Rahim',
      role: 'student',
      joinedAt: new Date(),
    });

    expect(roster2.length).toBe(2);

    const leaveRes = service.removeParticipant('sock_2');
    expect(leaveRes?.remaining.length).toBe(1);
  });

  it('should synchronize whiteboard strokes and clear canvas', () => {
    service.addStroke('class_math_8', {
      id: 'stroke_1',
      color: '#10b981',
      width: 3,
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 25 },
      ],
    });

    const state = service.getWhiteboardState('class_math_8');
    expect(state.length).toBe(1);
    expect(state[0].color).toBe('#10b981');

    service.clearWhiteboard('class_math_8');
    expect(service.getWhiteboardState('class_math_8').length).toBe(0);
  });

  it('should start timed multiplayer quiz and compute leaderboard', () => {
    service.startQuiz('class_math_8', {
      id: 'q_1',
      questionText: 'নিউটনের প্রথম গতিসূত্র কোনটি?',
      options: ['জড়তার সূত্র', 'বলের সূত্র', 'ক্রিয়া-প্রতিক্রিয়া'],
      correctOptionIndex: 0,
      timeLimitSeconds: 30,
      startedAt: new Date().toISOString(),
    });

    const sub1 = service.submitQuizAnswer('class_math_8', {
      userId: 'student_1',
      studentName: 'Rahim',
      questionId: 'q_1',
      selectedOptionIndex: 0,
    });

    expect(sub1?.isCorrect).toBe(true);
    expect(sub1?.score).toBe(100);

    const sub2 = service.submitQuizAnswer('class_math_8', {
      userId: 'student_2',
      studentName: 'Karim',
      questionId: 'q_1',
      selectedOptionIndex: 1,
    });

    expect(sub2?.isCorrect).toBe(false);
    expect(sub2?.score).toBe(0);

    const leaderboard = service.getQuizLeaderboard('class_math_8');
    expect(leaderboard[0].studentName).toBe('Rahim');
    expect(leaderboard[0].score).toBe(100);
  });
});
