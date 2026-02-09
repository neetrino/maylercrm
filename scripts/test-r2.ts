/**
 * Быстрый тест R2: загрузка и удаление тестового объекта.
 * Запуск: npx dotenv -e .env -- tsx scripts/test-r2.ts
 * или: node -r dotenv/config -r tsx/register scripts/test-r2.ts (если есть tsx/register)
 * Проще: tsx с загрузкой .env вручную
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем .env до импорта lib/r2
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const { putObject, deleteObject, getKeyFromFileUrl, isR2Url } = await import(
    '../lib/r2'
  );

  const key = 'test/r2-check-' + Date.now() + '.txt';
  const body = Buffer.from('R2 test ' + new Date().toISOString(), 'utf-8');

  console.log('1. Upload test file to R2...');
  const { url } = await putObject(key, body, 'text/plain');
  console.log('   URL:', url);

  const extractedKey = getKeyFromFileUrl(url);
  const isR2 = isR2Url(url);
  console.log('2. getKeyFromFileUrl:', extractedKey, 'isR2Url:', isR2);
  if (extractedKey !== key) throw new Error('getKeyFromFileUrl mismatch');

  console.log('3. Delete test file from R2...');
  await deleteObject(key);
  console.log('   OK.');
  console.log('\nR2 test passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
