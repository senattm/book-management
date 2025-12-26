Kitap Yönetim Sistemi API (Book Management System)
Bu proje; kitapların, yazarların, kategorilerin, ödünç alma süreçlerinin ve kullanıcı incelemelerinin merkezi bir şekilde yönetilmesini sağlayan bir RESTful API projesidir.

1. Genel Bakış
Sistem, modern web standartları ve güvenlik protokolleri (JWT, Rate Limiting) dikkate alınarak geliştirilmiştir. PostgreSQL veritabanı ile verilerin kalıcılığı sağlar.

Temel Özellikler
Yetkilendirme ve Güvenlik: JWT tabanlı kimlik doğrulama, rol tabanlı erişim kontrolü (User/Admin) ve şifreleme.

Veri Yönetimi: Kitap, yazar ve kategori (hiyerarşik yapı) yönetimi.

İşlem Takibi: Kitap ödünç alma ve iade süreçlerinin yönetimi.

Etkileşim: Kullanıcıların kitaplara puan vermesi ve yorum yapması.

Dokümantasyon: Swagger UI üzerinden interaktif API referansı.

2. Teknik Gereksinimler
Projenin yerel ortamda veya konteyner yapısında çalıştırılması için aşağıdaki bileşenlerin yüklü olması gerekmektedir:

Node.js (v18+)

Docker & Docker Compose (Opsiyonel, önerilen)

PostgreSQL & Redis 

3. Kurulum ve Yapılandırma
.env değişkeni
PORT=3000
DATABASE_URL="postgresql://book:bookpass@localhost:5432/bookdb?schema=public"
REDIS_URL="redis://localhost:6379"
REDIS_TTL=60
JWT_SECRET="dev_jwt_secret"
JWT_REFRESH_SECRET="dev_jwt_refresh_secret"

# 1. Bağımlılıkların yüklenmesi
npm install

# 2. Veritabanı şemasının oluşturulması ve Prisma istemcisinin üretilmesi
npx prisma migrate dev --name init
npx prisma generate

# 3. Opsiyonel: Örnek verilerin (seed) yüklenmesi
npx prisma db seed

# 4. Uygulamanın geliştirici modunda başlatılması
npm run dev

4. API Dokümantasyonu ve Test
Uygulama başarıyla başlatıldıktan sonra, tüm API uç noktalarına, parametrelere ve örnek isteklere aşağıdaki adres üzerinden erişilebilir:

Swagger UI: http://localhost:3000/api-docs

5. Proje Yapısı
/src/controllers: İstek işleme ve yanıt yönetimi.

/src/services: İş mantığı ve veritabanı etkileşimi.

/src/middlewares: Güvenlik, hata yönetimi ve doğrulama katmanları.

/prisma: Veritabanı modelleri ve migration kayıtları.

/src/validators: Girdi doğrulama şemaları.
