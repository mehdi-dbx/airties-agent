SELECT COUNT(DISTINCT d.id) AS offline_mesh_nodes
FROM `ac_ireland_dev`.`ddm`.`dim_devices` d
JOIN `ac_ireland_dev`.`ddm`.`dim_device_states` ds ON d.id = ds.dim_device_id
WHERE ds.row_valid_now = true
  AND ds.device_wireless_enabled = false