export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function plusDays(key, count) { const d = new Date(key+'T12:00:00'); d.setDate(d.getDate()+count); return dayKey(d); }
export function validDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s+'T12:00:00').getTime()) && dayKey(new Date(s+'T12:00:00')) === s; }
export function validateState(s) {
 if (!s || s.version!==1 || !Array.isArray(s.tasks) || s.tasks.length>100 || !Number.isInteger(s.budget) || s.budget<0 || s.budget>240 || !Number.isInteger(s.todayBudget) || s.todayBudget<0 || s.todayBudget>240 || !validDate(s.budgetDate)) throw new Error('This is not a valid Rebound backup.');
 const ids=new Set();
 for(const t of s.tasks) {
  if(!t || typeof t.id!=='string' || ids.has(t.id) || typeof t.title!=='string' || !t.title.trim() || t.title.length>120 || typeof t.subject!=='string' || t.subject.length>40 || !validDate(t.due) || !Number.isInteger(t.minutes) || t.minutes<5 || t.minutes>1200 || !Number.isInteger(t.done) || t.done<0 || t.done>t.minutes || !['normal','high'].includes(t.priority)) throw new Error('Backup contains an invalid assignment.');
  ids.add(t.id);
 }
 return {version:1,tasks:s.tasks.map(t=>({...t})),budget:s.budget,todayBudget:s.todayBudget,budgetDate:s.budgetDate,demo:s.demo===true};
}
export function makePlan(state, today=dayKey()) {
 const days=Array.from({length:7},(_,i)=>({date:plusDays(today,i),capacity:i===0 && state.budgetDate===today?state.todayBudget:state.budget,used:0,sessions:[]}));
 const risks=[];
 const tasks=state.tasks.filter(t=>t.done<t.minutes).slice().sort((a,b)=>a.due.localeCompare(b.due)||(a.priority===b.priority?0:a.priority==='high'?-1:1)||a.id.localeCompare(b.id));
 for(const t of tasks) {
  let remaining=t.minutes-t.done;
  const cutoff=t.due<today?today:t.due;
  for(const day of days) {
   if(day.date>cutoff) break;
   while(remaining>0 && day.used<day.capacity) {
    const minutes=Math.min(25,remaining,day.capacity-day.used);
    day.sessions.push({taskId:t.id,title:t.title,subject:t.subject,minutes,due:t.due,priority:t.priority});
    day.used+=minutes; remaining-=minutes;
   }
  }
  if(remaining>0 || t.due<today) risks.push({taskId:t.id,title:t.title,subject:t.subject,minutes:remaining,overdue:t.due<today,beyondHorizon:t.due>days[6].date,due:t.due});
 }
 return {days,risks,remaining:tasks.reduce((n,t)=>n+t.minutes-t.done,0),scheduled:days.reduce((n,d)=>n+d.used,0)};
}
export function demoState(today=dayKey()) { return {version:1,budget:60,todayBudget:45,budgetDate:today,demo:true,tasks:[
 {id:'demo-math',title:'Catch up on quadratic equations',subject:'Math',due:plusDays(today,1),minutes:70,done:0,priority:'high'},
 {id:'demo-bio',title:'Finish the cell division worksheet',subject:'Biology',due:today,minutes:60,done:0,priority:'normal'},
 {id:'demo-english',title:'Outline the persuasive essay',subject:'English',due:plusDays(today,3),minutes:50,done:0,priority:'normal'},
 {id:'demo-history',title:'Review notes from missed lessons',subject:'History',due:plusDays(today,5),minutes:40,done:0,priority:'normal'}]}; }
