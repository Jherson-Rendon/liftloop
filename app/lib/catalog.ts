export interface CatalogMachine {
    id: string;
    name: string;
    category: string;
    image: string;
}

export const MACHINE_CATALOG: CatalogMachine[] = [
    // Pecho
    { id: 'bench-press', name: 'Press de Banca', category: 'Pecho', image: 'Bench_press.png' },
    { id: 'incline-bench-press', name: 'Press Inclinado', category: 'Pecho', image: 'default-machine.png' },
    { id: 'chest-fly', name: 'Aperturas (Fly)', category: 'Pecho', image: 'default-machine.png' },
    { id: 'pec-deck', name: 'Pec Deck / Mariposa', category: 'Pecho', image: 'default-machine.png' },

    // Espalda
    { id: 'lat-pulldown', name: 'Polea al Pecho (Lat Pulldown)', category: 'Espalda', image: 'lat-pulldown.png' },
    { id: 'seated-row', name: 'Remo Sentado', category: 'Espalda', image: 'default-machine.png' },
    { id: 'pull-up', name: 'Dominadas', category: 'Espalda', image: 'default-machine.png' },
    { id: 't-bar-row', name: 'Remo en T', category: 'Espalda', image: 'default-machine.png' },

    // Piernas
    { id: 'squat', name: 'Sentadilla (Squat)', category: 'Piernas', image: 'default-machine.png' },
    { id: 'leg-press', name: 'Prensa de Piernas', category: 'Piernas', image: 'leg-press.png' },
    { id: 'leg-extension', name: 'Extensión de Cuádriceps', category: 'Piernas', image: 'default-machine.png' },
    { id: 'leg-curl', name: 'Curl de Femoral', category: 'Piernas', image: 'default-machine.png' },
    { id: 'calf-raise', name: 'Elevación de Gemelos', category: 'Piernas', image: 'default-machine.png' },

    // Hombros
    { id: 'shoulder-press', name: 'Press Militar / Hombros', category: 'Hombros', image: 'shoulder-press.png' },
    { id: 'lateral-raise', name: 'Elevaciones Laterales', category: 'Hombros', image: 'default-machine.png' },
    { id: 'face-pull', name: 'Face Pull', category: 'Hombros', image: 'default-machine.png' },

    // Brazos
    { id: 'bicep-curl', name: 'Curl de Bíceps', category: 'Brazos', image: 'bicep-curl.png' },
    { id: 'tricep-extension', name: 'Extensión de Tríceps', category: 'Brazos', image: 'tricep-extension.png' },
    { id: 'hammer-curl', name: 'Curl Martillo', category: 'Brazos', image: 'default-machine.png' },
    { id: 'dips', name: 'Fondos (Dips)', category: 'Brazos', image: 'default-machine.png' },

    // Abdomen
    { id: 'crunch', name: 'Abdominales (Crunch)', category: 'Abdomen', image: 'default-machine.png' },
    { id: 'plank', name: 'Plancha', category: 'Abdomen', image: 'default-machine.png' },
    { id: 'leg-raise', name: 'Elevación de Piernas', category: 'Abdomen', image: 'default-machine.png' },
];
