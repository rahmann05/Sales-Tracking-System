import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unitDefinitionError,unitSnapshot,unitDescription} from '../../shared/product-units.mjs';
import {orderSnapshot} from '../../shared/order-snapshot.mjs';
import {validateProductUnits} from '../src/modules/products/product-units.js';
import {createProductSchema} from '../src/modules/products/products.schema.js';
test('selling unit conversion must be explicit, positive and internally consistent',()=>{
 assert.equal(unitDefinitionError({unit:'dus',baseUnit:'pcs',unitsPerUnit:12}),null);
 for(const unitsPerUnit of [0,-1,1.5,1000001])assert.ok(unitDefinitionError({unit:'dus',baseUnit:'pcs',unitsPerUnit}));
 assert.ok(unitDefinitionError({unit:'PCS',baseUnit:'pcs',unitsPerUnit:12}));
 assert.deepEqual(validateProductUnits({unit:' dus ',baseUnit:' pcs ',unitsPerUnit:12}),{unit:'dus',baseUnit:'pcs',unitsPerUnit:12});
});
test('partial unit updates cannot silently reuse an old packaging factor',()=>{
 assert.throws(()=>validateProductUnits({unit:'dus'}),e=>e.statusCode===400);
 assert.deepEqual(validateProductUnits({name:'rename only'}),{});
});
test('new product requests require units while unknown legacy units stay explicit',()=>{
 assert.equal(createProductSchema.safeParse({body:{name:'Barang',price:1000}}).success,false);
 assert.deepEqual(unitSnapshot({}),{unit:'unit',baseUnit:null,unitsPerUnit:null});
 assert.match(unitDescription(unitSnapshot({})),/belum terverifikasi/);
});
test('historical unit snapshots override the current catalog including conversion factors',()=>{
 const shown=orderSnapshot({items:[{unit:'dus',baseUnit:'pcs',unitsPerUnit:12,product:{unit:'pack',baseUnit:'pcs',unitsPerUnit:6}}]});
 assert.equal(shown.items[0].product.unit,'dus');assert.equal(shown.items[0].product.unitsPerUnit,12);assert.equal(unitDescription(shown.items[0]),'dus (12 pcs)');
 const legacy=orderSnapshot({items:[{unit:'unit',product:{unit:'dus',baseUnit:'pcs',unitsPerUnit:12}}]});assert.equal(legacy.items[0].product.baseUnit,null);
});
