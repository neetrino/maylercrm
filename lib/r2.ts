import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, ''); // без завершающего /

function getClient(): S3Client {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY must be set'
    );
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Загружает файл в R2. Возвращает ключ объекта (path) и полный публичный URL.
 */
export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ key: string; url: string }> {
  const client = getClient();
  if (!bucketName) throw new Error('R2_BUCKET_NAME must be set');

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  if (!publicUrl) {
    throw new Error(
      'R2_PUBLIC_URL must be set for public file URLs (enable Public access on the R2 bucket and set the base URL)'
    );
  }
  const url = `${publicUrl}/${key}`;
  return { key, url };
}

/**
 * Удаляет объект из R2 по ключу.
 */
export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  if (!bucketName) throw new Error('R2_BUCKET_NAME must be set');

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

/**
 * Извлекает ключ R2 из сохранённого fileUrl (R2_PUBLIC_URL или r2.dev).
 */
export function getKeyFromFileUrl(fileUrl: string): string | null {
  if (!fileUrl.startsWith('https://') && !fileUrl.startsWith('r2://'))
    return null;
  if (publicUrl && fileUrl.startsWith(publicUrl)) {
    const prefix = publicUrl.endsWith('/') ? publicUrl : publicUrl + '/';
    return fileUrl.slice(prefix.length) || null;
  }
  try {
    const u = new URL(fileUrl);
    if (u.hostname.endsWith('.r2.dev')) return u.pathname.replace(/^\//, '') || null;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Проверяет, что fileUrl указывает на наш R2 (R2_PUBLIC_URL или r2.dev).
 */
export function isR2Url(fileUrl: string): boolean {
  return getKeyFromFileUrl(fileUrl) !== null;
}
