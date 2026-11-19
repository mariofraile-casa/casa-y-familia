// Datos iniciales de la app. Solo se usan la primera vez (o al «Empezar de cero» en Ajustes).

const r = (name, ingredients) => ({ id: 'r_' + name.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').slice(0, 14), name, ingredients });
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
    // Recetario de platos habituales: propuesta para cambiar por los vuestros.
    recipes: [
      r('Tortilla de patatas', [i(1, 'kg', 'Patatas'), i(8, 'ud', 'Huevos'), i(1, 'ud', 'Cebolla')]),
      r('Pasta boloñesa', [i(500, 'g', 'Pasta'), i(400, 'g', 'Carne picada'), i(1, 'ud', 'Tomate frito'), i(1, 'ud', 'Cebolla')]),
      r('Merluza al horno con patatas', [i(800, 'g', 'Merluza'), i(1, 'kg', 'Patatas'), i(1, 'ud', 'Limón')]),
      r('Paella', [i(400, 'g', 'Arroz'), i(500, 'g', 'Pollo troceado'), i(300, 'g', 'Judías verdes'), i(1, 'ud', 'Pimiento rojo')]),
      r('Lentejas con verduras', [i(500, 'g', 'Lentejas'), i(2, 'ud', 'Zanahorias'), i(1, 'ud', 'Cebolla'), i(1, 'ud', 'Pimiento verde')]),
      r('Cocido', [i(500, 'g', 'Garbanzos'), i(500, 'g', 'Morcillo'), i(1, 'ud', 'Chorizo'), i(2, 'ud', 'Zanahorias'), i(200, 'g', 'Fideos')]),
      r('Pizza casera', [i(1, 'ud', 'Masa de pizza'), i(200, 'g', 'Mozzarella'), i(1, 'ud', 'Tomate frito'), i(150, 'g', 'Jamón york')]),
      r('Pollo al limón con arroz', [i(800, 'g', 'Pechuga de pollo'), i(2, 'ud', 'Limón'), i(300, 'g', 'Arroz')]),
      r('Crema de verduras', [i(2, 'ud', 'Calabacín'), i(1, 'ud', 'Puerro'), i(3, 'ud', 'Zanahorias'), i(1, 'kg', 'Patatas')]),
      r('Sopa de fideos', [i(1, 'l', 'Caldo de pollo'), i(200, 'g', 'Fideos')]),
      r('Hamburguesas caseras', [i(600, 'g', 'Carne picada'), i(4, 'ud', 'Pan de hamburguesa'), i(1, 'ud', 'Lechuga'), i(2, 'ud', 'Tomates')]),
      r('Arroz a la cubana', [i(400, 'g', 'Arroz'), i(4, 'ud', 'Huevos'), i(1, 'ud', 'Tomate frito'), i(4, 'ud', 'Plátanos')]),
      r('Wok de pollo con verduras', [i(600, 'g', 'Pechuga de pollo'), i(1, 'paq', 'Verduras para wok'), i(1, 'ud', 'Salsa de soja')]),
      r('Pasta con tomate y atún', [i(500, 'g', 'Pasta'), i(3, 'lata', 'Atún'), i(1, 'ud', 'Tomate frito')]),
      r('Revuelto de setas con jamón', [i(400, 'g', 'Setas'), i(6, 'ud', 'Huevos'), i(100, 'g', 'Jamón serrano')])
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
