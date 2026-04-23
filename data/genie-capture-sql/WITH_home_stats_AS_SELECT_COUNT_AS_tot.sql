WITH home_stats AS (
  SELECT 
    COUNT(*) AS total_homes,
    AVG(home_devices) AS avg_devices_per_home,
    SUM(CASE WHEN home_dcc_enabled THEN 1 ELSE 0 END) AS dcc_enabled_homes
  FROM `ac_ireland_dev`.`ddm`.`dim_homes`
  WHERE id IS NOT NULL AND home_devices IS NOT NULL
),
wifi_modes AS (
  SELECT 
    home_pwifi_mode, COUNT(*) AS count
  FROM `ac_ireland_dev`.`ddm`.`dim_homes`
  WHERE home_pwifi_mode IS NOT NULL
  GROUP BY home_pwifi_mode
),
wifi_types AS (
  SELECT 
    home_pwifi_type, COUNT(*) AS count
  FROM `ac_ireland_dev`.`ddm`.`dim_homes`
  WHERE home_pwifi_type IS NOT NULL
  GROUP BY home_pwifi_type
),
diagnostic_issues AS (
  SELECT 
    SUM(CASE WHEN diagnose_interference THEN 1 ELSE 0 END) AS interference_issues,
    SUM(CASE WHEN diagnose_bad_ap_location THEN 1 ELSE 0 END) AS coverage_issues,
    SUM(CASE WHEN diagnose_bad_radio_channel THEN 1 ELSE 0 END) AS channel_issues,
    SUM(CASE WHEN diagnose_excessive_airtime_usage THEN 1 ELSE 0 END) AS airtime_issues
  FROM `ac_ireland_dev`.`ddm`.`dim_diagnostics`
)
SELECT 
  hs.total_homes,
  hs.avg_devices_per_home,
  hs.dcc_enabled_homes,
  di.interference_issues,
  di.coverage_issues,
  di.channel_issues,
  di.airtime_issues
FROM home_stats hs
CROSS JOIN diagnostic_issues di;