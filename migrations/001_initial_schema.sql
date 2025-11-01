-- ============================================
-- 步骤 1: 表结构
-- ============================================

-- 标签表
DROP TABLE IF EXISTS prompt_tags;
CREATE TABLE prompt_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 提示词分类表
DROP TABLE IF EXISTS prompt_classes;
CREATE TABLE prompt_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 提示词表
DROP TABLE IF EXISTS prompts;
CREATE TABLE prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    author TEXT,
    class_id INTEGER,
    current_version_id INTEGER,
    media_type TEXT NOT NULL DEFAULT 'image',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES prompt_classes(id)
);

-- 提示词版本表
DROP TABLE IF EXISTS prompt_versions;
CREATE TABLE prompt_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id INTEGER NOT NULL,
    version TEXT NOT NULL,
    content TEXT,
    contentzh TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

-- 提示词标签关联表
DROP TABLE IF EXISTS prompt_tag_links;
CREATE TABLE prompt_tag_links (
    prompt_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (prompt_id, tag_id),
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES prompt_tags(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS prompt_attachments;
CREATE TABLE prompt_attachments (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   prompt_id INTEGER NOT NULL,
   file_name TEXT NOT NULL,
   original_filename TEXT NOT NULL,
   file_size INTEGER NOT NULL,
   mime_type TEXT NOT NULL,
   file_path TEXT,
   thumbnail_path TEXT,
   file_metadata TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_prompts_class ON prompts(class_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt ON prompt_tag_links(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag ON prompt_tag_links(tag_id);
