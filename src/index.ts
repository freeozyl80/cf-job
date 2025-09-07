/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		switch (url.pathname) {
			case '/message':
				return new Response('Hello, World!');
			case '/random':
				return new Response(crypto.randomUUID());
			case '/add/mission':
				if (request.method !== 'POST') {
					return new Response('Method not allowed', { status: 405 });
				}
				
				try {
					const formData = await request.formData();
					const name = formData.get('name');
					
					if (!name || typeof name !== 'string') {
						return new Response('Name parameter is required', { status: 400 });
					}
					
					// Get current timestamp
					const time = Math.floor(Date.now() / 1000);
					
					// Insert into database using the correct table name
					const result = await env.ZYL_SQL.prepare(
						'INSERT INTO daily_misson (name, time) VALUES (?, ?)'
					).bind(name, time).run();
					
					return new Response(JSON.stringify({
						success: true,
						id: result.meta.last_row_id,
						name: name,
						time: time
					}), {
						headers: { 'Content-Type': 'application/json' }
					});
				} catch (error) {
					console.error('Error adding mission:', error);
					return new Response('Internal server error', { status: 500 });
				}
			case '/list/mission':
				if (request.method !== 'GET') {
					return new Response('Method not allowed', { status: 405 });
				}
				
				try {
					// Query all missions from database, ordered by time descending (newest first)
					const result = await env.ZYL_SQL.prepare(
						'SELECT id, name, time FROM daily_misson ORDER BY time DESC'
					).all();
					
					return new Response(JSON.stringify({
						success: true,
						tasks: result.results || []
					}), {
						headers: { 'Content-Type': 'application/json' }
					});
				} catch (error) {
					console.error('Error fetching missions:', error);
					return new Response('Internal server error', { status: 500 });
				}
			default:
				return new Response('Not Found', { status: 404 });
		}
	},

	// Cron event handler - 每天 17:00-23:00 每半小时执行
	async scheduled(event, env, ctx): Promise<void> {
		try {
			console.log('Cron job triggered at:', new Date().toISOString());
			
			// 获取当前时间戳
			const time = Math.floor(Date.now() / 1000);
			
			// 添加"伸个懒腰"任务到数据库
			const result = await env.ZYL_SQL.prepare(
				'INSERT INTO daily_misson (name, time) VALUES (?, ?)'
			).bind('伸个懒腰', time).run();
			
			console.log('Stretch reminder added successfully:', {
				id: result.meta.last_row_id,
				time: time,
				timestamp: new Date().toISOString()
			});
			
		} catch (error) {
			console.error('Error in cron job:', error);
		}
	},
} satisfies ExportedHandler<Env>;
