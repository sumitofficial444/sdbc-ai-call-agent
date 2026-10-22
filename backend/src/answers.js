import { readFileSync } from 'node:fs';
export const knowledge=JSON.parse(readFileSync(new URL('./knowledge.json',import.meta.url),'utf8'));
const matches=(q,words)=>words.some(w=>new RegExp(`(?:^|[^a-z])${w}(?:$|[^a-z])`,'iu').test(q));
export function answer(text,history=[]){
 const q=text.toLowerCase();
 const context=history.filter(m=>m.role==='user').map(m=>m.text.toLowerCase()).join(' ');
 const coding=/coding|software|cse|computer|ai\b|data science/.test(context+' '+q);
 if(/ignore|system prompt|pretend|bypass|forget|instructions/.test(q))return 'Main sirf SDBC admissions aur college information mein help kar sakti hoon.';
 if(/not interested|no thanks|stop|nahi chahiye|nhi chahiye|interest nahi|interest nhi|मत करो|नहीं चाहिए/.test(q))return 'Bilkul, aapki choice hai. Main yahin rukti hoon. Baad mein SDBC ke baare mein koi sawaal ho toh pooch sakte hain.';
 if(/fees?|फीस|scholar|budget|mehenga|महंगा|afford/.test(q))return `Budget clear hona zaroori hai. Current fees ki verified information mere paas nahi hai; admission team se ${knowledge.phone} par confirm karein. Tuition ke saath transport, accommodation aur other charges ka written breakup lena useful rahega. Aapka main concern total cost hai ya scholarship options?`;
 if(/guarantee|placement|package|job pak/.test(q))return 'Job ya placement guarantee main nahi de sakti; current verified placement figures bhi mere paas nahi hain. Official team se branch-wise recent placement data aur uska batch size maangna useful rahega. Aapke liye placements ke alawa course interest ya total cost mein se kya zyada important hai?';
 if(/eligib|योग्यता|seats?|deadline|last date|hostel|cutoff/.test(q))return `Is detail ki current verified information mere paas nahi hai. Admission team se ${knowledge.phone} par confirm karein. Main guess karke aapko galat direction nahi dena chahti. Aap kis program ke liye yeh confirm karna chahte hain?`;
 if(/why|advantage|benefit|kyu|kyon|क्यों|choose|special/.test(q))return coding?'Aapne coding mein interest bataya tha. SDBC ki website par CSE aur AI/ML jaise options, labs aur library listed hain—visit mein lab access aur project support ko verify karke dekh sakte hain ki fit banta hai ya nahi. Aap software development explore karna chahte hain ya AI/data side?':'Aapke goal ke hisaab se college ka fit dekhna chahiye. SDBC website par engineering aur management options, labs, library aur transportation listed hain. Inki practical suitability visit aur official team se verify kar sakte hain. Aapki top priority course interest, total cost ya commute hai?';
 if(/parents|family|papa|mummy|माता|पिता/.test(q))return 'Parents ke saath clear facts discuss karna useful rahega: preferred course, total cost, commute aur verified outcomes. Aap chahein toh official team se inka written breakup le kar compare kar sakte hain. Unka main concern fees hai ya career options?';
 if(/compare|comparison|other college|dusra college|दूसरे कॉलेज/.test(q))return 'Compare karna bilkul sensible hai. Dono colleges ke course fit, total cost, commute, lab access aur verifiable outcomes ko ek hi checklist par dekhiye. Main doosre college ke facts assume nahi karungi. Aap kis factor par comparison chahte hain?';
 if(/need time|soch|think|later|baad mein|बाद में/.test(q))return 'Bilkul, aaram se decide kijiye. Course fit, total cost aur campus suitability confirm karke decision lena better rahega. Jab ready hon tab official team se baat kar sakte hain.';
 if(/ready|apply|admission lena|admission chahiye|admission kar|interested|visit|callback|call back/.test(q))return `Achha, next step mein preferred branch, fees aur eligibility official team se confirm karna useful rahega. Unka number ${knowledge.phone} hai. Neeche demo enquiry form bhi hai, lekin woh college ko notify ya callback/visit book nahi karta. Aapko official contact chahiye ya pehle course shortlist karne mein help?`;
 if(/coding|software|computer|artificial|data science/.test(q))return 'Coding mein interest hai toh website par listed CSE, AI/ML aur Data Science options explore kar sakte hain; exact institute/branch availability confirm karni hogi. Yeh interest-based guidance hai, eligibility ya job guarantee nahi. Aap software banana pasand karte hain ya data aur AI explore karna?';
 if(matches(q,['course','courses','branch','branches','btech','b.tech','mba','bba','m.tech','mtech','cse','engineering'])||/कोर्स|पाठ्यक्रम/.test(q))return 'Website par B.Tech engineering, M.Tech, BBA aur MBA programs listed hain. B.Tech mein CSE, IT, ECE, Mechanical, Civil aur AI/ML, Data Science, Cyber Security options listed hain. Specific institute aur branch availability admission team se confirm karein.';
 if(/address|location|where|located|पता|कहाँ|kaha/.test(q))return `Campus address: ${knowledge.address}.`;
 if(/contact|phone|number|callback|counsell|संपर्क|admission|admiss|प्रवेश/.test(q))return `Admission enquiry ke liye official website ka number ${knowledge.phone} hai. Current process admission team se confirm karein. Neeche form se enquiry sirf is demo mein save hoti hai, college ko bheji nahi jaati.`;
 if(/facilit|library|transport|bus|labs?|sports|canteen|सुविधा/.test(q))return 'Website par library, labs, sports, transportation aur canteen facilities listed hain. Routes, timings aur charges admission team se confirm karein.';
 if(/12th|12th|बारहवीं|graduat|diploma/.test(q))return 'Samajh gayi. Course shortlist karne se pehle aapka interest samajhna useful hoga. Aapko technology aur coding zyada pasand hai, ya business aur management?';
 if(matches(q,['hello','namaste','hi','hey','college','sdbc','bgi','about'])||/नमस्ते/.test(q))return 'Namaste! Main Aditi, SDBC admissions ki AI demo counsellor hoon. Aapko sahi course aur agla step samajhne mein help karungi. Aap abhi 12th mein hain ya graduation complete kar chuke hain?';
 return 'Main SDBC college, courses aur admission guidance tak limited hoon. Courses ya campus ke baare mein poochiye; unverified details ke liye admission team se confirm karein.';
}
export function validateLead(body){
 if(!body||typeof body!=='object')return null;
 const {name,phone,course,consent}=body;
 if(typeof name!=='string'||!name.trim()||name.trim().length>100||typeof phone!=='string'||! /^[6-9][0-9]{9}$/.test(phone)||!knowledge.courses.includes(course)||consent!==true)return null;
 return {name:name.trim(),phone,course,consent:true};
}
