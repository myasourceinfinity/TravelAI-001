
-- Verify agent seed
SELECT p.package_name, p.destination_name, COUNT(c.id) AS components
FROM agent_packages p
LEFT JOIN agent_package_components c ON c.package_id = p.id
GROUP BY p.id, p.package_name, p.destination_name
ORDER BY p.created_at;