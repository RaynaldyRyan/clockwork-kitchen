// Clockwork Kitchen: the menu. Each dish is a set of ingredients; noodle and
// egg must be cooked first (pot / pan), the rest go on the plate raw.
export const INGREDIENTS = {
  noodle: { name: 'Noodle', cooksIn: 'pot', cookSeconds: 5 },
  tomato: { name: 'Tomato', cooksIn: null, cookSeconds: 0 },
  lettuce: { name: 'Lettuce', cooksIn: null, cookSeconds: 0 },
  cheese: { name: 'Cheese', cooksIn: null, cookSeconds: 0 },
  egg: { name: 'Egg', cooksIn: 'pan', cookSeconds: 4 },
  bun: { name: 'Bun', cooksIn: null, cookSeconds: 0 },
};

export const DISHES = {
  pasta: {
    id: 'pasta',
    name: 'Clock Pasta',
    needs: ['noodle', 'tomato', 'cheese'],
    price: 25,
    blurb: 'Noodle, tomato, cheese',
  },
  salad: {
    id: 'salad',
    name: 'Garden Plate',
    needs: ['lettuce', 'tomato', 'egg'],
    price: 20,
    blurb: 'Lettuce, tomato, egg',
  },
  bunstack: {
    id: 'bunstack',
    name: 'Bun Stack',
    needs: ['bun', 'egg', 'cheese'],
    price: 25,
    blurb: 'Bun, egg, cheese',
  },
  special: {
    id: 'special',
    name: "Chef's Special",
    needs: ['noodle', 'lettuce', 'tomato', 'cheese'],
    price: 40,
    blurb: 'Noodle, lettuce, tomato, cheese',
  },
};

export const DISH_ORDER = ['pasta', 'salad', 'bunstack', 'special'];

/** An item is { kind, cooked }. Raw noodle/egg are not plateable until cooked. */
export function makeItem(kind) {
  return { kind, cooked: INGREDIENTS[kind].cooksIn === null };
}

export function needsCooking(kind) {
  return INGREDIENTS[kind].cooksIn !== null;
}

/** True when the plate's items are exactly one dish's recipe (order-free). */
export function matchDish(plateItems) {
  const kinds = plateItems.map((item) => item.kind).sort().join(',');
  for (const id of DISH_ORDER) {
    const dish = DISHES[id];
    if ([...dish.needs].sort().join(',') === kinds) return dish;
  }
  return null;
}

/** True when the plate so far could still become the dish (no wrong item). */
export function plateFitsDish(plateItems, dish) {
  const kinds = plateItems.map((item) => item.kind);
  return kinds.every((kind) => dish.needs.includes(kind))
    && new Set(kinds).size === kinds.length;
}
