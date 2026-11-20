import test from 'node:test';
import assert from 'node:assert/strict';
import {productProcessing,matchesProcessing,temperatureLabel} from '../lib/product-facets.ts';
import {productStorage} from '../lib/product-storage.ts';
test('storage and preparation remain independent',()=>{
 const product={storageCondition:'frozen',processingMethod:'cold-smoked',temperatureMaxC:-18};
 assert.equal(productStorage(product),'frozen');assert.equal(productProcessing(product),'cold-smoked');
 assert.equal(matchesProcessing(product,'smoked'),true);assert.equal(matchesProcessing(product,'hot-smoked'),false);
});
test('localized explicit names distinguish preparation without guessing smoke type',()=>{
 for(const title of ['Hot-smoked trout','Truite fumée à chaud','Heißgeräucherter Hering','Салака горячего копчения'])assert.equal(productProcessing({title}),'hot-smoked',title);
 for(const title of ['Cold-smoked trout','Truite fumée à froid','Kaltgeräucherter Lachs','Форель холодного копчения'])assert.equal(productProcessing({title}),'cold-smoked',title);
 assert.equal(productProcessing({title:'Hareng fumé'}),'smoked');assert.equal(matchesProcessing({title:'Hareng fumé'},'hot-smoked'),false);
 assert.equal(productProcessing({title:'Икра малосольная'}),'salted');assert.equal(productProcessing({title:'Вяленая рыба'}),'dried');
});
test('unknown processing stays unknown; descriptions do not imply raw',()=>{
 assert.equal(productProcessing({title:'Salmon fillet'}),'unspecified');
 assert.equal(productProcessing({title:'Smoked salmon',processingMethod:'salted'}),'salted');
});
test('cold chain recognition uses source translations and flags conflicts',()=>{
 assert.equal(productStorage({title:'Saumon',translations:{en:{title:'Frozen salmon portions'}}}),'frozen');
 assert.equal(productStorage({title:'Fresh or frozen salmon'}),'unspecified');
 assert.equal(productStorage({storageCondition:'chilled',title:'Frozen salmon'}),'chilled');
});
test('temperature displays exact source limits and never invents a default',()=>{
 assert.equal(temperatureLabel({temperatureMinC:0,temperatureMaxC:2},'fr'),'0…+2 °C');
 assert.equal(temperatureLabel({temperatureMaxC:-18},'ru'),'≤ −18 °C');
 assert.equal(temperatureLabel({temperatureMaxC:-60},'en'),'≤ −60 °C');
 assert.equal(temperatureLabel({storageCondition:'frozen'},'en'),null);
 assert.equal(temperatureLabel({temperatureMinC:4,temperatureMaxC:0},'en'),null);
 assert.equal(temperatureLabel({temperatureMaxC:Number.NaN},'en'),null);
});
