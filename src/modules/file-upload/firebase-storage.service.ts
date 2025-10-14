import { Injectable, Logger } from '@nestjs/common';
import { firebaseAdmin, firebaseBucket } from '../../config/firebase.config';

@Injectable()
export class FirebaseStorageService {
  private readonly logger = new Logger(FirebaseStorageService.name);

  async uploadBuffer(file: Express.Multer.File, destination?: string): Promise<string> {
    // assign to local var so we can narrow the type
    const bucket: any = firebaseBucket as any;
    if (!bucket) {
      throw new Error('Firebase not initialized. Make sure FIREBASE_SERVICE_ACCOUNT_PATH and FIREBASE_STORAGE_BUCKET are set.');
    }

    const filename = destination ? `${destination}/${file.originalname}` : file.originalname;
    const fileRef = bucket.file(filename);

    const stream = fileRef.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (err) => {
        this.logger.error('Firebase upload error', err);
        reject(err);
      });
      stream.on('finish', async () => {
        try {
          await fileRef.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;
          resolve(publicUrl);
        } catch (err) {
          reject(err);
        }
      });
      stream.end(file.buffer);
    });
  }
}
