# Dokümantasyon İndeksi

Bu klasör proje için yaşayan dokümantasyon merkezidir.

## Okuma Sırası

1. `reports/ITSM Analiz Dokümanı.pdf`
2. `reports/tasarım.md`
3. `architecture/mvp-traceability.md`
4. `checklist.md`

## İçerik Haritası

- `reports/`
  - Kaynak analiz ve tasarım dokümanları
  - İş kuralı kapsamı bu dosyalarla sınırlandırılır
- `architecture/`
  - Analiz/tasarım beklentilerinin kod iskeletine izlenebilir eşlemesi
- `checklist.md`
  - Sprint bazlı teslim planı
  - 100% tamamlanma hedefi ve Definition of Done maddeleri

## Doküman Yönetim Kuralları

- `reports/` altındaki dosyalar kaynak doküman kabul edilir; doğrudan değiştirilmez.
- Yeni teknik kararlar önce `architecture/` altında yazılır, sonra koda uygulanır.
- Sprint kapanışlarında `checklist.md` güncellenir.
- Her sprintte en az bir doğrulama çıktısı üretilir: test raporu, API sözleşmesi güncellemesi, demo notu.

## Terminoloji

- `MVP`: Minimum Viable Product, temel iş değerini üreten minimum sürüm.
- `Phase-2`: MVP doğrulandıktan sonra kapsam genişletme fazı.
- `DoD`: Definition of Done, sprintin tamamlanma ölçütleri.
