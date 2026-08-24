import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { MongoObjectIdPipe } from './mongo-object-id.pipe';

describe('MongoObjectIdPipe', () => {
  it('should accept a valid object id string', () => {
    const pipe = new MongoObjectIdPipe();
    expect(pipe.transform('64b8268b6cb348e3b53f4100')).toBe('64b8268b6cb348e3b53f4100');
  });

  it('should reject an invalid object id string', () => {
    const pipe = new MongoObjectIdPipe();
    expect(() => pipe.transform('not-an-object-id')).toThrow(BadRequestException);
  });
});
