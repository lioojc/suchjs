import Mockit,{ModifierFn,RuleFn} from './namespace';
import {NormalObject,suchRule} from '../config';
import {makeRandom} from '../helpers/utils';

const uniRule = /^\\u((?:[0-9a-f]{2}){2,3})$/i;
const numRule = /^\d+$/;
const hex2num = (hex:string):number => {
  return Number('0x' + hex);
};
export default class ToString extends Mockit<string>{
  constructor(){
    super();
  }
  init(){
    // Count Rule
    this.addRule('Count',(Count:NormalObject) => {
      const {containsMax,containsMin,range} = Count;
      if(!containsMin || !containsMax){
        throw new Error(`You should use '[' and ']' wrap the range.`);
      }
      if(range.length < 2){
        throw new Error(`The count param should have 2 params,but got ${range.length}`);
      }
      // validate code range
      const [first,second] = range;
      const isFirstUni = uniRule.test(first)
      const result:number[][] = [];
      const maxCodeNum = 0x10ffff;
      if(isFirstUni || numRule.test(first)){
        let firstNum:number;
        let secondNum:number;
        if(range.length > 2){
          throw new Error(`The count of range should have just 2 params,if you want support some specail point code,you can set the param like this,[${first}-${first},...]`);
        }else{
          if(isFirstUni){
            firstNum = hex2num(RegExp.$1);
            if(!uniRule.test(second)){
              throw new Error(`The max param "${second}" should use unicode too.`);
            }else{
              secondNum = hex2num(RegExp.$1);
            }
          }else{
            firstNum = Number(first);
            if(!numRule.test(second)){
              throw new Error(`The max param "${second}" is not a number.`);
            }else{
              secondNum = Number(second);
            }
          }
        }
        if(secondNum < firstNum){
          throw new Error(`The min param '${first}' is big than the max param '${second}'`);
        }else{
          if(secondNum > maxCodeNum){
            throw new Error(`The max param's unicode point is big than the max point (${second} > '0x10ffff')`);
          }else{
            result.push([firstNum,secondNum]);
          }
        }
      }else{
        const uniRangeRule = /^\\u((?:[0-9a-f]{2}){2,3})\-\\u((?:[0-9a-f]{2}){2,3})$/i;
        const numRangeRule = /^(\d+)\-(\d+)$/;
        range.map((code:string,index:number) => {
          let match:null|any[];
          let firstNum:number;
          let secondNum:number;
          let isRange = true;
          if(match = code.match(uniRangeRule)){
            firstNum = hex2num(match[1]);
            secondNum = hex2num(match[2]);
          }else if(match = code.match(numRangeRule)){
            firstNum = Number(match[1]);
            secondNum = Number(match[2]);
          }else if(index > 0 && (match = code.match(numRule))){
            isRange = false;
            firstNum = secondNum = Number(match[0]);
          }else{
            throw new Error(`The param of index ${index}(${code}) is a wrong range or number.`);
          }
          if(isRange && secondNum < firstNum){
            throw new Error(`The param of index ${index}'s range is wrong.(${match[1]} > ${match[2]})`)
          }
          if(secondNum > maxCodeNum){
            throw new Error(`The param of index ${index}'s code point(${secondNum}) is big than 0x10ffff`);
          }else{
            result.push([firstNum,secondNum]);
          }
        });
      }
      return {
        containsMax,
        containsMin,
        range: result
      };
    });
    // Length Rule
    this.addRule('Length',(Length:NormalObject) => {
      const {least,most} = Length;
      if(isNaN(least)){
        throw new Error(`The length param of least expect a number,but got ${least}`);
      }
      if(isNaN(most)){
        throw new Error(`The length param of most expect a number,but got ${most}`);
      }
      if(Number(least) >  Number(most)){
        throw new Error(`The length param of least  ${least} is big than the most ${most}`);
      }
    });
    // Wrapper rule
    this.addRule('Wrapper',(Wrapper:NormalObject) => {
      const {prefix,suffix} = Wrapper;
      const strRule = /^(["'])(?:(?!\1)[^\\]|\\.)*\1$/;
      const commaRule = /\\,/g;
      const result:NormalObject = Wrapper;
      if(prefix !== ''){
        if(strRule.test(prefix)){
          result.prefix = result.prefix.slice(1,-1);
        }
        result.prefix = result.prefix.replace(commaRule,',');
      }
      if(suffix !== ''){
        if(strRule.test(suffix)){
          result.suffix = result.suffix.slice(1,-1);
        }
        result.suffix = result.suffix.replace(commaRule,',');
      }
      return result;
    });
    // Wrapper Modifier
    this.addModifier('Wrapper',<ModifierFn<string>>((result:string, Wrapper:NormalObject, Such:NormalObject) => {
      const {prefix,suffix} = Wrapper;
      return prefix + result + suffix;
    }));
    console.log('super init ---');
  }
  generate(){
    const {params} = this;
    const {Length} = params;
    const {least,most} = Length || {least:1,most:100};
    const {range} = params.Count || {range:[[0,127]]}; 
    const index = range.length - 1;
    const total = makeRandom(Number(least),Number(most));
    let result:string = '';
    for(let i = 1; i <= total; i++){
      const idx = makeRandom(0,index);
      const [min,max] = range[idx];
      const point = makeRandom(min,max);
      result += String.fromCodePoint(point); 
    }
    return result;
  }
  test(){
    return true;
  }
}