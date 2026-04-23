SELECT COUNT(DISTINCT `dim_device_id`) AS offline_mesh_nodes
FROM `ac_ireland_dev`.`ddm`.`dim_device_states`
WHERE `row_valid_now` = TRUE
  AND `device_wireless_enabled` = FALSE
  AND `dim_device_id` IS NOT NULL