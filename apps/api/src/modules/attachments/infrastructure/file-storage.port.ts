export interface FileStoragePort {
  upload(objectKey: string, content: Buffer): Promise<void>;
  delete(objectKey: string): Promise<void>;
}
