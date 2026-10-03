const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
Deno.serve(async request => {
  const reply=(status:number,data:object)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(request.method!=='POST')return reply(405,{error:'POST required'});
  const authorization=request.headers.get('Authorization');
  if(!authorization?.startsWith('Bearer '))return reply(401,{error:'Sign in required'});
  const url=Deno.env.get('SUPABASE_URL')!;
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  // Verify the caller with Auth; never trust an ID supplied by the client.
  const verified=await fetch(url+'/auth/v1/user',{headers:{Authorization:authorization,apikey:serviceKey}});
  if(!verified.ok)return reply(401,{error:'Session expired; sign in again'});
  const user=await verified.json();
  let body;try{body=await request.json();}catch{return reply(400,{error:'Invalid request'});}
  if(body.confirmation!=='DELETE')return reply(400,{error:'Deletion confirmation required'});
  const result=await fetch(url+'/auth/v1/admin/users/'+encodeURIComponent(user.id),{method:'DELETE',headers:{Authorization:'Bearer '+serviceKey,apikey:serviceKey}});
  if(!result.ok)return reply(409,{error:'Account deletion failed. Contact support if you own stored files.'});
  return reply(200,{deleted:true});
});
