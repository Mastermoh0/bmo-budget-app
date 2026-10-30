import 'dotenv/config'
import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { randomUUID, randomInt } from 'node:crypto'
import { prisma } from '../lib/db'

const origin = process.env.BETTER_AUTH_URL!
assert.equal(process.env.BIMO_DATABASE_TARGET, 'bimo_modern_test')
class Browser {
  cookie = ''; ip = `198.${randomInt(18,20)}.${randomInt(256)}.${randomInt(1,255)}`
  async call(path: string, body?: unknown, host = origin, headers: Record<string,string> = {}) {
    const response = await fetch(new URL(path, host), { method: body === undefined ? 'GET' : 'POST', headers: { Origin: host, Cookie: this.cookie, 'Content-Type':'application/json', 'x-forwarded-for':this.ip, 'x-vercel-forwarded-for':this.ip, ...headers }, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' })
    if (response.headers.getSetCookie().length) this.cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ')
    return response
  }
}
async function result(response: Response, expected = 200) { const data = await response.json(); assert.equal(response.status, expected, JSON.stringify(data)); return data }
async function identity() {
  const browser = new Browser(), email = `tutorial-${randomUUID()}@example.invalid`, password = 'Local tutorial test passphrase!'
  await result(await browser.call('/api/auth/sign-up/email', { name:'Tutorial fixture', email, password }))
  const user = await prisma.user.update({ where:{email},data:{emailVerified:true} })
  await result(await browser.call('/api/auth/sign-in/email',{email,password}))
  return {browser,user}
}
async function control(userId: string, browser: Browser, action: string) {
  const progress = await prisma.tutorialProgress.findUnique({where:{userId}})
  return result(await browser.call('/api/tutorial',{action,requestId:randomUUID(),version:progress?.version??0}))
}
after(()=>prisma.$disconnect())

test('guided practice is private, uses exact money operations, resumes, completes and cannot leak into real budgets', async()=>{
  const {user,browser}=await identity(), stranger=await identity()
  const firstHome = await browser.call('/')
  const firstHomeHtml = await firstHome.text()
  assert.ok(firstHome.headers.get('location') === '/learn' || firstHomeHtml.includes('NEXT_REDIRECT;replace;/learn;307;'), 'First use must redirect to learning, not merely contain its navigation link')
  const real=await result(await browser.call('/api/budgets',{requestId:randomUUID(),name:'Real tutorial isolation fixture',currency:'NGN',timezone:'Africa/Lagos'}),201)
  const start={action:'start',requestId:randomUUID(),version:0}
  const [one,two]=await Promise.all([browser.call('/api/tutorial',start),browser.call('/api/tutorial',start,process.env.TEST_SECOND_ORIGIN)])
  await result(one);await result(two)
  let p=await prisma.tutorialProgress.findUniqueOrThrow({where:{userId:user.id}}),id=p.practiceBudgetId!
  assert.equal(await prisma.budget.count({where:{ownerUserId:user.id,isPractice:true}}),1)
  const initialHome=await (await browser.call('/')).text();assert.ok(!initialHome.includes(`href="/budgets/${id}"`))
  const endpoint=`/api/budgets/${id}`,date=p.practiceDate!.toISOString().slice(0,10),month=date.slice(0,7)
  const read=()=>browser.call(`${endpoint}/money?month=${month}`).then(r=>result(r))
  const money=(body:object,status=200)=>browser.call(`${endpoint}/money`,{requestId:randomUUID(),...body}).then(r=>result(r,status))
  for(const suffix of ['/money','/portable','/export','/sharing'])assert.equal((await stranger.browser.call(endpoint+suffix)).status,404)
  for(const suffix of ['/portable','/export','/sharing'])await result(await browser.call(endpoint+suffix),403)
  await result(await browser.call(endpoint+'/sharing',{requestId:randomUUID(),revision:0,action:'invite',email:'not-sent@example.invalid',role:'VIEWER'}),403)
  await control(user.id,browser,'skip');await money({action:'account',name:'Practice wallet',kind:'BANK',amount:'100000.00',date},409)
  await control(user.id,browser,'resume')
  await money({action:'account',name:'Practice wallet',kind:'BANK',amount:'999.00',date},400)
  assert.equal((await read()).totalBalance,'0.00')
  const accountBody={requestId:randomUUID(),action:'account',name:'Practice wallet',kind:'BANK',amount:'100000.00',date}
  const [a,b]=await Promise.all([browser.call(endpoint+'/money',accountBody),browser.call(endpoint+'/money',accountBody,process.env.TEST_SECOND_ORIGIN)])
  const account=await result(a);await result(b)
  assert.equal((await read()).accounts.length,1)
  let data=await read();const food=data.categories.find((r:{name:string})=>r.name==='Food'),transport=data.categories.find((r:{name:string})=>r.name==='Transport')
  await money({action:'category',name:'Not a mission'},400)
  await money({action:'assign',categoryId:food.id,amount:'20000.00',month,revision:data.budget.revision})
  assert.equal((await prisma.tutorialProgress.findUniqueOrThrow({where:{userId:user.id}})).lesson,2)
  data=await read();await money({action:'assign',categoryId:transport.id,amount:'10000.00',month,revision:data.budget.revision})
  await money({action:'post',kind:'EXPENSE',accountId:account.id,categoryId:food.id,amount:'2000.00',date})
  data=await read();assert.equal(data.totalBalance,'98000.00');assert.equal(data.categories.find((r:{id:string})=>r.id===food.id).available,'18000.00')
  await money({action:'move',categoryId:transport.id,toCategoryId:food.id,amount:'5000.00',month,revision:data.budget.revision})
  p=await prisma.tutorialProgress.findUniqueOrThrow({where:{userId:user.id}});assert.equal(p.lesson,5);assert.ok(p.firstActionAt);assert.ok(p.completedAt)
  data=await read();assert.equal(data.readyToAssign,'70000.00');assert.equal(data.categories.find((r:{id:string})=>r.id===food.id).available,'23000.00')
  await control(user.id,browser,'challenge')
  await money({action:'post',kind:'EXPENSE',accountId:account.id,categoryId:food.id,amount:'26000.00',date})
  data=await read();assert.equal(data.categories.find((r:{id:string})=>r.id===food.id).available,'-3000.00')
  await money({action:'move',categoryId:transport.id,toCategoryId:food.id,amount:'3000.00',month,revision:data.budget.revision})
  data=await read();assert.equal(data.totalBalance,'72000.00');assert.equal(data.categories.find((r:{id:string})=>r.id===food.id).available,'0.00')
  assert.equal(data.categories.find((r:{id:string})=>r.id===transport.id).available,'2000.00')
  await control(user.id,browser,'finish')
  assert.equal(await prisma.budget.count({where:{id}}),0);assert.equal(await prisma.moneyEntry.count({where:{budgetId:id}}),0)
  assert.equal(await prisma.budget.count({where:{id:real.id,isPractice:false}}),1)
  assert.equal(await prisma.moneyOperation.count({where:{budgetId:real.id}}),0)
  assert.equal((await prisma.tutorialProgress.findUniqueOrThrow({where:{userId:user.id}})).status,'COMPLETED')
  await control(user.id,browser,'start');p=await prisma.tutorialProgress.findUniqueOrThrow({where:{userId:user.id}})
  assert.notEqual(p.practiceBudgetId,id);assert.equal(p.lesson,1);assert.ok(p.completedAt)
})

test('tutorial control versions prevent stale resets; cleanup cannot delete a real budget; users have independent progress',async()=>{
  const {user,browser}=await identity(),other=await identity()
  await result(await browser.call('/api/tutorial',{action:'start',requestId:randomUUID(),version:0},origin,{Origin:'https://untrusted.example'}),403)
  await result(await browser.call('/api/tutorial',{action:'finish',requestId:randomUUID(),version:0}),409)
  await control(user.id,browser,'start')
  let p=await prisma.tutorialProgress.findUniqueOrThrow({where:{userId:user.id}}),old=p.practiceBudgetId
  await result(await browser.call('/api/tutorial',{action:'restart',requestId:randomUUID(),version:0}),409)
  const restart={action:'restart',requestId:randomUUID(),version:p.version}
  await result(await browser.call('/api/tutorial',restart));await result(await browser.call('/api/tutorial',restart))
  p=await prisma.tutorialProgress.findUniqueOrThrow({where:{userId:user.id}});assert.notEqual(p.practiceBudgetId,old)
  assert.equal(await prisma.budget.count({where:{id:old!}}),0)
  assert.equal(await prisma.tutorialProgress.count({where:{userId:other.user.id}}),0)
  const real=await result(await browser.call('/api/budgets',{requestId:randomUUID(),name:'Cleanup guard fixture',currency:'NGN',timezone:'Africa/Lagos'}),201)
  const practiceId=p.practiceBudgetId!
  await prisma.tutorialProgress.update({where:{userId:user.id},data:{practiceBudgetId:real.id}})
  await result(await browser.call('/api/tutorial',{action:'restart',requestId:randomUUID(),version:p.version}),409)
  assert.equal(await prisma.budget.count({where:{id:real.id,isPractice:false}}),1)
  await prisma.tutorialProgress.update({where:{userId:user.id},data:{practiceBudgetId:practiceId}})
  const readOnly=await identity()
  await prisma.budgetMember.create({data:{budgetId:real.id,userId:readOnly.user.id,role:'VIEWER'}})
  await control(readOnly.user.id,readOnly.browser,'start')
  const viewerPractice=await prisma.tutorialProgress.findUniqueOrThrow({where:{userId:readOnly.user.id}})
  assert.notEqual(viewerPractice.practiceBudgetId,practiceId)
  assert.equal((await result(await readOnly.browser.call(`/api/budgets/${viewerPractice.practiceBudgetId}/money`))).budget.role,'OWNER')
  await result(await readOnly.browser.call(`/api/budgets/${real.id}/money`,{requestId:randomUUID(),action:'category',name:'Denied'}),403)
})
