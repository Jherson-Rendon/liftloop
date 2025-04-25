import { Machine } from "./storage";

export const initialMachines: Machine[] = [
  {
    id: 1,
    name: "Press de Banca",
    image: "bench-press.png",
    category: "Pecho"
  },
  {
    id: 2,
    name: "Prensa de Piernas",
    image: "leg-press.png",
    category: "Piernas"
  },
  {
    id: 3,
    name: "Polea Alta",
    image: "lat-pulldown.png",
    category: "Espalda"
  },
  {
    id: 4,
    name: "Curl de Bíceps",
    image: "bicep-curl.png",
    category: "Brazos"
  },
  {
    id: 5,
    name: "Press Militar",
    image: "shoulder-press.png",
    category: "Hombros"
  },
  {
    id: 6,
    name: "Extensión de Tríceps",
    image: "tricep-extension.png",
    category: "Brazos"
  }
]; 