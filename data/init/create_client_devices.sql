CREATE OR REPLACE TABLE __SCHEMA_QUALIFIED__.client_devices (
    device_id STRING,
    device_name STRING,
    device_type STRING,
    connected_node STRING,
    band STRING,
    signal_strength INT,
    ip_address STRING,
    mac_address STRING,
    status STRING,
    last_seen TIMESTAMP_NTZ
)
USING DELTA
TBLPROPERTIES (delta.enableChangeDataFeed = true);

INSERT INTO __SCHEMA_QUALIFIED__.client_devices VALUES
('D001', 'MacBook Pro',         'laptop',       'N001', '5GHz',   -35, '192.168.1.101', 'AA:BB:CC:11:22:01', 'connected',    CAST('2026-04-23 09:55:00' AS TIMESTAMP_NTZ)),
('D002', 'iPhone 15',           'phone',        'N001', '5GHz',   -42, '192.168.1.102', 'AA:BB:CC:11:22:02', 'connected',    CAST('2026-04-23 09:55:00' AS TIMESTAMP_NTZ)),
('D003', 'Samsung Smart TV',    'smart_tv',     'N003', '5GHz',   -39, '192.168.1.103', 'AA:BB:CC:11:22:03', 'connected',    CAST('2026-04-23 09:54:00' AS TIMESTAMP_NTZ)),
('D004', 'iPad Air',            'tablet',       'N002', '2.4GHz', -52, '192.168.1.104', 'AA:BB:CC:11:22:04', 'connected',    CAST('2026-04-23 09:53:00' AS TIMESTAMP_NTZ)),
('D005', 'Work Laptop',         'laptop',       'N004', '5GHz',   -30, '192.168.1.105', 'AA:BB:CC:11:22:05', 'connected',    CAST('2026-04-23 09:55:00' AS TIMESTAMP_NTZ)),
('D006', 'Ring Doorbell',       'iot',          'N008', '2.4GHz', -58, '192.168.1.106', 'AA:BB:CC:11:22:06', 'connected',    CAST('2026-04-23 09:52:00' AS TIMESTAMP_NTZ)),
('D007', 'PS5',                 'console',      'N003', '5GHz',   -37, '192.168.1.107', 'AA:BB:CC:11:22:07', 'connected',    CAST('2026-04-23 09:54:00' AS TIMESTAMP_NTZ)),
('D008', 'Smart Speaker',       'iot',          'N002', '2.4GHz', -48, '192.168.1.108', 'AA:BB:CC:11:22:08', 'connected',    CAST('2026-04-23 09:51:00' AS TIMESTAMP_NTZ)),
('D009', 'Guest Laptop',        'laptop',       'N005', '2.4GHz', -72, '192.168.1.109', 'AA:BB:CC:11:22:09', 'weak',         CAST('2026-04-23 09:45:00' AS TIMESTAMP_NTZ)),
('D010', 'Printer',             'iot',          'N006', '2.4GHz', -80, '192.168.1.110', 'AA:BB:CC:11:22:10', 'disconnected', CAST('2026-04-23 08:30:00' AS TIMESTAMP_NTZ)),
('D011', 'Nintendo Switch',     'console',      'N007', '5GHz',   -44, '192.168.1.111', 'AA:BB:CC:11:22:11', 'connected',    CAST('2026-04-23 09:50:00' AS TIMESTAMP_NTZ)),
('D012', 'Sonos Speaker',       'iot',          'N001', '5GHz',   -36, '192.168.1.112', 'AA:BB:CC:11:22:12', 'connected',    CAST('2026-04-23 09:55:00' AS TIMESTAMP_NTZ));
