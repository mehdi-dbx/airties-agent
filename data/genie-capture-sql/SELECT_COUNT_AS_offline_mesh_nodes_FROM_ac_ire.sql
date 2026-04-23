SELECT COUNT(*) AS offline_mesh_nodes
FROM `ac_ireland_dev`.`ddm`.`dim_device_states`
WHERE `row_valid_now` = TRUE
  AND `device_is_gateway` = FALSE
  AND `device_wireless_enabled` = FALSE