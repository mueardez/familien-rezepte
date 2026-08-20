export type Recipe = {
  slug: string;
  title: string;
  time: string;
  method: "Pfanne" | "Topf" | "Ofen" | "Waffeleisen";
  icon: string;
  ingredients: string[];
  steps: string[];
  tip: string;
};

export const recipes: Recipe[] = [
  {
    slug: "kartoffel-zucchini-bauernpfanne", title: "Kartoffel-Zucchini-Bauernpfanne", time: "25 Min.", method: "Pfanne", icon: "🥔",
    ingredients: ["600 g Kartoffeln", "1 Zucchini", "½ Stange Lauch", "4 Eier", "150 g Tofu (optional)", "1–2 EL Öl oder Butter"],
    steps: ["Kartoffeln 1 cm würfeln, mit 50 ml Wasser zugedeckt 8–10 Min. garen.", "Zucchini und Lauch fein schneiden, 5–6 Min. mitbraten. Tofu zerbröseln und kurz mitbraten.", "Eier verquirlen, darübergeben und saftig stocken lassen. Kinderportion vor dem kräftigen Würzen herausnehmen."],
    tip: "Gemüse klein schneiden – so lässt es sich leicht mit Kartoffel und Ei löffeln."
  },
  {
    slug: "kartoffel-karotten-taetschli", title: "Kartoffel-Karotten-Tätschli", time: "25 Min.", method: "Pfanne", icon: "🥕",
    ingredients: ["500 g Kartoffeln", "2 Karotten", "1 kleine Zucchini", "1 Ei", "2 EL Mais- oder Kartoffelstärke", "2–3 EL geriebener Käse"],
    steps: ["Kartoffeln und Gemüse fein raffeln; überschüssige Flüssigkeit ausdrücken.", "Mit Ei, Stärke und Käse mischen. Kleine, flache Tätschli formen.", "Bei mittlerer Hitze beidseitig goldbraun und innen weich braten."],
    tip: "Naturjoghurt oder Quark als Dip dazu."
  },
  {
    slug: "pasta-versteckte-gemuesesauce", title: "Pasta mit versteckter Gemüsesauce", time: "20 Min.", method: "Topf", icon: "🍝",
    ingredients: ["250–300 g weizenfreie Pasta", "1 Zucchini", "2 Karotten", "etwas Lauch", "100 g Frischkäse oder Ricotta", "1 EL Öl"],
    steps: ["Pasta kochen. Gemüse klein schneiden und in Öl weich dünsten.", "Mit wenig Pastawasser sehr fein pürieren; Frischkäse oder Ricotta einrühren.", "Mit der Pasta mischen und bei Bedarf mit Pastawasser cremiger machen."],
    tip: "Ideal, wenn sichtbare Gemüsestücke aussortiert werden."
  },
  {
    slug: "herzhafte-gemuese-pancakes", title: "Herzhafte Gemüse-Pancakes", time: "20 Min.", method: "Pfanne", icon: "🥞",
    ingredients: ["1 kleine Zucchini", "1 Karotte", "2 Eier", "70 g Hirseflocken", "50–80 ml Milch", "½ TL Backpulver", "Käse (optional)"],
    steps: ["Hirseflocken fein mahlen; Gemüse sehr fein raffeln.", "Alles verrühren und 5 Min. quellen lassen.", "Kleine Pancakes (7–8 cm) bei mittlerer Hitze langsam ausbacken."],
    tip: "Klein und handlich machen – perfekt als Fingerfood."
  },
  {
    slug: "kartoffel-brokkoli-kaese-waffeln", title: "Kartoffel-Brokkoli-Käse-Waffeln", time: "25–30 Min.", method: "Waffeleisen", icon: "🧇",
    ingredients: ["400 g Kartoffeln", "150 g Brokkoli", "2 Eier", "50 g geriebener Käse", "2 EL Mais- oder Kartoffelstärke", "etwas Milch"],
    steps: ["Kartoffeln und Brokkoli weich kochen. Kartoffeln zerdrücken, Brokkoli sehr fein hacken.", "Mit Eiern, Käse, Stärke und wenig Milch zu einem dicken Teig mischen.", "Im Waffeleisen goldbraun backen – alternativ als Küchlein in der Pfanne."],
    tip: "Brokkoli sehr weich kochen, dann verschwindet er fast im Kartoffelteig."
  },
  {
    slug: "toast-hawaii", title: "Toast Hawaii", time: "15 Min.", method: "Ofen", icon: "🍍",
    ingredients: ["6 Scheiben weizenfreies Toastbrot", "6 Scheiben Schinken", "6 Ananasringe oder -stücke", "6 Scheiben Käse", "Frischkäse oder Butter (optional)", "½ Zucchini (optional)"],
    steps: ["Toast dünn mit Frischkäse oder Butter bestreichen.", "Schinken, Ananas und optional sehr fein geriebene Zucchini darauflegen.", "Mit Käse bedecken und bei 200 °C ca. 8–10 Min. überbacken."],
    tip: "Zucchini unter dem Käse fällt optisch kaum auf."
  },
  {
    slug: "kartoffel-pizza", title: "Kartoffel-Pizza", time: "35 Min.", method: "Ofen", icon: "🍕",
    ingredients: ["600 g gekochte Kartoffeln", "1 Ei", "2 EL Kartoffelstärke", "100 ml Tomatensauce", "125 g Mozzarella", "Gemüse oder Schinken nach Wahl"],
    steps: ["Kartoffeln zerdrücken, mit Ei und Stärke mischen und als flachen Boden formen.", "Bei 210 °C ca. 15 Min. vorbacken.", "Tomatensauce, sehr fein geschnittenes Gemüse und Mozzarella daraufgeben; weitere 10–12 Min. backen."],
    tip: "Kleine Mini-Pizzen sind für Kinder besonders praktisch."
  },
  {
    slug: "polenta-pizza", title: "Polenta-Pizza", time: "30 Min.", method: "Ofen", icon: "🌽",
    ingredients: ["150 g feine Polenta", "600 ml Wasser und Milch gemischt", "100 ml Tomatensauce", "125 g Mozzarella", "Gemüse oder Schinken nach Wahl"],
    steps: ["Polenta nach Packungsangabe dick kochen und auf Backpapier ca. 1 cm dick verstreichen.", "Kurz fest werden lassen, mit Tomatensauce bestreichen.", "Belag und Mozzarella daraufgeben und bei 220 °C ca. 12–15 Min. backen."],
    tip: "Gemüse fein hacken und unter dem Käse verteilen."
  },
  {
    slug: "quesadillas", title: "Quesadillas", time: "15 Min.", method: "Pfanne", icon: "🌮",
    ingredients: ["6 kleine Mais-Tortillas (weizenfrei)", "150 g geriebener Käse", "1 kleine Zucchini", "1 Karotte", "Poulet oder Tofu (optional)"],
    steps: ["Gemüse sehr fein raffeln und kurz weich dünsten.", "Tortilla zur Hälfte mit Käse, Gemüse und optional Poulet oder Tofu belegen; zuklappen.", "In trockener Pfanne beidseitig knusprig braten und in Dreiecke schneiden."],
    tip: "Beim Kauf prüfen: reine Mais-Tortillas ohne Weizen."
  },
  {
    slug: "pizza-omelette", title: "Pizza-Omelette", time: "15 Min.", method: "Pfanne", icon: "🍳",
    ingredients: ["4 Eier", "3 EL Tomatensauce", "100 g Mozzarella oder Käse", "½ Zucchini", "Schinken (optional)"],
    steps: ["Zucchini sehr fein raffeln und kurz anbraten. Eier verquirlen und darübergeben.", "Bei kleiner Hitze fast stocken lassen. Tomatensauce dünn darauf verteilen.", "Käse und optional Schinken daraufgeben, Deckel auflegen und schmelzen lassen."],
    tip: "Wie Pizza in Stücke schneiden – schnell und ohne Teig."
  },
  {
    slug: "zucchini-pizza-taler", title: "Zucchini-Pizza-Taler", time: "25 Min.", method: "Ofen", icon: "🥒",
    ingredients: ["2 Zucchini", "1 Ei", "60 g geriebener Käse", "2 EL Kartoffelstärke", "Tomatensauce", "Mozzarella"],
    steps: ["Zucchini raffeln, gut ausdrücken und mit Ei, Käse und Stärke mischen.", "Kleine flache Taler bei 210 °C ca. 12–15 Min. vorbacken.", "Mit Tomatensauce und Mozzarella belegen und weitere 5–7 Min. backen."],
    tip: "Kleine Taler lassen sich gut mit der Hand essen."
  },
  {
    slug: "ueberbackenes-pizza-brot", title: "Überbackenes Pizza-Brot", time: "15 Min.", method: "Ofen", icon: "🥖",
    ingredients: ["6 Scheiben weizenfreies Brot", "100 ml Tomatensauce", "1 Zucchini oder Karotte", "150 g Käse", "Schinken (optional)"],
    steps: ["Brot mit Tomatensauce bestreichen. Gemüse sehr fein raffeln und darauf verteilen.", "Optional Schinken dazugeben und alles mit Käse bedecken.", "Bei 200 °C ca. 8–10 Min. überbacken."],
    tip: "Sehr schnelle Alternative, wenn keine Zeit für Pizzateig bleibt."
  },
  {
    slug: "cremiger-gemuese-couscous", title: "Cremiger Gemüse-Couscous", time: "15 Min.", method: "Topf", icon: "🥣",
    ingredients: ["180 g Mais-Couscous", "1 Karotte", "1 kleine Zucchini", "80–100 g Frischkäse", "30 g geriebener Käse", "Brühe oder Wasser nach Packungsangabe"],
    steps: ["Karotte und Zucchini sehr fein raffeln und kurz weich dünsten.", "Mais-Couscous nach Packungsangabe quellen lassen und mit Gemüse mischen.", "Frischkäse und Käse unterrühren; mit etwas Wasser cremig einstellen."],
    tip: "Normaler Couscous ist Hartweizen – hier Mais-Couscous verwenden."
  },
  {
    slug: "couscous-bolognese", title: "Couscous „Bolognese“", time: "25 Min.", method: "Topf", icon: "🍅",
    ingredients: ["180 g Mais-Couscous", "250 ml Passata", "1 Karotte", "1 Zucchini", "etwas Lauch", "150 g Tofu oder Hackfleisch"],
    steps: ["Gemüse sehr fein schneiden und weich dünsten; Passata dazugeben und 10 Min. köcheln.", "Nach Wunsch pürieren. Tofu zerbröseln oder Hackfleisch separat garen und einrühren.", "Mais-Couscous zubereiten und mit der Sauce servieren oder direkt mischen."],
    tip: "Sauce fein pürieren, wenn Gemüsestücke stören."
  },
  {
    slug: "couscous-gemuese-taler", title: "Couscous-Gemüse-Taler", time: "25 Min.", method: "Pfanne", icon: "🟡",
    ingredients: ["180 g gekochter Mais-Couscous", "1 kleine Zucchini", "1 Karotte", "1 Ei", "50 g geriebener Käse", "1–2 EL Kartoffelstärke"],
    steps: ["Gemüse sehr fein raffeln und Zucchini ausdrücken.", "Mit Couscous, Ei, Käse und Stärke mischen; kleine Taler formen.", "Bei mittlerer Hitze beidseitig goldbraun braten."],
    tip: "Auch kalt gut – praktisch für Reste oder unterwegs."
  },
  {
    slug: "cremige-zucchini-frischkaese-pasta", title: "Cremige Zucchini-Frischkäse-Pasta", time: "20 Min.", method: "Topf", icon: "🍝",
    ingredients: ["250–300 g weizenfreie Pasta", "2 kleine Zucchini", "120 g Frischkäse", "30 g Parmesan", "1 EL Öl", "100 ml Pastawasser"],
    steps: ["Pasta kochen. Zucchini fein raspeln und in Öl 7–8 Min. weich dünsten.", "Frischkäse und 100 ml Pastawasser einrühren und cremig rühren.", "Pasta untermischen, Parmesan dazugeben."],
    tip: "Zucchini lange genug dünsten – dann wird sie Teil der Sauce."
  },
  {
    slug: "orange-sauce-pasta", title: "Orange-Sauce-Pasta", time: "25 Min.", method: "Topf", icon: "🧡",
    ingredients: ["250–300 g weizenfreie Pasta", "3 Karotten", "200 g Süsskartoffel", "100 g Frischkäse", "etwas Milch oder Pastawasser"],
    steps: ["Karotten und Süsskartoffel klein schneiden und sehr weich kochen.", "Mit Frischkäse und etwas Kochwasser fein pürieren.", "Mit Pasta mischen und mit Milch oder Pastawasser auf gewünschte Cremigkeit bringen."],
    tip: "Sieht aus wie eine milde Käse-Sauce, enthält aber viel Gemüse."
  },
  {
    slug: "gemuese-bolognese", title: "Gemüse-Bolognese", time: "30 Min.", method: "Topf", icon: "🍅",
    ingredients: ["250–300 g weizenfreie Pasta", "300 ml Passata", "1 Karotte", "1 Zucchini", "etwas Lauch", "200 g Hackfleisch oder Tofu"],
    steps: ["Gemüse sehr fein hacken und weich dünsten. Hackfleisch oder Tofu dazugeben und garen.", "Passata einrühren und ca. 10–15 Min. köcheln; bei Bedarf teilweise pürieren.", "Mit der gekochten Pasta servieren."],
    tip: "Tofu fein zerbröseln – so geht er in der Sauce fast unter."
  },
  {
    slug: "pasta-frittata", title: "Pasta-Frittata", time: "20 Min.", method: "Pfanne", icon: "🍳",
    ingredients: ["250 g gekochte weizenfreie Pasta", "4 Eier", "1 kleine Zucchini oder Karotte", "80 g geriebener Käse", "1 EL Öl"],
    steps: ["Gemüse fein raffeln und kurz in einer beschichteten Pfanne dünsten. Pasta dazugeben.", "Eier verquirlen, mit Käse mischen und darübergiessen.", "Bei kleiner Hitze mit Deckel stocken lassen; wie Pizza in Stücke schneiden."],
    tip: "Perfekt für Pastareste vom Vortag."
  }
];

export function getRecipe(slug: string) {
  return recipes.find((recipe) => recipe.slug === slug);
}
