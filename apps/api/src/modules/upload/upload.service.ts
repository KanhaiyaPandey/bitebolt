import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { randomUUID } from 'node:crypto';

@Injectable()
export class UploadService {
  private s3: AWS.S3;
  private bucket: string;
  private cloudfrontDomain: string;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('aws.accessKeyId'),
      secretAccessKey: this.configService.get('aws.secretAccessKey'),
      region: this.configService.get('aws.region'),
    });
    this.bucket = this.configService.get('aws.s3Bucket') ?? '';
    this.cloudfrontDomain = this.configService.get('aws.cloudfrontDomain') ?? '';
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const key = `${folder}/${randomUUID()}.${ext}`;

    await this.s3
      .putObject({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
      .promise();

    // Return CloudFront URL if configured, otherwise S3 URL
    if (this.cloudfrontDomain) {
      return `${this.cloudfrontDomain}/${key}`;
    }

    return `https://${this.bucket}.s3.${this.configService.get('aws.region')}.amazonaws.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.deleteObject({ Bucket: this.bucket, Key: key }).promise();
  }
}
