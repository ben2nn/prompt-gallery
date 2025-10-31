-- 插入标签数据
INSERT INTO tags (name, color) VALUES 
  ('AI绘画', '#FF6B6B'),
  ('摄影', '#4ECDC4'),
  ('风景', '#45B7D1'),
  ('人物', '#FFA07A'),
  ('抽象', '#98D8C8');

-- 插入提示词分类数据
INSERT INTO prompt_classes (name, description) VALUES 
  ('Midjourney', 'Midjourney AI 绘画提示词'),
  ('Stable Diffusion', 'Stable Diffusion 提示词'),
  ('DALL-E', 'DALL-E 提示词');

-- 插入提示词数据
INSERT INTO prompts (name, description, author, media_type, prompt_class_id, attachment_url, thumbnail_url) VALUES 
  ('赛博朋克城市夜景', '未来主义风格的城市夜景，霓虹灯光效果', 'TestUser1', 'image', 1, '/attachments/sample1.jpg', '/thumbnails/sample1_thumb.jpg'),
  ('梦幻森林', '充满魔法气息的梦幻森林场景', 'TestUser2', 'image', 1, '/attachments/sample2.jpg', '/thumbnails/sample2_thumb.jpg'),
  ('肖像摄影', '专业人物肖像摄影提示词', 'TestUser3', 'image', 2, '/attachments/sample3.jpg', '/thumbnails/sample3_thumb.jpg');

-- 插入提示词版本数据
INSERT INTO prompt_versions (prompt_id, version, content, contentzh) VALUES 
  (1, '1.0', 'cyberpunk city at night, neon lights, futuristic, highly detailed', '赛博朋克城市夜景，霓虹灯，未来主义，高度细节'),
  (2, '1.0', 'magical forest, dreamy atmosphere, soft lighting, fantasy', '魔法森林，梦幻氛围，柔和光线，奇幻'),
  (2, '2.0', 'enchanted forest, mystical fog, glowing plants, ethereal', '魔法森林，神秘雾气，发光植物，空灵'),
  (3, '1.0', 'professional portrait photography, studio lighting, 85mm lens', '专业肖像摄影，影棚灯光，85mm镜头');

-- 插入提示词标签关联数据
INSERT INTO prompt_tags (prompt_id, tag_id) VALUES 
  (1, 1), (1, 3),
  (2, 3), (2, 5),
  (3, 2), (3, 4);
