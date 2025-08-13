-- Remove Joseph's admin role if he shouldn't be an admin
DELETE FROM admin_users 
WHERE user_id = 'e8f5649e-d28f-4728-9773-9d3d7c74aaee';