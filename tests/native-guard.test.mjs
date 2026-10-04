import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nativeGuard} from '../dist/native-guard.mjs';
test('browser and absent bridge have no native guard',()=>{
  assert.equal(nativeGuard({}),null);
  assert.equal(nativeGuard({isNativePlatform:()=>false}),null);
});
test('Android injected plugin works without registerPlugin',()=>{
  const plugin={status:async()=>({accessibility:true})};
  assert.equal(nativeGuard({isNativePlatform:()=>true,Plugins:{ReboundGuard:plugin}}),plugin);
});
test('JS core registration remains supported',()=>{
  const plugin={};
  assert.equal(nativeGuard({isNativePlatform:()=>true,registerPlugin:name=>{assert.equal(name,'ReboundGuard');return plugin;}}),plugin);
});
