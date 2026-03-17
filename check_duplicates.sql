SELECT user_id, platform, count(*) 
FROM public.social_accounts 
GROUP BY user_id, platform 
HAVING count(*) > 1;
