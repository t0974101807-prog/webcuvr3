import fs from 'fs';

let content = fs.readFileSync('src/modules/cms/cms.routes.ts', 'utf-8');

const newsSearch = `// News
router.get("/news", (req: any, res: any) => {
  try {
    const news = db.prepare(\`SELECT id, title, excerpt as description, content, date as created_at, image as file_url, category FROM news\`).all();
    res.json(news);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/news", auth, (req: any, res: any) => {
  const { title, description, content, created_at, file_url, category } = req.body;
  const date = created_at || new Date().toISOString().split('T')[0];
  try {
    db.prepare(\`INSERT INTO news (title, excerpt, content, date, image, category) VALUES (?,?,?,?,?,?)\`)
      .run(val(title), val(description), val(content), val(date), val(file_url), val(category));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/news/:id", auth, (req: any, res: any) => {
  const { title, description, content, created_at, file_url, category } = req.body;
  const date = created_at || new Date().toISOString().split('T')[0];
  try {
    db.prepare(\`UPDATE news SET title=?, excerpt=?, content=?, date=?, image=?, category=? WHERE id=?\`)
      .run(val(title), val(description), val(content), val(date), val(file_url), val(category), req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`;

const newsReplace = `// News
router.get("/news", (req: any, res: any) => {
  try {
    try { db.prepare("ALTER TABLE news ADD COLUMN related_service TEXT").run(); } catch(e) {}
    const news = db.prepare(\`SELECT id, title, excerpt as description, content, date as created_at, image as file_url, category, related_service FROM news ORDER BY date DESC\`).all();
    res.json(news);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/news", auth, (req: any, res: any) => {
  const { title, description, content, created_at, file_url, category, related_service } = req.body;
  const date = created_at || new Date().toISOString().split('T')[0];
  try {
    try { db.prepare("ALTER TABLE news ADD COLUMN related_service TEXT").run(); } catch(e) {}
    db.prepare(\`INSERT INTO news (title, excerpt, content, date, image, category, related_service) VALUES (?,?,?,?,?,?,?)\`)
      .run(val(title), val(description), val(content), val(date), val(file_url), val(category), val(related_service));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/news/:id", auth, (req: any, res: any) => {
  const { title, description, content, created_at, file_url, category, related_service } = req.body;
  const date = created_at || new Date().toISOString().split('T')[0];
  try {
    try { db.prepare("ALTER TABLE news ADD COLUMN related_service TEXT").run(); } catch(e) {}
    db.prepare(\`UPDATE news SET title=?, excerpt=?, content=?, date=?, image=?, category=?, related_service=? WHERE id=?\`)
      .run(val(title), val(description), val(content), val(date), val(file_url), val(category), val(related_service), req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`;

content = content.replace(newsSearch, newsReplace);
fs.writeFileSync('src/modules/cms/cms.routes.ts', content);

console.log('Patched cms.routes.ts');
