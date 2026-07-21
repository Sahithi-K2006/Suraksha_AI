CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT CHECK(type IN ('scam_message','counterfeit_currency','qr_link')) NOT NULL,
  input_summary TEXT,
  verdict TEXT CHECK(verdict IN ('safe','suspicious','high_risk')) NOT NULL,
  risk_score INTEGER NOT NULL,
  explanation TEXT,
  latitude REAL,
  longitude REAL,
  region TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  role TEXT CHECK(role IN ('user','assistant')) NOT NULL,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(type);
CREATE INDEX IF NOT EXISTS idx_cases_verdict ON cases(verdict);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
