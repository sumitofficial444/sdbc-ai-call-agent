import test from 'node:test';
import assert from 'node:assert/strict';
import {answer} from '../src/answers.js';

test('value explanation follows previously expressed interests',()=>{
 const history=[{role:'user',text:'Mujhe coding pasand hai'}];
 assert.match(answer('SDBC kyun choose karun?',history),/Aapne coding mein interest/);
 assert.doesNotMatch(answer('SDBC kyun choose karun?'),/Aapne coding/);
});
test('budget objection gets useful guidance without invented prices',()=>{
 const reply=answer('Fees ka budget concern hai');
 assert.match(reply,/written breakup/);
 assert.match(reply,/main concern/);
 assert.doesNotMatch(reply,/₹|guaranteed|discount/i);
});
test('refusal and time requests stop the pitch even when course is mentioned',()=>{
 assert.match(answer('CSE admission nahi chahiye'),/yahin rukti/);
 assert.doesNotMatch(answer('No thanks, not interested in admission'),/form|number|call|visit/i);
 assert.match(answer('Mujhe sochne ke liye time chahiye'),/aaram se decide/);
});
test('placement doubts and readiness receive distinct honest next steps',()=>{
 assert.match(answer('Placement guarantee hai?'),/guarantee main nahi de sakti/);
 assert.match(answer('Admission lena hai'),/book nahi karta/);
 assert.match(answer('Parents ko convince karna hai'),/written breakup/);
});
