-- 📊 Audit-Logs anzeigen
SELECT 
  setting_key,
  old_value,
  new_value,
  changed_by,
  changed_at,
  ip_address,
  LEFT(user_agent, 50) as user_agent_short
FROM app_settings_audit 
ORDER BY changed_at DESC 
LIMIT 20;

-- 📈 Statistiken
SELECT 
  setting_key,
  COUNT(*) as total_changes,
  COUNT(DISTINCT ip_address) as unique_ips,
  MIN(changed_at) as first_change,
  MAX(changed_at) as last_change
FROM app_settings_audit 
GROUP BY setting_key;
