CREATE OR REPLACE TABLE __SCHEMA_QUALIFIED__.wifi_events (
    event_id STRING,
    device_id STRING,
    node_id STRING,
    event_type STRING,
    severity STRING,
    description STRING,
    event_timestamp TIMESTAMP_NTZ
)
USING DELTA
TBLPROPERTIES (delta.enableChangeDataFeed = true);

INSERT INTO __SCHEMA_QUALIFIED__.wifi_events VALUES
('E001', 'D009', 'N005', 'disconnect',   'high',   'Client lost connection — signal below threshold',          CAST('2026-04-23 09:10:00' AS TIMESTAMP_NTZ)),
('E002', 'D009', 'N005', 'interference', 'medium', 'Co-channel interference detected on channel 11',           CAST('2026-04-23 09:12:00' AS TIMESTAMP_NTZ)),
('E003', 'D009', 'N005', 'roaming',      'low',    'Client attempted roam to N002 — failed, returned to N005', CAST('2026-04-23 09:15:00' AS TIMESTAMP_NTZ)),
('E004', 'D010', 'N006', 'disconnect',   'high',   'Node offline — all clients disconnected',                  CAST('2026-04-23 08:30:00' AS TIMESTAMP_NTZ)),
('E005', 'D002', 'N001', 'band_switch',  'low',    'Client moved from 2.4GHz to 5GHz via band steering',       CAST('2026-04-23 09:20:00' AS TIMESTAMP_NTZ)),
('E006', 'D004', 'N002', 'roaming',      'low',    'Client roamed from N001 to N002 successfully',             CAST('2026-04-23 09:25:00' AS TIMESTAMP_NTZ)),
('E007', 'D003', 'N003', 'interference', 'medium', 'DFS radar detected — channel switch from 52 to 44',        CAST('2026-04-23 09:30:00' AS TIMESTAMP_NTZ)),
('E008', 'D007', 'N003', 'band_switch',  'low',    'Client moved from 2.4GHz to 5GHz',                         CAST('2026-04-23 09:32:00' AS TIMESTAMP_NTZ)),
('E009', 'D006', 'N008', 'disconnect',   'medium', 'Brief disconnect — reconnected after 5s',                  CAST('2026-04-23 09:40:00' AS TIMESTAMP_NTZ)),
('E010', 'D006', 'N008', 'resolved',     'low',    'Connection restored — stable',                             CAST('2026-04-23 09:40:05' AS TIMESTAMP_NTZ)),
('E011', 'D001', 'N001', 'roaming',      'low',    'Client roamed from N004 to N001 successfully',             CAST('2026-04-23 09:45:00' AS TIMESTAMP_NTZ)),
('E012', 'D005', 'N004', 'interference', 'low',    'Minor adjacent-channel interference on channel 149',       CAST('2026-04-23 09:48:00' AS TIMESTAMP_NTZ));
