"""Create the sample business database data/sample.db."""
import sqlite3
import os
from app.database.connection import get_business_db_path


def init_sample_database():
    db_path = get_business_db_path()
    if os.path.exists(db_path):
        return

    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE products (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL
        );

        CREATE TABLE customers (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            region TEXT NOT NULL,
            email TEXT
        );

        CREATE TABLE sales (
            id INTEGER PRIMARY KEY,
            product_id INTEGER REFERENCES products(id),
            customer_id INTEGER REFERENCES customers(id),
            quantity INTEGER NOT NULL,
            amount REAL NOT NULL,
            sale_date TEXT NOT NULL
        );

        INSERT INTO products VALUES
        (1, '智能手机', '电子产品', 4999.00),
        (2, '笔记本电脑', '电子产品', 7999.00),
        (3, '平板电脑', '电子产品', 3299.00),
        (4, '运动T恤', '服装', 199.00),
        (5, '牛仔裤', '服装', 399.00),
        (6, '羽绒服', '服装', 899.00),
        (7, '有机牛奶', '食品', 35.00),
        (8, '进口咖啡', '食品', 89.00),
        (9, '坚果礼盒', '食品', 168.00),
        (10, '无线耳机', '电子产品', 1299.00);

        INSERT INTO customers VALUES
        (1, '张三', '华东', 'zhangsan@example.com'),
        (2, '李四', '华南', 'lisi@example.com'),
        (3, '王五', '华北', 'wangwu@example.com'),
        (4, '赵六', '西南', 'zhaoliu@example.com'),
        (5, '孙七', '华东', 'sunqi@example.com'),
        (6, '周八', '华南', 'zhouba@example.com'),
        (7, '吴九', '华北', 'wujiu@example.com'),
        (8, '郑十', '西南', 'zhengshi@example.com');

        INSERT INTO sales VALUES
        (1, 1, 1, 2, 9998.00, '2026-01-15'),
        (2, 2, 2, 1, 7999.00, '2026-01-20'),
        (3, 3, 3, 3, 9897.00, '2026-02-01'),
        (4, 4, 1, 5, 995.00, '2026-02-05'),
        (5, 5, 4, 2, 798.00, '2026-02-10'),
        (6, 6, 5, 1, 899.00, '2026-02-12'),
        (7, 7, 6, 10, 350.00, '2026-02-15'),
        (8, 8, 2, 4, 356.00, '2026-02-18'),
        (9, 9, 7, 3, 504.00, '2026-02-20'),
        (10, 10, 8, 2, 2598.00, '2026-02-22'),
        (11, 1, 3, 1, 4999.00, '2026-03-01'),
        (12, 2, 5, 2, 15998.00, '2026-03-02'),
        (13, 3, 4, 1, 3299.00, '2026-03-03'),
        (14, 1, 6, 3, 14997.00, '2026-03-04'),
        (15, 10, 1, 1, 1299.00, '2026-03-04');
    """)
    conn.commit()
    conn.close()
