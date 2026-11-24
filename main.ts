import{readdirSync as D,readFileSync as R,mkdirSync as M,writeFileSync as W}from"node:fs";
import{join as J}from"node:path";
let I=process.env.MAKEFUN_INPUT_DIR||"/input",O=process.env.MAKEFUN_OUTPUT_DIR||"/output";
function V(p,n){
let s=new Int32Array(256),m=new Int32Array(256),c=new Int32Array(64),o=[],S=0,C=0,pc=0,ip=0,t=0,a,b;
let P=()=>{if(!S)throw 2;return s[--S]},Q=v=>{if(S>255)throw 3;s[S++]=v},F=e=>[Buffer.from(o),e];
try{
for(;;){
if(t>999999)throw 10;
if(pc<0||pc>=p.length)throw 9;
let op=p[pc],im=op==1?1:op==2?4:op>47&&op<52?2:0;
if(!(op<8||op>15&&op<31||op>31&&op<35||op>47&&op<53||op>63&&op<66||op>79&&op<84))throw 5;
if(pc+1+im>p.length)throw 9;
t++;
let nx=pc+1+im,
g=im==1?p[pc+1]<<24>>24:im==4?p[pc+1]|p[pc+2]<<8|p[pc+3]<<16|p[pc+4]<<24:im==2?(p[pc+1]|p[pc+2]<<8)<<16>>16:0;
pc=nx;
if(!op)return F(0);
if(op==1||op==2)Q(g);
else if(op==3)P();
else if(op==4){a=P();Q(a);Q(a)}
else if(op==5){b=P();a=P();Q(b);Q(a)}
else if(op==6){b=P();a=P();Q(a);Q(b);Q(a)}
else if(op==7){let z=P();b=P();a=P();Q(b);Q(z);Q(a)}
else if(op==23){a=P();Q(-a)}
else if(op==27){a=P();Q(~a)}
else if(op>15&&op<31||op>31&&op<35){
b=P();a=P();
if(op>18&&op<23&&!b)throw 4;
let u=a>>>0,v=b>>>0;
Q(op>31?((op==32?a==b:op==33?a<b:u<v)?1:0):op==16?a+b:op==17?a-b:op==18?Math.imul(a,b):op==19?(a-a%b)/b:op==20?a%b:op==21?(u-u%v)/v:op==22?u%v:op==24?a&b:op==25?a|b:op==26?a^b:op==28?a<<b:op==29?a>>b:a>>>b);
}
else if(op==48)pc=nx+g;
else if(op==49||op==50){a=P();if(op==49?!a:a)pc=nx+g}
else if(op==51){if(C>63)throw 7;c[C++]=nx;pc=g&65535}
else if(op==52){if(!C)throw 8;pc=c[--C]}
else if(op==64){a=P();if(a<0||a>255)throw 6;Q(m[a])}
else if(op==65){b=P();a=P();if(b<0||b>255)throw 6;m[b]=a}
else if(op==80){a=P();let w=""+a;if(o.length+w.length>65536)throw 11;for(let h of w)o.push(h.charCodeAt())}
else if(op==81){a=P();if(o.length>65535)throw 11;o.push(a&255)}
else if(op==82)Q(ip<n.length?n[ip++]:-1);
else if(op==83)return F(P()&255);
}
}catch(e){if(typeof e!="number")throw e;return F(e)}
}
for(let id of D(I).sort()){
try{
let dir=J(I,id),p=R(J(dir,"program.bin")),n;
try{n=R(J(dir,"input.bin"))}catch{n=Buffer.alloc(0)}
let[o,e]=V(p,n),d=J(O,id);
M(d,{recursive:true});W(J(d,"stdout.bin"),o);W(J(d,"exit.txt"),e+"\n");
}catch{}
}
