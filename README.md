# openmusic-app-back-end

Repository Submission Kelas [Dicoding Belajar Fundamental Aplikasi Back-End](https://www.dicoding.com/academies/271)

Silahkan bila tertarik untuk menjadikan repository ini sebagai refrensi 🙂

# Kriteria Submission Akhir (Versi 3)
- Ekspor Lagu Pada Playlist
- Mengunggah Sampul Album
- Menyukai Album
- Menerapkan Server-Side Cache
- Pertahankan Fitur OpenMusic API versi 2 dan 1

# Saran Submission Akhir (Versi 3)
- Buat objek khusus untuk menampung seluruh konfigurasi yang digunakan oleh service eksternal
- Meminimalisir boilerplate code pada handler dengan memanfaatkan onPreResponse event extensions
- Menghindari kesalahan lupa binding dengan arrow function

# Quickstart

Clone Repository
```
git clone https://github.com/HendP/openmusic-app-back-end.git
```

Masuk kedalam folder proyek
```bash
cd openmusic-app-back-end
```

Install library
```bash
npm install || yarn install
```

Menyiapkan environment dengan menggunakan .env.template yang tersedia
```bash
# server configuration
HOST=
PORT=
 
# node-postgres configuration
PGUSER=
PGHOST=
PGPASSWORD=
PGDATABASE=
PGPORT=

# JWT token
ACCESS_TOKEN_KEY =
REFRESH_TOKEN_KEY =
ACCESS_TOKEN_AGE = 

# Message broker
RABBITMQ_SERVER=

# Redis
REDIS_SERVER=
```

Jalankan proyek ini
```bash
npm run start || yarn start
```
