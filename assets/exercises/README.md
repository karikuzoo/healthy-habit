# Peraga gerakan latihan

Berkas di folder ini **dibuat otomatis** oleh `scripts/fetch-exercise-media.mjs`.
Jangan disunting manual — jalankan ulang skripnya:

```bash
node scripts/fetch-exercise-media.mjs
```

## Sumber

[free-exercise-db](https://github.com/yuhonas/free-exercise-db) — **Unlicense
(domain publik)**, 876 gerakan. Tidak ada tanda tanya lisensi.

Repo itu menyediakan **dua foto JPG per gerakan**, bukan animasi: posisi awal
dan posisi akhir. Itu cara standar panduan latihan menunjukkan bentuk gerakan.

## Kenapa bukan GIF atau WebP animasi

| Pendekatan | 20 gerakan |
|---|---|
| GIF | ~35 MB |
| WebP animasi | ~11 MB |
| **2 foto JPG (dipakai)** | **2,2 MB** |

Kesan gerak dihasilkan komponen `ExerciseMedia`, yang menukar kedua frame
bergantian tiap 900 ms dengan transisi silang. Untuk peraga bentuk gerakan itu
cukup — yang perlu ditangkap mata memang perbedaan antara kedua posisi.

## Penamaan

`<id gerakan>-<indeks frame>.jpg`, mengikuti `id` di `src/data/workout.js`:

```
goblet-squat-0.jpg    posisi awal
goblet-squat-1.jpg    posisi akhir
```

Registry-nya dihasilkan ke `src/data/exerciseMedia.generated.js` sebagai modul
JS berisi `require()` — bukan JSON, karena Metro hanya memaketkan aset lewat
`require()` dengan path harfiah.

## Menambah gerakan

Tambahkan pemetaan di `MAPPING` pada `scripts/fetch-exercise-media.mjs`, lalu
jalankan ulang skripnya. Nama harus **sama persis** dengan `name` di dataset.

Pemetaannya sengaja manual, bukan otomatis: pencocokan berbasis kemiripan nama
menghasilkan pilihan keliru — "Push-up" tertarik ke "Clock Push-Up" dan
"Calf raise" ke "Barbell Seated Calf Raise", padahal ada padanan yang jauh
lebih tepat.

## Tambahan manual

Gerakan tanpa padanan di dataset bisa diisi sendiri lewat `exerciseMedia.js`
(bukan berkas generated). Menerima berkas lokal maupun URL — `expo-image`
memperlakukan keduanya sama dan menyimpan URL ke cache disk.

Saat ini **seluruh gerakan sudah punya peraga**. "Bird dog" dulu jadi
pengecualian karena tidak ada di dataset, dan gerakan itu akhirnya
dikeluarkan dari rencana.
