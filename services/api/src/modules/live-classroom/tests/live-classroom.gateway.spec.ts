import { Test, TestingModule } from '@nestjs/testing';
import { LiveClassroomGateway } from '../live-classroom.gateway';
import { LiveClassroomService } from '../live-classroom.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../core/redis/redis.service';
import { ClassroomRepository } from '../../classrooms/repositories/classroom.repository';
import { ClassroomMemberRepository } from '../../classrooms/repositories/classroom-member.repository';
import { MetricsService } from '../../../common/metrics/metrics.service';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('LiveClassroomGateway', () => {
  let gateway: LiveClassroomGateway;
  let service: LiveClassroomService;
  let classroomRepository: jest.Mocked<ClassroomRepository>;
  let classroomMemberRepository: jest.Mocked<ClassroomMemberRepository>;

  const mockRedisClient = {
    hset: jest.fn().mockResolvedValue(1),
    hsetnx: jest.fn().mockResolvedValue(1),
    hget: jest.fn(),
    hgetall: jest.fn().mockResolvedValue({}),
    hdel: jest.fn().mockResolvedValue(1),
    hlen: jest.fn().mockResolvedValue(0),
    get: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    rpush: jest.fn().mockResolvedValue(1),
    lpush: jest.fn().mockResolvedValue(1),
    lrange: jest.fn().mockResolvedValue([]),
    ltrim: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue(undefined),
    status: 'ready',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
          provide: RedisService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockRedisClient),
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
        {
          provide: MetricsService,
          useValue: {
            activeWebSocketConnections: { inc: jest.fn(), dec: jest.fn() },
            activeClassrooms: { inc: jest.fn(), dec: jest.fn() },
            websocketDisconnects: { inc: jest.fn() },
            websocketChatMessages: { inc: jest.fn() },
            websocketQuizEvents: { inc: jest.fn() },
            websocketWhiteboardStrokes: { inc: jest.fn() },
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
    mockRedisClient.hgetall.mockResolvedValue({});

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

  it('should block non-teachers from clearing the whiteboard', async () => {
    classroomRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      teacherId: new Types.ObjectId(),
      isActive: true,
    } as any);
    classroomMemberRepository.isMember.mockResolvedValue(true);
    mockRedisClient.hgetall.mockResolvedValue({
      sock_1: JSON.stringify({
        socketId: 'sock_1',
        userId: 'student_1',
        name: 'Rahim',
        role: 'student',
        joinedAt: new Date().toISOString(),
      }),
    });

    const client = createSocket({ sub: 'student_1', role: 'student' });
    client.data.joinedClassrooms = new Set<string>(['class_math_8']);

    await expect(
      gateway.handleWhiteboardClear(client, { classroomId: 'class_math_8' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should manage participant rosters in live rooms', async () => {
    const participant = {
      socketId: 'sock_1',
      userId: 'teacher_1',
      name: 'Dr. Karim',
      role: 'teacher' as const,
      joinedAt: new Date(),
    };

    mockRedisClient.hgetall.mockResolvedValueOnce({});
    mockRedisClient.hgetall.mockResolvedValueOnce({
      sock_1: JSON.stringify(participant),
    });

    await service.addParticipant('class_math_8', participant);
    expect(mockRedisClient.hset).toHaveBeenCalledWith(
      'live:classroom:class_math_8:participants',
      'sock_1',
      JSON.stringify(participant),
    );

    const roster = await service.getParticipants('class_math_8');
    expect(roster.length).toBe(1);
    expect(roster[0].name).toBe('Dr. Karim');

    mockRedisClient.hgetall.mockResolvedValueOnce({
      sock_1: JSON.stringify(participant),
    });
    mockRedisClient.hget.mockResolvedValueOnce(JSON.stringify(participant));
    mockRedisClient.get.mockResolvedValueOnce('class_math_8');

    const leaveRes = await service.removeParticipant('sock_1');
    expect(leaveRes?.remaining.length).toBe(1);
  });

  it('should synchronize whiteboard strokes and clear canvas', async () => {
    const stroke = {
      id: 'stroke_1',
      color: '#10b981',
      width: 3,
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 25 },
      ],
    };

    mockRedisClient.lrange.mockResolvedValue([JSON.stringify(stroke)]);

    await service.addStroke('class_math_8', stroke);
    expect(mockRedisClient.rpush).toHaveBeenCalledWith(
      'live:classroom:class_math_8:whiteboard',
      JSON.stringify(stroke),
    );
    expect(mockRedisClient.ltrim).toHaveBeenCalledWith(
      'live:classroom:class_math_8:whiteboard',
      -1000,
      -1,
    );

    const state = await service.getWhiteboardState('class_math_8');
    expect(state.length).toBe(1);
    expect(state[0].color).toBe('#10b981');

    await service.clearWhiteboard('class_math_8');
    expect(mockRedisClient.del).toHaveBeenCalledWith('live:classroom:class_math_8:whiteboard');
  });

  it('should start timed multiplayer quiz and compute leaderboard', async () => {
    const quiz = {
      id: 'q_1',
      questionText: 'নিউটনের প্রথম গতিসূত্র কোনটি?',
      options: ['জড়তার সূত্র', 'বলের সূত্র', 'ক্রিয়া-প্রতিক্রিয়া'],
      correctOptionIndex: 0,
      timeLimitSeconds: 30,
      startedAt: new Date().toISOString(),
    };

    mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(quiz));
    mockRedisClient.hgetall.mockResolvedValueOnce({
      student_1: JSON.stringify({
        userId: 'student_1',
        studentName: 'Rahim',
        questionId: 'q_1',
        selectedOptionIndex: 0,
        submittedAt: new Date().toISOString(),
        isCorrect: true,
        score: 100,
      }),
      student_2: JSON.stringify({
        userId: 'student_2',
        studentName: 'Karim',
        questionId: 'q_1',
        selectedOptionIndex: 1,
        submittedAt: new Date().toISOString(),
        isCorrect: false,
        score: 0,
      }),
    });

    await service.startQuiz('class_math_8', quiz);
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      'live:classroom:class_math_8:quiz',
      JSON.stringify(quiz),
    );

    const sub1 = await service.submitQuizAnswer('class_math_8', {
      userId: 'student_1',
      studentName: 'Rahim',
      questionId: 'q_1',
      selectedOptionIndex: 0,
    });
    expect(sub1?.isCorrect).toBe(true);
    expect(sub1?.score).toBe(100);

    const leaderboard = await service.getQuizLeaderboard('class_math_8');
    expect(leaderboard[0].studentName).toBe('Rahim');
    expect(leaderboard[0].score).toBe(100);
  });
});
