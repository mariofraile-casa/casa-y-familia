// Datos iniciales de la app. Solo se usan la primera vez (o al «Empezar de cero» en Ajustes).

// kind: proteína principal (para variar en la semana y no repetir lo que comen en el cole).
// when: 'cena' (ligero, entre semana), 'comida' (fin de semana) o 'ambas'.
const r = (name, kind, when, ingredients) => ({ id: 'r2_' + name.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').slice(0, 18), name, kind, when, ingredients });
const i = (qty, unit, name) => ({ qty, unit, name });

export function seed() {
  return {
    version: 1,
    settings: { user: 'm', hiddenTiles: [] },
    // Las personas y los turnos de trabajo viven solo en la base de datos (nunca en el código publicado).
    people: [],
    shifts: [],
    events: [],
    tasks: [],
    cover: {}, // quién recoge a los niños un día concreto: { '2026-12-07': 'Abuelos' }
    stores: ['Mercadona', 'Dia'],
    shopping: [],
    shoppingHistory: [],
    catalog: [
      'Aceite', 'Agua', 'Arroz', 'Atún', 'Azúcar', 'Café', 'Cebolla', 'Champú', 'Detergente', 'Fruta',
      'Galletas', 'Harina', 'Huevos', 'Jamón york', 'Leche', 'Lavavajillas', 'Lechuga', 'Mantequilla',
      'Manzanas', 'Naranjas', 'Pan', 'Pan de molde', 'Papel higiénico', 'Papel de cocina', 'Pasta',
      'Patatas', 'Pechuga de pollo', 'Plátanos', 'Queso', 'Sal', 'Tomate frito', 'Tomates', 'Yogures', 'Zumo'
    ],
    // Recetario mediterráneo: cenas ligeras con proteína y verdura; los fines de semana, comidas.
    // Pensado para 4 (dos adultos y dos niños). Se puede cambiar desde la app.
    recipes: [
      r('Bonito a la plancha con pimientos y cebolla', 'pescado', 'cena', [i(600, 'g', 'Bonito'), i(2, 'ud', 'Pimiento rojo'), i(1, 'ud', 'Cebolla'), i(1, 'ud', 'Limón')]),
      r('Salmón a la plancha con brócoli', 'pescado', 'cena', [i(600, 'g', 'Salmón'), i(1, 'ud', 'Brócoli'), i(1, 'ud', 'Limón')]),
      r('Salmón al horno con patata panadera', 'pescado', 'ambas', [i(600, 'g', 'Salmón'), i(500, 'g', 'Patatas'), i(1, 'ud', 'Cebolla'), i(1, 'ud', 'Limón')]),
      r('Sardinas al horno con tomate y pimientos', 'pescado', 'cena', [i(600, 'g', 'Sardinas limpias'), i(1, 'bote', 'Tomate triturado'), i(2, 'ud', 'Pimiento rojo'), i(1, 'ud', 'Cebolla')]),
      r('Sepia a la plancha con ensalada', 'pescado', 'cena', [i(600, 'g', 'Sepia'), i(1, 'ud', 'Lechuga'), i(3, 'ud', 'Tomates'), i(1, 'ud', 'Pepino')]),
      r('Tortilla francesa con espinacas y ensalada de tomate', 'huevo', 'cena', [i(8, 'ud', 'Huevos'), i(200, 'g', 'Espinacas'), i(4, 'ud', 'Tomates')]),
      r('Revuelto de champiñones y gambas', 'huevo', 'cena', [i(6, 'ud', 'Huevos'), i(300, 'g', 'Champiñones'), i(200, 'g', 'Gambas peladas'), i(1, 'ud', 'Ajo')]),
      r('Pisto con huevo', 'huevo', 'cena', [i(2, 'ud', 'Calabacín'), i(1, 'ud', 'Berenjena'), i(2, 'ud', 'Pimiento rojo'), i(1, 'bote', 'Tomate triturado'), i(4, 'ud', 'Huevos')]),
      r('Crema de calabacín y huevo a la plancha', 'huevo', 'cena', [i(3, 'ud', 'Calabacín'), i(1, 'ud', 'Puerro'), i(1, 'ud', 'Patatas'), i(4, 'ud', 'Huevos')]),
      r('Pollo a la plancha con ensalada y aguacate', 'pollo', 'cena', [i(600, 'g', 'Pechuga de pollo'), i(1, 'ud', 'Lechuga'), i(2, 'ud', 'Aguacate'), i(3, 'ud', 'Tomates')]),
      r('Brochetas de pollo con verduras al horno', 'pollo', 'cena', [i(600, 'g', 'Pechuga de pollo'), i(1, 'ud', 'Calabacín'), i(1, 'ud', 'Pimiento rojo'), i(1, 'ud', 'Cebolla'), i(250, 'g', 'Tomates cherry')]),
      r('Pavo al limón con judías verdes', 'pollo', 'cena', [i(600, 'g', 'Filetes de pavo'), i(400, 'g', 'Judías verdes'), i(2, 'ud', 'Limón')]),
      r('Wok de pollo con verduras', 'pollo', 'cena', [i(600, 'g', 'Pechuga de pollo'), i(1, 'paq', 'Verduras para wok'), i(1, 'ud', 'Salsa de soja')]),
      r('Hamburguesas caseras de ternera con ensalada', 'carne', 'ambas', [i(500, 'g', 'Carne picada de ternera'), i(1, 'ud', 'Lechuga'), i(3, 'ud', 'Tomates'), i(1, 'ud', 'Cebolla')]),
      r('Solomillo de cerdo con pimientos asados', 'carne', 'ambas', [i(600, 'g', 'Solomillo de cerdo'), i(3, 'ud', 'Pimiento rojo'), i(1, 'ud', 'Ajo')]),
      r('Ensalada templada de garbanzos con atún y huevo', 'legumbre', 'cena', [i(1, 'bote', 'Garbanzos cocidos'), i(2, 'lata', 'Atún'), i(4, 'ud', 'Huevos'), i(3, 'ud', 'Tomates'), i(1, 'ud', 'Pimiento verde')]),
      r('Lentejas estofadas con verduras', 'legumbre', 'comida', [i(400, 'g', 'Lentejas'), i(2, 'ud', 'Zanahorias'), i(1, 'ud', 'Cebolla'), i(1, 'ud', 'Pimiento verde'), i(1, 'ud', 'Patatas')]),
      r('Paella de pollo y verduras', 'arroz', 'comida', [i(400, 'g', 'Arroz'), i(500, 'g', 'Pollo troceado'), i(300, 'g', 'Judías verdes'), i(1, 'ud', 'Pimiento rojo'), i(1, 'bote', 'Tomate triturado')]),
      r('Pasta integral con atún, tomate y verduras', 'pasta', 'comida', [i(400, 'g', 'Pasta integral'), i(3, 'lata', 'Atún'), i(1, 'bote', 'Tomate triturado'), i(1, 'ud', 'Calabacín')]),
      r('Pizza casera integral con verduras y pavo', 'pollo', 'comida', [i(2, 'ud', 'Masa de pizza integral'), i(200, 'g', 'Mozzarella'), i(1, 'bote', 'Tomate triturado'), i(150, 'g', 'Pechuga de pavo'), i(200, 'g', 'Champiñones')])
    ],
    menu: {}, // { '2026-11-16': [{ date, meal, dishes: [recipeId|texto] }] } por semana (lunes)
    school: [],
    educamos: { status: 'sin-conectar', lastRead: null, message: '' },
    meds: [],
    doses: [], // tomas dadas: { medId, date, time, by, at }
    bills: [],
    gifts: []
  };
}
