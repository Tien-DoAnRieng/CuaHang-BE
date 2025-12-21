import { SetMetadata } from '@nestjs/common';

export const OWNERSHIP_KEY = 'ownership';
export const Ownership = (resource: 'product' | 'order' | 'review') => SetMetadata(OWNERSHIP_KEY, resource);

