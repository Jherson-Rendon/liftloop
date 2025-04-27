import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { saveUser } from "~/lib/storage";
import { collection, setDoc, doc } from "firebase/firestore";
import { db } from "~/lib/firebaseConfig";

console.log('[Profile New] Module loaded');

export async function action({ request }: ActionFunctionArgs) {
  console.log('[Profile New Action] Iniciando action');
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const weight = formData.get("weight") as string;
  const color = formData.get("color") as string;
  const age = formData.get("age") as string;
  const height = formData.get("height") as string;
  const code = formData.get("code") as string;

  console.log('[Profile New Action] Form data:', { name, weight, color, age, height, code });

  if (!name || !weight || !color || !age || !height || !code) {
    console.log('[Profile New Action] Faltan campos:', { name, weight, color, age, height, code });
    return { error: "Todos los campos son requeridos" };
  }

  if (!/^[0-9]{4}$/.test(code)) {
    console.log('[Profile New Action] Código inválido:', code);
    return { error: "El código debe ser exactamente 4 dígitos numéricos." };
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    avatar: "",
    color,
    weight: [parseFloat(weight)],
    weightDates: [new Date().toISOString()],
    createdAt: new Date().toISOString(),
    age: parseInt(age),
    height: parseFloat(height),
    code,
  };

  console.log('[Profile New Action] Created user object:', user);

  try {
    // Ya no se valida unicidad del código
    console.log('[Profile New Action] Attempting to save user');
    await setDoc(doc(collection(db, "users"), user.id), user);
    console.log('[Profile New Action] Usuario guardado en Firestore:', user);

    return redirect("/profile/select");
  } catch (error) {
    console.error("[Profile New Action] Error al guardar usuario:", error);
    return { error: "Error al guardar el usuario. Por favor, intenta de nuevo." };
  }
}

export default function NewProfile() {
  console.log('[Profile New] Rendering component');
  const actionData = useActionData<{ error?: string }>();

  const colors = [
    "#2563eb", // blue-600
    "#dc2626", // red-600
    "#16a34a", // green-600
    "#9333ea", // purple-600
    "#ea580c", // orange-600
    "#0891b2", // cyan-600
  ];

  console.log('[Profile New] Colors array:', colors);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Crear Perfil
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Ingresa tus datos para comenzar a registrar tu progreso
          </p>
        </div>

        <Form method="post" className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {actionData?.error && (
              <div className="text-red-600 text-center font-semibold mb-4">{actionData.error}</div>
            )}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nombre
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Edad
              </label>
              <input
                type="number"
                name="age"
                id="age"
                required
                min="1"
                max="120"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="height"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Altura (cm)
              </label>
              <input
                type="number"
                name="height"
                id="height"
                required
                min="50"
                max="250"
                step="0.1"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="weight"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Peso Actual (kg)
              </label>
              <input
                type="number"
                name="weight"
                id="weight"
                required
                min="20"
                step="0.1"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Código de acceso (4 dígitos)
              </label>
              <input
                type="text"
                name="code"
                id="code"
                required
                pattern="[0-9]{4}"
                minLength={4}
                maxLength={4}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ej: 1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color de Perfil
              </label>
              <div className="grid grid-cols-6 gap-3">
                {colors.map((color) => (
                  <div key={color} className="relative">
                    <input
                      type="radio"
                      id={`color-${color}`}
                      name="color"
                      value={color}
                      className="sr-only peer"
                      required
                    />
                    <label
                      className="flex aspect-square rounded-full peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-blue-500 cursor-pointer"
                      style={{ backgroundColor: color }}
                      htmlFor={`color-${color}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Crear Perfil
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}