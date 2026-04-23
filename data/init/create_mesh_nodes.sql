CREATE OR REPLACE TABLE __SCHEMA_QUALIFIED__.mesh_nodes (
    node_id STRING,
    node_name STRING,
    location STRING,
    status STRING,
    band STRING,
    channel INT,
    connected_clients INT,
    signal_strength INT,
    firmware_version STRING,
    last_seen TIMESTAMP_NTZ
)
USING DELTA
TBLPROPERTIES (delta.enableChangeDataFeed = true);

INSERT INTO __SCHEMA_QUALIFIED__.mesh_nodes VALUES
('N001', 'Living Room AP',    'Living Room',    'online',      '5GHz',   36, 8,  -32, '4.2.1', CAST('2026-04-23 09:55:00' AS TIMESTAMP_NTZ)),
('N002', 'Kitchen Extender',  'Kitchen',        'online',      '2.4GHz', 6,  3,  -45, '4.2.1', CAST('2026-04-23 09:54:00' AS TIMESTAMP_NTZ)),
('N003', 'Bedroom Node',      'Master Bedroom', 'online',      '5GHz',   44, 4,  -38, '4.2.1', CAST('2026-04-23 09:55:00' AS TIMESTAMP_NTZ)),
('N004', 'Office Extender',   'Home Office',    'online',      '5GHz',   149,5,  -29, '4.2.0', CAST('2026-04-23 09:53:00' AS TIMESTAMP_NTZ)),
('N005', 'Garage Node',       'Garage',         'degraded',    '2.4GHz', 11, 1,  -68, '4.1.9', CAST('2026-04-23 09:50:00' AS TIMESTAMP_NTZ)),
('N006', 'Basement AP',       'Basement',       'offline',     '5GHz',   52, 0,  -85, '4.1.9', CAST('2026-04-23 08:30:00' AS TIMESTAMP_NTZ)),
('N007', 'Kids Room Node',    'Kids Room',      'online',      '5GHz',   36, 3,  -41, '4.2.1', CAST('2026-04-23 09:55:00' AS TIMESTAMP_NTZ)),
('N008', 'Patio Extender',    'Patio',          'online',      '2.4GHz', 1,  2,  -55, '4.2.1', CAST('2026-04-23 09:52:00' AS TIMESTAMP_NTZ));
