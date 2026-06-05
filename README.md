# NEOMAP

Үл хөдлөх хөрөнгийн ухаалаг хайлт — Улаанбаатарын орон сууц, төсөл, түрээсийг газрын зураг, AI зөвлөмж, баталгаатай мэдээллээр хайх прототип.

## Хөгжүүлэлт

Локал серверээр ажиллуулах:

```bash
npm run dev
# эсвэл
python3 -m http.server 8000
```

Дараа нь хөтөчөөр `http://localhost:8000` руу нэвтэрнэ.

## Folder бүтэц

```
.
├── index.html              # Үндсэн entry (single-page app shell)
├── pages/
│   └── process.html        # Process documentation
├── src/
│   └── js/                 # Application модулиуд
│       ├── app.js          # Router, state, auth, AI search bootstrap
│       ├── data.js         # Mock data: listings, agents, districts
│       ├── screens.js      # Бүх screen болон UI builder-ууд
│       ├── features.js     # Lightbox, compare, reviews, map
│       └── interests.js    # Interests wizard + matching
├── public/
│   └── images/
│       ├── hero-bg.png
│       ├── og-1200x630.png
│       └── logo/
│           ├── horizontal-light.png
│           ├── horizontal-dark.png
│           ├── mark.png
│           ├── mark-dark.jpg
│           └── neomap.svg
├── docs/                   # Дизайн / prompt баримтууд
└── archive/                # Хуучин prototypes (deploy-д орохгүй)
```

## Deployment

Vercel дээр host хийгддэг (`vercel.json` тохиргоо). `main` branch-д push хийхэд автомат deploy явна.
