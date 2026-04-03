import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ImageMetadata } from 'src/products/interfaces/image-metadata.interface';

export interface SignedUrlResponse {
  signedUrl: string;
  url: string;
  metadata: ImageMetadata;
}

@Injectable()
export class CloudflareService {
  private readonly s3: S3Client;
  private readonly bucketName = process.env.R2_BUCKET_NAME;
  private readonly logger = new Logger('CloudflareService');

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      endpoint: configService.get('CLOUDFLARE_URL') ?? '',
      credentials: {
        accessKeyId: configService.get('CLOUDFLARE_ACCESS_KEY_ID') ?? '',
        secretAccessKey:
          configService.get('CLOUDFLARE_SECRET_ACCESS_KEY') ?? '',
      },
      region: 'auto',
    });
  }

  async getUploadUrl(
    imageMetadata: ImageMetadata[],
  ): Promise<SignedUrlResponse[]> {
    if (!imageMetadata) {
      throw new BadRequestException('Images File is required');
    }
    const imagesSignedUrl: SignedUrlResponse[] = [];
    for (const metadata of imageMetadata) {
      const slug = crypto.randomUUID();
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: slug,
        ContentType: metadata.type,
      });
      const signedUrl = await getSignedUrl(this.s3, command, {
        expiresIn: 3600,
      });
      const url = `${process.env.R2_BUCKET_PATH}/${slug}`;
      imagesSignedUrl.push({ signedUrl, url, metadata });
    }
    // this.logger.debug(imagesSignedUrl);
    return imagesSignedUrl;
  }

  async getDownloadUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    return await getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

  async getDeleteUrl(fileKey: string): Promise<string> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    return await getSignedUrl(this.s3, command);
  }
}
