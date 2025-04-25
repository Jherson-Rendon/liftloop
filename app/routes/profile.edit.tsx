import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { getCurrentUser, saveUser } from "~/lib/storage";

export async function loader({ request }: LoaderFunctionArgs) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return redirect("/");
  }
  return { currentUser };
}

export async function action({ request }: ActionFunctionArgs) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return redirect("/");
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const weight = formData.get("weight") as string;
  const color = formData.get("color") as string;

  if (!name || !weight || !color) {
    return { error: "Todos los campos son requeridos" };
  }

  const updatedUser = {
    ...currentUser,
    name,
    color,
    weight: [...(currentUser.weight || []), parseFloat(weight)],
    weightDates: [...(currentUser.weightDates || []), new Date().toISOString()],
  };

  await saveUser(updatedUser);
  return redirect("/");
}

export default function EditProfile() {
  const { currentUser } = useLoaderData<typeof loader>();
  const colors = [
    "#2563eb", // blue-600
    "#dc2626", // red-600
    "#16a34a", // green-600
    "#9333ea", // purple-600
    "#ea580c", // orange-600
    "#0891b2", // cyan-600
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Editar Perfil
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Actualiza tus datos de perfil
          </p>
        </div>

        <Form method="post" className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8">
          <div className="space-y-6">
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
                defaultValue={currentUser.name}
                required
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
                defaultValue={currentUser.weight?.[currentUser.weight.length - 1]}
                required
                min="20"
                step="0.1"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                      name="color"
                      value={color}
                      defaultChecked={color === currentUser.color}
                      className="sr-only peer"
                      required
                    />
                    <label
                      className="flex aspect-square rounded-full peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-blue-500 cursor-pointer"
                      style={{ backgroundColor: color }}
                      htmlFor={color}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Cambios
              </button>
              <a
                href="/"
                className="flex-1 bg-gray-200 dark:bg-zinc-700 text-center text-gray-900 dark:text-gray-100 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancelar
              </a>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
} 