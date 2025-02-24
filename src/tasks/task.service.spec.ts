import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TaskStatus } from './tasks-status.enum';
import { User } from '../auth/user.entity';

const mockTaskRepository = () => ({
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

describe('TasksService', () => {
  let tasksService: TasksService;
  let taskRepository: jest.Mocked<Partial<Repository<Task>>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useFactory: mockTaskRepository },
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
  });

  describe('getTaskById', () => {
    it('should return the task if found', async () => {
      const mockTask = { id: '1', title: 'Test task', user: {} } as Task;
      taskRepository.findOne!.mockResolvedValue(mockTask);

      const result = await tasksService.getTaskById('1', {} as User);
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      taskRepository.findOne!.mockResolvedValue(null);

      await expect(tasksService.getTaskById('1', {} as User)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTask', () => {
    it('should create and return a task', async () => {
      const createTaskDto = { title: 'Test', description: 'Desc' };
      const mockUser = {} as User;
      const mockTask = { id: '1', ...createTaskDto, status: TaskStatus.OPEN, user: mockUser } as Task;
      taskRepository.create!.mockReturnValue(mockTask);
      taskRepository.save!.mockResolvedValue(mockTask);

      const result = await tasksService.createTask(createTaskDto, mockUser);
      expect(result).toEqual(mockTask);
    });
  });

  // describe('deleteTaskById', () => {
  //   it('should delete task successfully', async () => {
  //     taskRepository.delete!.mockResolvedValue({ affected: 1 });

  //     await expect(tasksService.deleteTaskById('1', {} as User)).resolves.not.toThrow();
  //   });

  //   it('should throw NotFoundException if task not found', async () => {
  //     taskRepository.delete!.mockResolvedValue({ affected: 0 });

  //     await expect(tasksService.deleteTaskById('1', {} as User)).rejects.toThrow(
  //       NotFoundException,
  //     );
  //   });
  // });

  describe('updateTaskStatus', () => {
    it('should update the task status', async () => {
      const mockTask = { id: '1', status: TaskStatus.OPEN, save: jest.fn() } as unknown as Task;
      jest.spyOn(tasksService, 'getTaskById').mockResolvedValue(mockTask);
      taskRepository.save!.mockResolvedValue(mockTask);

      const result = await tasksService.updateTaskStatus('1', TaskStatus.DONE, {} as User);
      expect(result.status).toBe(TaskStatus.DONE);
    });
  });
});
