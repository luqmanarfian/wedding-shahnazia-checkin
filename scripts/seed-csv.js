import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
const csvPath = path.join(dataDir, 'guests.csv');

const initialCSV = `Waktu,Nama Tamu,status,Jumlah Tamu,Pesan singkat Tamu,QR_Code_ID,check_in
2026-08-07 18:34:12,Tamu Undangan Fisik,Hadir,1,Untuk Tamu dengan undangan fisik,WEDDING-1786102448594-1048,
2026-08-07 19:00:00,Bambang Supriyanto & Partner,Hadir,2,Selamat atas pernikahan Shahnazia & Damarjati!,WEDDING-1786102448594-1049,
2026-08-07 19:15:30,Dra. Hj. Endang Rahayu,Hadir,1,Semoga menjadi keluarga sakinah mawaddah warahmah.,WEDDING-1786102448594-1050,
2026-08-07 19:30:00,Keluarga Besar Sastro,Hadir,4,Turut berbahagia untuk kedua mempelai.,WEDDING-1786102448594-1051,
2026-08-07 20:00:00,Ahmad Fauzi,Hadir,2,Selamat ya Damar & Shahnazia!,WEDDING-1786102448594-1052,2026-08-20 18:42:31
`;

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(csvPath, initialCSV, 'utf-8');
console.log('✅ Guest CSV seeded successfully at:', csvPath);
