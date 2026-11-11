import type { Locale } from "@/lib/i18n/dictionaries";
export const shopCopy: Record<
  Locale,
  {
    chilled: string;
    frozen: string;
    add: string;
    added: string;
    box: string;
    perBox: string;
    delivery: string;
    deliveryText: string;
    boxes: string;
    boxesText: string;
    choose: string;
    chooseText: string;
    fill: string;
    fillText: string;
    receive: string;
    receiveText: string;
    checkout: string;
    viewCart: string;
    continue: string;
    unknown: string;
  }
> = {
  en: {
    chilled: "Chilled",
    frozen: "Frozen",
    add: "Add to cart",
    added: "Added",
    box: "Cartons",
    perBox: "per carton",
    delivery: "Delivery across France",
    deliveryText: "Refrigerated logistics for your business in France.",
    boxes: "Order by the carton",
    boxesText: "Whole cartons. Each quantity step adds one sales pack.",
    choose: "Choose your products",
    chooseText: "See prices and filter chilled or frozen products.",
    fill: "Build your basket",
    fillText: "Add whole cartons in the quantities you need.",
    receive: "Arrange delivery",
    receiveText: "Enter your company details and delivery address in France.",
    checkout: "Proceed to checkout",
    viewCart: "View basket",
    continue: "Continue shopping",
    unknown: "Storage details on request",
  },
  fr: {
    chilled: "Réfrigéré",
    frozen: "Surgelé",
    add: "Ajouter au panier",
    added: "Ajouté",
    box: "Cartons",
    perBox: "par carton",
    delivery: "Livraison en France",
    deliveryText:
      "Une logistique frigorifique pour votre établissement en France.",
    boxes: "Commandez par carton",
    boxesText:
      "Cartons entiers. Chaque unité ajoutée correspond à un conditionnement de vente.",
    choose: "Choisissez vos produits",
    chooseText:
      "Consultez les prix et filtrez les produits réfrigérés ou surgelés.",
    fill: "Composez votre panier",
    fillText: "Ajoutez des cartons entiers selon vos besoins.",
    receive: "Organisez la livraison",
    receiveText:
      "Renseignez votre entreprise et votre adresse de livraison en France.",
    checkout: "Passer la commande",
    viewCart: "Voir le panier",
    continue: "Continuer les achats",
    unknown: "Conservation à confirmer",
  },
  ru: {
    chilled: "Охлаждённое",
    frozen: "Замороженное",
    add: "В корзину",
    added: "Добавлено",
    box: "Ящики",
    perBox: "за ящик",
    delivery: "Доставка по Франции",
    deliveryText: "Рефрижераторная логистика для вашего бизнеса во Франции.",
    boxes: "Заказ кратно ящику",
    boxesText: "Целые ящики. Один шаг количества — одна продажная упаковка.",
    choose: "Выберите товары",
    chooseText:
      "Смотрите цены и выбирайте охлаждённую или замороженную продукцию.",
    fill: "Соберите корзину",
    fillText: "Добавляйте целые ящики в нужном количестве.",
    receive: "Оформите доставку",
    receiveText: "Укажите данные компании и адрес доставки во Франции.",
    checkout: "Оформить заказ",
    viewCart: "Открыть корзину",
    continue: "Продолжить покупки",
    unknown: "Условия хранения уточняются",
  },
  ar: {
    chilled: "مبرد",
    frozen: "مجمد",
    add: "أضف إلى السلة",
    added: "تمت الإضافة",
    box: "صناديق",
    perBox: "للصندوق",
    delivery: "التوصيل في فرنسا",
    deliveryText: "خدمات نقل مبردة لمنشأتك في فرنسا.",
    boxes: "الطلب بصناديق كاملة",
    boxesText: "كل زيادة في الكمية تعادل عبوة بيع كاملة.",
    choose: "اختر المنتجات",
    chooseText: "اطلع على الأسعار واختر المنتجات المبردة أو المجمدة.",
    fill: "جهز سلتك",
    fillText: "أضف الصناديق الكاملة بالكمية المطلوبة.",
    receive: "رتب التوصيل",
    receiveText: "أدخل بيانات شركتك وعنوان التسليم في فرنسا.",
    checkout: "إتمام الطلب",
    viewCart: "عرض السلة",
    continue: "متابعة التسوق",
    unknown: "يرجى تأكيد شروط الحفظ",
  },
};
