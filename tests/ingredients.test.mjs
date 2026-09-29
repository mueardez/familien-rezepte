import assert from 'node:assert/strict';
import test from 'node:test';
import { parseIngredient, canonicalName, normalizeIngredient } from '../app/lib/ingredients.ts';

test('quantities, units, fractions and optional preparation are kept separate', () => {
  assert.deepEqual([parseIngredient('40g geriebener Käse').quantity, parseIngredient('40g geriebener Käse').unit, parseIngredient('40g geriebener Käse').name, parseIngredient('40g geriebener Käse').note], ['40', 'g', 'Käse', 'geriebener']);
  const eggs = parseIngredient('3 Eier'); assert.equal(eggs.name, 'Ei'); assert.equal(eggs.quantity, '3');
  const half = parseIngredient('½ hart gekochtes Ei'); assert.equal(half.quantity, '½'); assert.equal(half.name, 'Ei'); assert.equal(half.note, 'hart gekochtes');
  assert.equal(parseIngredient('50 g gekochte Kartoffeln').name, 'Kartoffel');
  assert.equal(parseIngredient('50 g gekochte Kartoffeln').note, 'gekochte');
  const range = parseIngredient('250–300 g weizenfreie Pasta'); assert.equal(range.quantity, '250–300'); assert.equal(range.name, 'weizenfreie Pasta');
  const optional = parseIngredient('optional: ½ Scheibe Schinken'); assert.equal(optional.quantity, '½'); assert.equal(optional.unit, 'Scheibe'); assert.match(optional.note, /optional/);
});
test('known plurals and translations share names without stripping dietary distinctions', () => {
  assert.equal(canonicalName('eggs'), canonicalName('Eier'));
  assert.equal(canonicalName('Kartoffeln'), canonicalName('potatoes'));
  assert.notEqual(canonicalName('weizenfreie Pasta'), canonicalName('Pasta'));
  assert.notEqual(canonicalName('rote Zwiebel'), canonicalName('Zwiebel'));
});
test('unclear alternatives retain the exact original and are flagged for review', () => {
  const item = parseIngredient('1 dünner Ananasring oder 2 EL Ananasstücke');
  assert.equal(item.original, '1 dünner Ananasring oder 2 EL Ananasstücke'); assert.equal(item.review, true); assert.match(item.name, /oder 2 EL Ananasstücke/);
  assert.throws(() => normalizeIngredient({ name: 'Ei', quantity: 2, unit: '', note: '' }));
});
