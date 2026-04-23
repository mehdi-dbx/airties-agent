SELECT 
  (SELECT COUNT(*) FROM `ac_ireland_dev`.`ddm`.`dim_homes` WHERE `id` IS NOT NULL) AS total_homes,
  (SELECT AVG(`home_devices`) FROM `ac_ireland_dev`.`ddm`.`dim_homes` WHERE `home_devices` IS NOT NULL) AS avg_devices_per_home,
  (SELECT COUNT(*) FROM `ac_ireland_dev`.`ddm`.`dim_diagnostics` WHERE `id` IS NOT NULL) AS total_diagnostic_issues,
  (SELECT COUNT(*) FROM `ac_ireland_dev`.`ddm`.`dim_diagnostics` WHERE `diagnose_interference` = TRUE) AS interference_cases,
  (SELECT COUNT(*) FROM `ac_ireland_dev`.`ddm`.`dim_diagnostics` WHERE `diagnose_bad_ap_location` = TRUE OR `diagnose_bad_station_location` = TRUE) AS coverage_problems,
  (SELECT COUNT(*) FROM `ac_ireland_dev`.`ddm`.`dim_diagnostics` WHERE `diagnose_channel_interference` = TRUE) AS channel_interference_cases,
  (SELECT COUNT(*) FROM `ac_ireland_dev`.`ddm`.`dim_diagnostics` WHERE `diagnose_insufficient_airtime` = TRUE) AS insufficient_airtime_cases