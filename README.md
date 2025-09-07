- 查看数据库配置：

 npx wrangler d1 list（env.ZYL_SQL ZYL_SQL）
 
- 带有任务的启动 

 npx wrangler dev --test-scheduled
 "http://localhost:8787/__scheduled?cron=0,30+*+*+*+*"