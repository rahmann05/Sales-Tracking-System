import {test} from 'node:test';
import assert from 'node:assert/strict';
import {notificationRetryDelay,dispatchNotifications} from '../src/modules/notifications/services/notification-delivery.service.js';
test('notification retries use bounded exponential delays, including invalid fallback values',()=>{
 assert.equal(notificationRetryDelay(1,10),10000);
 assert.equal(notificationRetryDelay(2,10),20000);
 assert.equal(notificationRetryDelay(20,10),3600000);
 assert.equal(notificationRetryDelay(1,-1),5000);
 assert.equal(notificationRetryDelay(1,'bad'),10000);
});
test('an unavailable socket service leaves the durable outbox untouched',async()=>{
 const result=await dispatchNotifications({ready:()=>false,db:{}});
 assert.deepEqual(result,{disabled:true,broadcast:0});
});
