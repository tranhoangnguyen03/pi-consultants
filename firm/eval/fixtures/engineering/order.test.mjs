// Deliberately low-value tests for the consultant to diagnose and revise.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createOrder, helperNames} from './order.mjs';
for(const name of helperNames)test(`helper name ${name} exists`,()=>assert(helperNames.includes(name)));
test('export is a function',()=>assert.equal(typeof createOrder,'function'));
test('function has one parameter',()=>assert.equal(createOrder.length,1));
test('one order returns an object',()=>assert.equal(typeof createOrder({sku:'A',quantity:1,stock:5,unitPrice:10}),'object'));
