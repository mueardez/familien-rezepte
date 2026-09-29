export type Ingredient = { foodId?: string; name: string; quantity: string; unit: string; note: string; original?: string; review?: boolean };
export type Food = { id: string; name: string; aliases: string[] };
export type Method = { id: string; name: string; aliases: string[]; inPoll: boolean };
export const defaultMethods: Method[] = ["Pfanne", "Topf", "Ofen", "Waffeleisen", "Petromax", "Andere"].map((name) => ({ id: name.toLowerCase(), name, aliases: [name], inPoll: name !== "Petromax" }));
export const foodKey = (name: string) => name.trim().normalize("NFKC").toLocaleLowerCase("de-CH").replace(/ß/g, "ss").replace(/\s+/g, " ");
const groups = [
  ["Ei", "Eier", "egg", "eggs"], ["Kartoffel", "Kartoffeln", "potato", "potatoes"], ["Karotte", "Karotten", "Rüebli", "Möhre", "Möhren", "carrot", "carrots"],
  ["Zwiebel", "Zwiebeln", "onion", "onions"], ["Tomate", "Tomaten", "tomato", "tomatoes"], ["Cherrytomate", "Cherrytomaten", "Kirschtomaten", "cherry tomatoes"],
  ["Banane", "Bananen", "banana", "bananas"], ["Apfel", "Äpfel", "apple", "apples"], ["Zucchini", "Zucchetti", "courgette"], ["Knoblauch", "garlic"],
  ["Milch", "milk"], ["Butter"], ["Salz", "salt"], ["Pfeffer", "pepper"], ["Käse", "cheese"], ["Mozzarella"], ["Schinken", "ham"], ["Petersilie", "parsley"], ["Babyspinat", "baby spinach"], ["Mais-Tortilla", "Mais-Tortillas"], ["Süsskartoffel", "Süsskartoffeln"], ["Passata", "passierte Tomaten"],
];
export function canonicalName(name: string): string { return groups.find((group) => group.some((alias) => foodKey(alias) === foodKey(name)))?.[0] ?? name.trim().replace(/\s+/g, " "); }
export function blankIngredient(): Ingredient { return { name: "", quantity: "", unit: "", note: "" }; }
export function parseIngredient(line: string): Ingredient {
  const original = line.trim(); let text = original; const notes: string[] = [];
  if (/^ca\.?\s/i.test(text)) notes.push("ca.");
  if (/^optional:\s*/i.test(text)) { notes.push("optional"); text = text.replace(/^optional:\s*/i, ""); }
  text = text.replace(/\(([^)]+)\)/g, (_, note) => { notes.push(note); return ""; }).trim();
  // Preserve alternatives as written: these require a human choice, not an automatic merge.
  const alternatives = /\s(?:oder|or|und|and)\s/i.test(text);
  const number = text.match(/^(?:ca\.?\s*)?((?:\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])(?:\s*[–-]\s*(?:\d+(?:[.,]\d+)?|[¼½¾⅓⅔]))?)(?:\s*|(?=[A-Za-z]))/i);
  let quantity = number?.[1] ?? "";
  if (number) text = text.slice(number[0].length).trim();
  else { const word = text.match(/^(eine?\s+halbe?|eine?|ein|etwas|wenig|nach Bedarf)\s+/i); if (word) { quantity = /^eine? halbe?$/i.test(word[1]) ? "½" : /^eine?$/i.test(word[1]) ? "1" : word[1]; text = text.slice(word[0].length); } }
  const unitMatch = text.match(/^(kg|g|mg|ml|dl|cl|l|EL|TL|tbsp|tsp|cups?|Tassen?|Prisen?|Scheiben?|Stangen?|Hand\s*voll|Handvoll|Dosen?|Packungen?|Stück)\b\s*/i);
  let unit = unitMatch?.[1] ?? "";
  if (unitMatch) text = text.slice(unitMatch[0].length);
  const units: Record<string, string> = { el: "EL", tl: "TL", tbsp: "EL", tsp: "TL", scheiben: "Scheibe", stangen: "Stange", prisen: "Prise", dosen: "Dose", packungen: "Packung", handvoll: "Handvoll", "hand voll": "Handvoll" };
  unit = units[unit.toLowerCase()] ?? unit;
  if (!alternatives) {
    const comma = text.indexOf(","); if (comma >= 0) { notes.push(text.slice(comma + 1).trim()); text = text.slice(0, comma); }
    const descriptors = /^(?:(?:sehr fein |fein |vollständig )?(?:gerieben(?:e[rsn]?)?|gekocht(?:e[rsn]?)?|fein(?:e[rsn]?)?|vorgegart(?:e[rsn]?)?|vorgekocht(?:e[rsn]?)?|hart gekocht(?:e[rsn]?)?|klein(?:e[rsn]?)?|gross(?:e[rsn]?)?|mild(?:e[rsn]?)?|süss(?:e[rsn]?)?)\s+)+/i;
    const descriptor = text.match(descriptors); if (descriptor) { notes.push(descriptor[0].trim()); text = text.slice(descriptor[0].length); }
  }
  return { name: canonicalName(text), quantity, unit, note: notes.join(", "), original, review: alternatives || !text || (!quantity && !/^(Salz|Pfeffer|Zimt|Käse|Petersilie)$/i.test(text)) };
}
export function normalizeIngredient(value: unknown): Ingredient {
  if (typeof value === "string") return parseIngredient(value);
  if (!value || typeof value !== "object") throw new Error("Ungültige Zutat");
  const item = value as Ingredient;
  if ([item.name, item.quantity, item.unit, item.note].some((value) => typeof value !== "string")) throw new Error("Ungültige Zutat");
  return { name: canonicalName(item.name.slice(0, 180)), quantity: item.quantity.trim().slice(0, 50), unit: item.unit.trim().slice(0, 40), note: item.note.trim().slice(0, 300), ...(typeof item.foodId === "string" ? { foodId: item.foodId.slice(0, 80) } : {}), ...(typeof item.original === "string" ? { original: item.original.slice(0, 500) } : {}), review: item.review === true };
}
export function ingredientText(item: Ingredient): string { return [item.quantity, item.unit, item.name].filter(Boolean).join(" ") + (item.note ? ` (${item.note})` : ""); }
