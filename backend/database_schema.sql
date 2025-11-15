-- 留言管理系统数据库设计
-- MySQL 8.0+ 兼容

CREATE DATABASE IF NOT EXISTS message_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE message_system;

-- 留言表
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('read', 'unread') DEFAULT 'unread',
    INDEX idx_email (email),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status),
    FULLTEXT idx_message (message)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户统计视图
CREATE VIEW user_statistics AS
SELECT 
    COUNT(DISTINCT email) as total_users,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_messages,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as week_messages
FROM messages;

-- 初始测试数据
INSERT INTO messages (email, message, status) VALUES
('zhang.wei@email.com', '您好，我对贵公司的产品很感兴趣，想了解更多详细信息。', 'read'),
('li.ming@company.com', '技术支持团队非常专业，问题得到了快速解决，感谢！', 'read'),
('wang.fang@tech.com', '建议增加更多个性化设置选项，提升用户体验。', 'unread'),
('chen.gang@business.com', '网站加载速度有些慢，希望能优化一下性能。', 'read'),
('liu.ying@service.com', '客服人员态度很好，耐心解答了我的所有疑问。', 'unread'),
('yang.tao@digital.com', '希望能提供更多支付方式，方便不同用户的需求。', 'read'),
('zhao.jun@network.com', '产品界面设计很漂亮，操作也很直观，很满意。', 'read'),
('sun.li@system.com', '遇到了一些技术问题，希望能得到及时的技术支持。', 'unread'),
('zhou.ping@software.com', '价格比较合理，性价比很高，会推荐给朋友使用。', 'read'),
('wu.qiang@internet.com', '希望能增加移动端的功能，方便手机端操作。', 'unread');

-- 批量测试数据（包含不同的创建时间和重复的邮箱地址）
INSERT INTO messages (email, message, status, created_at) VALUES
('zhang.wei@email.com', '这是同一用户的另一条留言，用于测试重复邮箱的情况。', 'unread', '2025-09-15 10:30:15'),
('test.user@example.com', '这是一个全新的用户，用于测试系统对新用户的处理能力。', 'read', '2025-09-20 14:22:40'),
('li.ming@company.com', '作为老用户，我想再次表达对贵公司服务的满意。', 'read', '2025-09-25 09:15:30'),
('demo@testing.com', '这是用于压力测试的模拟留言，包含大量技术术语。', 'unread', '2025-09-30 16:45:22'),
('wang.fang@tech.com', '关于之前提到的个性化设置，我想补充一些具体建议。', 'unread', '2025-10-05 11:20:10'),
('test.user@example.com', '同一位用户的第二次留言，测试系统对同一用户多条留言的处理。', 'read', '2025-10-10 13:35:50'),
('performance@test.org', '系统在高峰期的表现如何？希望能有详细的数据报告。', 'unread', '2025-10-15 08:55:33'),
('chen.gang@business.com', '关于网站性能问题，我已经观察到一段时间了。', 'read', '2025-10-20 15:40:18'),
('security@check.net', '系统安全性如何？是否有定期的安全审计？', 'unread', '2025-10-25 12:10:45'),
('liu.ying@service.com', '感谢之前的耐心解答，现在我有一个新问题需要咨询。', 'read', '2025-10-30 17:25:20'),
('feedback@user.io', '产品整体不错，但在细节上还有改进空间。', 'unread', '2025-11-02 09:30:15'),
('yang.tao@digital.com', '支付方式确实需要多样化，特别是对国际用户。', 'read', '2025-11-05 14:15:40'),
('support@help.com', '技术支持响应时间是否可以进一步缩短？', 'unread', '2025-11-08 10:45:30'),
('zhao.jun@network.com', '界面设计很棒，但希望能增加深色模式。', 'read', '2025-11-10 16:20:10'),
('mobile@user.app', '移动端功能确实很重要，期待早日上线。', 'unread', '2025-11-12 11:10:25'),
('repeat@email.com', '这是重复邮箱测试的第一条留言。', 'read', '2025-09-18 13:30:40'),
('repeat@email.com', '这是重复邮箱测试的第二条留言。', 'unread', '2025-10-03 15:45:15'),
('repeat@email.com', '这是重复邮箱测试的第三条留言。', 'read', '2025-10-28 09:20:30'),
('old.user@archive.com', '这是较早时间的留言，用于测试历史数据处理。', 'read', '2025-09-16 08:15:22'),
('new.user@fresh.com', '这是最近的留言，测试系统对新数据的处理能力。', 'unread', '2025-11-14 12:05:45');

-- 创建只读用户（用于API访问）
CREATE USER IF NOT EXISTS 'message_api'@'%' IDENTIFIED BY 'your_secure_password_here';
GRANT SELECT, INSERT, UPDATE ON message_system.* TO 'message_api'@'%';
FLUSH PRIVILEGES;