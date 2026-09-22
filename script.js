console.log(" i love my country");
 let a=5;
 a=a+5;
 console.log(a);
 let y="i am learning javascript";
 console.log(y)
 let o={
    name:"m.ubaid",
    "job code": 890,
    "is handsome":true
 }
 console.log(o)
 o.salary=1000
 console.log(o)
 let age=90
 let grace=78
 if(age==18){
    console.log("hello ubaid")
 }
 else if(age==0){
    console.log("are you kidding")
 }
 else{
    console.log("hellow abdullah")
 }
 let a1=9
 let b1=78
//  let c=a1>b1?(a1-b1):(b1-a1)
//  console.log(c)
 if(a1>b1){
    let c=a1-b1;
    console.log(c)
 }
 else{
    let c=b1-a1;
    console.log(c)
 }
 let v={
      "total customers": 8
      }
      console.log(v)
      h=5+6;
      if(h>10){
        console.log("he is wonderful guy")
      }
      else{
        console.log("he is a bad guy");
      }
      let g=1
for(let i = 0;i<100;i++){
    console.log(g+i);
}
// let obj={
//     name: "ubaid",
//  company:"Nasa"
// }
// for (const key in obj) {
// const element =obj[key];
// console.log(key,efor
let t=9;
for (let i = 0; i <= 100; i++) {
 console.log(t+i)

}
let obj={
   "name":"ubaid-ur-rehman",
   role:"front end develper"
}
for (const key in obj) {
   // if (!Object.hasOwn(obj, key)) continue;

   const element = obj[key];
   console.log(key,element)

}
for (const c  of "ubaid-ur-rehman") {
   console.log(c)
}
let i=500;
let j;
while (i<2000) {
   console.log(i)
   i++;
}

let arr=[1,2,3,4]
console.log(arr)
console.log(arr.length)
arr[0]=566;
console.log(arr[0])
let name=["m.ubaid","jaswal","king kohli"]
for (let index = 0; index < name.length; index++) {
console.log(name[index])
   }
   for (let students of name) {
      console.log(students.toUpperCase())
   }
   let marks=[56,67,89,65,78,90]
   let sum=0;
   for (let value of marks) {
      sum+=value;
   }
   console.log(sum);
   let avg=sum/marks.length;
   console.log(avg)