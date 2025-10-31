-- 先删除关联表（有外键的表）
DELETE FROM prompt_tags;
DELETE FROM prompt_versions;

-- 再删除主表
DELETE FROM prompts;
DELETE FROM prompt_classes;
DELETE FROM tags;