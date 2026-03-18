/**
 * Проверка Bearer API на реальном деплое (Vercel).
 *
 * Usage:
 *   VERIFY_API_BASE_URL=https://maylercrm.neetrino.com npx tsx scripts/verify-external-api.ts
 *
 * Берёт API_TOKEN из .env в корне проекта.
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const BASE =
  process.env.VERIFY_API_BASE_URL?.replace(/\/$/, '') ||
  process.argv[2]?.replace(/\/$/, '') ||
  '';

async function main() {
  const token = process.env.API_TOKEN;
  if (!token) {
    console.error('❌ Задайте API_TOKEN в .env');
    process.exit(1);
  }
  if (!BASE) {
    console.error(
      '❌ Укажите базовый URL:\n   VERIFY_API_BASE_URL=https://your-app.vercel.app npx tsx scripts/verify-external-api.ts'
    );
    process.exit(1);
  }

  const auth = { Authorization: `Bearer ${token}` };
  console.log('Base URL:', BASE);

  const rFull = await fetch(`${BASE}/api/external/full`, { headers: auth });
  const fullText = await rFull.text();
  console.log(`\n1) GET /api/external/full → ${rFull.status}`);
  if (!rFull.ok) {
    console.log(fullText.slice(0, 400));
    process.exit(rFull.status === 401 ? 1 : 1);
  }

  let firstId: number | null = null;
  try {
    const data = JSON.parse(fullText) as {
      districts?: { buildings?: { apartments?: { id: number }[] }[] }[];
    };
    for (const d of data.districts ?? []) {
      for (const b of d.buildings ?? []) {
        const a = b.apartments?.[0];
        if (a?.id) {
          firstId = a.id;
          break;
        }
      }
      if (firstId) break;
    }
  } catch {
    console.error('Не удалось разобрать JSON full');
    process.exit(1);
  }

  if (!firstId) {
    console.error('❌ В базе нет квартир для теста PUT');
    process.exit(1);
  }
  console.log('   Первая квартира для теста id =', firstId);

  const params = new URLSearchParams({
    status: 'available',
    deal_date: '2025-05-05',
    ownership_name: 'Test',
    email: 'test@example.com',
    passport_tax_no: '1',
    phone: '37400000000',
    sales_type: 'unsold',
    price_sqm: '1000',
    total_paid: '0',
    buyer_address: 'x',
    other_buyers: 'x',
    payment_schedule: 'x',
    deal_description: 'x',
  });
  const rPutQ = await fetch(`${BASE}/api/apartments/${firstId}/status?${params.toString()}`, {
    method: 'PUT',
    headers: auth,
  });
  const putQBody = await rPutQ.text();
  console.log(`\n2) PUT /api/apartments/${firstId}/status?query… → ${rPutQ.status}`);
  if (rPutQ.ok) {
    console.log('   OK:', putQBody.slice(0, 200));
  } else {
    console.log('   ', putQBody.slice(0, 500));
  }

  const rPutJ = await fetch(`${BASE}/api/apartments/${firstId}/status`, {
    method: 'PUT',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'available' }),
  });
  const putJBody = await rPutJ.text();
  console.log(`\n3) PUT /api/apartments/${firstId}/status JSON body → ${rPutJ.status}`);
  if (rPutJ.ok) {
    console.log('   OK:', putJBody.slice(0, 200));
  } else {
    console.log('   ', putJBody.slice(0, 500));
  }

  if (rPutQ.ok && rPutJ.ok) {
    console.log('\n✅ Все проверки прошли.');
    process.exit(0);
  }
  console.log('\n❌ Есть ошибки — задеплойте последний код (fix revalidateTag) и повторите.');
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
