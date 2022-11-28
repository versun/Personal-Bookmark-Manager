/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - all `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - all `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	DB:D1Database;
}

const query = (db: D1Database, qName: String) => {
	switch(qName){
		case 'getById': 	return db.prepare("SELECT * FROM main WHERE oid = ?");
		case 'getByTitle':  return db.prepare("SELECT * FROM main WHERE title = ?");
		case 'getByUrl': 	return db.prepare("SELECT * FROM main WHERE url = ?");
		case 'getByPage': 	return db.prepare("SELECT * FROM main WHERE page = ?");
		case 'getByTag': 	return db.prepare("SELECT * FROM main WHERE tag LIKE ?");
		case 'getBySearch': return db.prepare("SELECT * FROM main WHERE title LIKE ?1 OR tag LIKE ?1 OR description LIKE ?1 OR note LIKE ?1");
		case 'setNew': 		return db.prepare("INSERT INTO main ('title','url','tag','page','description','note') VALUES (?1,?2,?3,?4,?5,?6)");
		case 'setUpdateTitle':  return db.prepare("UPDATE main SET title = ?1 WHERE oid = ?2");
		case 'setUpdateUrl': 	return db.prepare("UPDATE main SET url = ?1 WHERE oid = ?2");
		case 'setUpdateTag': 	return db.prepare("UPDATE main SET tag = ?1 WHERE oid = ?2");
		case 'setUpdatePage': 	return db.prepare("UPDATE main SET page = ?1 WHERE oid = ?2");
		case 'setUpdateNote': 	return db.prepare("UPDATE main SET note = ?1 WHERE oid = ?2");
		case 'setUpdateDescription': return db.prepare("UPDATE main SET description = ?1 WHERE oid = ?2");
		case 'setDelete': 		return db.prepare("DELETE FROM main WHERE oid = ?");
		default: return ; 
	}
}
const get = (pathname:string, param:string, env: Env) => {
	console.log(pathname,param);
	switch(pathname){
		case "/api/id":		return query(env.DB,'getById')?.bind(param).all();
		case "/api/title":	return query(env.DB,'getByTitle')?.bind(param).all();
		case "/api/url":	return query(env.DB,'getByUrl')?.bind(param).all();
		case "/api/page":	return query(env.DB,'getByPage')?.bind(param).all();
		case "/api/tag":	return query(env.DB,'getByTag')?.bind(`%${param}%`).all();
		case "/api/search":	return query(env.DB,'getBySearch')?.bind(`%${param}%`).all();
		default: return ;			
	}
}
const set =(pathname:string, params:URLSearchParams, env: Env) => {
	var result = '';
	const param_title = params.has('title')?String(params.get('title')):' ';
	const param_url = params.has('url')?String(params.get('url')):' ';
	const param_tag = params.has('tag')?String(params.get('tag')):' ';
	const param_page = params.has('page')?String(params.get('page')):' ';
	const param_description = params.has('description')?String(params.get('description')):' ';
	const param_note = params.has('note')?String(params.get('note')):' ';
	const param_oid = params.has('id')?String(params.get('id')):null;
	
	switch(pathname){
		case "/api/new":
			if(param_title && param_url && param_page){
				query(env.DB,'setNew')?.bind(param_title,param_url,param_tag,param_page,param_description,param_note).all();
				result = '200';
			}
			break;
		case "/api/update":
			if(param_oid){ //need check oid is in database,but security issue?
				param_title!=' ' ? query(env.DB,'setUpdateTitle')?.bind(param_title,param_oid).all(): null;
				param_url!=' ' ? query(env.DB,'setUpdateUrl')?.bind(param_url,param_oid).all(): null;
				param_page!=' ' ? query(env.DB,'setUpdatePage')?.bind(param_page,param_oid).all(): null;
				param_tag!=' ' ? query(env.DB,'setUpdateTag')?.bind(param_tag,param_oid).all(): null;
				param_description!=' ' ? query(env.DB,'setUpdateDescription')?.bind(param_description,param_oid).all(): null;
				param_note!=' ' ? query(env.DB,'setUpdateNote')?.bind(param_note,param_oid).all(): null;				
				result = '200';
			}		
			break;
		case "/api/delete":
			if(param_oid){
				query(env.DB,'setDelete')?.bind(param_oid).all();
				result = '200';
			}
			break;
		default: result = '500';
	}
	return result;
}

export default {
	
	async fetch(request: Request, env: Env) {
		const url = new URL(request.url);
		const params = url.searchParams;
		const param_q = params.has('q')?String(params.get('q')):null;
		var results:any;
		
		if(param_q){
			results = await (await get(url.pathname,param_q,env))?.results;
		}
		else{
			results = await set(url.pathname,params,env);
		}
	

		return results ? Response.json(results) : new Response("Call /api/id?q=1");
	}
  };

  /*Test
  	http://127.0.0.1:8787/api/
  	http://127.0.0.1:8787/api/new?title=Baidu&url="https://www.baidu.com"&tag="search baidu"&page=0&description="BAIDU"&note=1
	http://127.0.0.1:8787/api/new?title=google&url="https://google.com"&tag="search"&page=0&description="google"&note=22
 	http://127.0.0.1:8787/api/new?title=Yahoo&url="https://www.yahoo.com"&tag="webservice"&page=3&description="YAHOO"&note=3
  	http://127.0.0.1:8787/api/new?title=Sina&url="https://www.sina.com"&tag="webservice social"&page=4&description="SINA"&note=4
	http://127.0.0.1:8787/api/new?title=test&url="https://www.test.com"

	http://127.0.0.1:8787/api/update?id=2&title=Google&url="https://www.google.com"&tag="search google"&page=2&description="GOOGLE"
	http://127.0.0.1:8787/api/update?id=2&note=2
	http://127.0.0.1:8787/api/delete?id=5

	http://127.0.0.1:8787/api/id?q=4
	http://127.0.0.1:8787/api/title?q=Google
	http://127.0.0.1:8787/api/url?q="https://www.google.com"
	http://127.0.0.1:8787/api/page?q=2
	http://127.0.0.1:8787/api/tag?q=search
	http://127.0.0.1:8787/api/search?q=GOOGLE

	Other Test
	http://127.0.0.1:8787/api/new?q=1&title=Baidu&url="https://www.baidu.com"&tag="search baidu"&page=0&description="BAIDU"&note=1
  */