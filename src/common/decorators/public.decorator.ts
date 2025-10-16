import { SetMetadata } from '@nestjs/common';

// Key để đánh dấu route là public (bỏ qua guard)
export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
