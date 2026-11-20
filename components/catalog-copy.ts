import type { Locale } from "@/lib/i18n/dictionaries";
const copy = {
  fr: {
    storage: "Conservation", processing: "Préparation", family: "Famille de produits", all: "Tout", allCatalog: "Tout le catalogue", chilled: "Réfrigéré", frozen: "Surgelé", unknown: "Conservation à confirmer", temperature: "Température à confirmer", reset: "Effacer les filtres", results: "produit(s)", sort: "Trier par", name: "Nom : A → Z", price: "Prix : croissant", hint: "Choisissez la conservation, puis la préparation ou la famille de produits.",
    methods: { "unprocessed": "Non transformé", "hot-smoked": "Fumé à chaud", "cold-smoked": "Fumé à froid", smoked: "Tous les fumés", salted: "Salé", dried: "Séché", unspecified: "Préparation à confirmer" },
    families: { salmon: "Saumon et truite", seafood: "Fruits de mer", whitefish: "Poissons blancs", roe: "Œufs de poisson" },
  },
  en: {
    storage: "Storage", processing: "Preparation", family: "Product family", all: "All", allCatalog: "All products", chilled: "Chilled", frozen: "Frozen", unknown: "Storage to be confirmed", temperature: "Temperature to be confirmed", reset: "Clear filters", results: "product(s)", sort: "Sort by", name: "Name: A → Z", price: "Price: low to high", hint: "Choose storage, then preparation or product family.",
    methods: { "unprocessed": "Unprocessed", "hot-smoked": "Hot-smoked", "cold-smoked": "Cold-smoked", smoked: "All smoked", salted: "Salted", dried: "Dried", unspecified: "Preparation to be confirmed" },
    families: { salmon: "Salmon and trout", seafood: "Seafood", whitefish: "White fish", roe: "Fish roe" },
  },
  de: {
    storage: "Lagerung", processing: "Verarbeitung", family: "Produktgruppe", all: "Alle", allCatalog: "Gesamtes Sortiment", chilled: "Gekühlt", frozen: "Tiefgekühlt", unknown: "Lagerung auf Anfrage", temperature: "Temperatur auf Anfrage", reset: "Filter zurücksetzen", results: "Produkt(e)", sort: "Sortieren nach", name: "Name: A → Z", price: "Preis: aufsteigend", hint: "Lagerung wählen, dann Verarbeitung oder Produktgruppe eingrenzen.",
    methods: { "unprocessed": "Unverarbeitet", "hot-smoked": "Heißgeräuchert", "cold-smoked": "Kaltgeräuchert", smoked: "Alle Räucherwaren", salted: "Gesalzen", dried: "Getrocknet", unspecified: "Verarbeitung auf Anfrage" },
    families: { salmon: "Lachs und Forelle", seafood: "Meeresfrüchte", whitefish: "Weißfisch", roe: "Fischrogen" },
  },
  ru: {
    storage: "Условия хранения", processing: "Способ обработки", family: "Вид продукции", all: "Все", allCatalog: "Весь каталог", chilled: "Охлаждённое", frozen: "Замороженное", unknown: "Хранение уточняется", temperature: "Температура уточняется", reset: "Сбросить фильтры", results: "товар(ов)", sort: "Сортировка", name: "Название: А → Я", price: "Цена: по возрастанию", hint: "Выберите хранение, затем уточните способ обработки или вид продукции.",
    methods: { "unprocessed": "Без обработки", "hot-smoked": "Горячего копчения", "cold-smoked": "Холодного копчения", smoked: "Всё копчёное", salted: "Солёное", dried: "Сушёное и вяленое", unspecified: "Обработка уточняется" },
    families: { salmon: "Лосось и форель", seafood: "Морепродукты", whitefish: "Белая рыба", roe: "Икра" },
  },
};
export const catalogCopy = { ...copy, ar: copy.en };
export function categoryLabel(category: string, locale: Locale) {
  const families = catalogCopy[locale].families;
  return families[category.toLowerCase() as keyof typeof families] || category;
}
